import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Loader2, 
  Camera, 
  Mail, 
  User, 
  Building, 
  MapPin, 
  Link as LinkIcon,
  Save,
  Trash2
} from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
      email: user?.email || '',
      bio: user?.user_metadata?.bio || '',
      company: user?.user_metadata?.company || '',
      location: user?.user_metadata?.location || '',
      website: user?.user_metadata?.website || '',
    }
  });
  
  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Here you would typically make an API call to update the profile
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-slate-300">
          Manage your personal information and public profile
        </p>
      </div>
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300">
          {errorMessage}
        </div>
      )}
      
      {/* Avatar Section */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-slate-700/50">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <button className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mb-2">
              Upload new picture
            </button>
            <p className="text-xs text-slate-400">
              JPG, GIF or PNG. Max size of 2MB.
            </p>
          </div>
        </div>
      </div>
      
      {/* Profile Form */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <User className="h-4 w-4" />
              Name
            </label>
            <input
              id="name"
              {...form.register('name')}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-400">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <input
              id="email"
              type="email"
              {...form.register('email')}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-400">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium text-slate-300">Bio</label>
            <textarea
              id="bio"
              {...form.register('bio')}
              placeholder="Tell us a little about yourself"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-between">
              {form.formState.errors.bio && (
                <p className="text-sm text-red-400">
                  {form.formState.errors.bio.message}
                </p>
              )}
              <p className="text-xs text-slate-400 ml-auto">
                {form.watch('bio')?.length || 0}/160 characters
              </p>
            </div>
          </div>
          
          {/* Company Field */}
          <div className="space-y-2">
            <label htmlFor="company" className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Building className="h-4 w-4" />
              Company
            </label>
            <input
              id="company"
              {...form.register('company')}
              placeholder="Where do you work?"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          {/* Location Field */}
          <div className="space-y-2">
            <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <MapPin className="h-4 w-4" />
              Location
            </label>
            <input
              id="location"
              {...form.register('location')}
              placeholder="City, Country"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          {/* Website Field */}
          <div className="space-y-2">
            <label htmlFor="website" className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <LinkIcon className="h-4 w-4" />
              Website
            </label>
            <input
              id="website"
              {...form.register('website')}
              placeholder="https://your-website.com"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {form.formState.errors.website && (
              <p className="text-sm text-red-400">
                {form.formState.errors.website.message}
              </p>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
      
      {/* Danger Zone */}
      <div className="p-6 rounded-xl bg-red-900/20 border border-red-500/30 backdrop-blur">
        <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Delete Account</p>
            <p className="text-sm text-slate-300">
              Permanently delete your account and all data
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}