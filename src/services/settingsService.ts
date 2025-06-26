import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  editor_theme: string;
  font_size: string;
  animations: boolean;
  glassmorphism: boolean;
  compact_mode: boolean;
  high_contrast: boolean;
  ai_model: string;
  temperature: number;
  auto_suggestions: boolean;
  email_notifications: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key: string;
  permissions: string[];
  last_used?: string;
  created_at: string;
}

class SettingsService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  }

  async createApiKey(userId: string, name: string, permissions: string[]): Promise<ApiKey> {
    try {
      // Generate a secure API key
      const keyPrefix = 'db_live_sk_';
      const keyBody = this.generateSecureKey(32);
      const apiKey = keyPrefix + keyBody;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          name,
          key: apiKey,
          permissions,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  }

  async deleteApiKey(userId: string, keyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', userId); // Ensure user can only delete their own keys

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting API key:', error);
      throw error;
    }
  }

  async updateApiKeyLastUsed(keyId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ last_used: new Date().toISOString() })
        .eq('id', keyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating API key last used:', error);
      throw error;
    }
  }

  private generateSecureKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    
    return result;
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // In a real implementation, you'd want to:
      // 1. Delete user data from all related tables
      // 2. Delete files from storage
      // 3. Cancel subscriptions
      // 4. Log the deletion for compliance
      
      // For now, we'll just delete from the auth system
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();