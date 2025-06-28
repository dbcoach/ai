import { supabase, handleAuthError } from '../lib/supabase';

export interface ChatConversation {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  context_type: 'general' | 'database' | 'project' | 'session';
  context_metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  tokens_used: number;
  processing_time_ms: number;
  model_used?: string;
  context_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChatContext {
  id: string;
  conversation_id: string;
  context_type: 'schema' | 'query_history' | 'project_data' | 'session_data' | 'analysis_results';
  context_key: string;
  context_value: Record<string, unknown>;
  relevance_score: number;
  created_at: string;
  expires_at?: string;
}

export interface CreateConversationRequest {
  title?: string;
  project_id?: string;
  context_type?: ChatConversation['context_type'];
  context_metadata?: Record<string, unknown>;
}

export interface CreateMessageRequest {
  conversation_id: string;
  role: ChatMessage['role'];
  content: string;
  metadata?: Record<string, any>;
  context_data?: Record<string, any>;
}

export interface CreateContextRequest {
  conversation_id: string;
  context_type: ChatContext['context_type'];
  context_key: string;
  context_value: Record<string, unknown>;
  relevance_score?: number;
  expires_at?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string;
  context_types: string[];
}

export interface ChatUsageStats {
  total_conversations: number;
  total_messages: number;
  total_tokens_used: number;
  average_response_time: number;
  conversations_today: number;
  messages_today: number;
}

class ChatService {
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        await handleAuthError(error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  private validateConversationTitle(title: string): void {
    if (title && typeof title === 'string') {
      if (title.length > 200) {
        throw new Error('Conversation title is too long (max 200 characters)');
      }
    }
  }

  async createConversation(userId: string, request: CreateConversationRequest): Promise<ChatConversation> {
    try {
      const title = request.title || 'New Conversation';
      
      // Validate input
      this.validateConversationTitle(title);
      
      const conversationData = {
        user_id: userId,
        title: this.sanitizeString(title),
        project_id: request.project_id,
        context_type: request.context_type || 'general',
        context_metadata: request.context_metadata || {}
      };

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert(conversationData)
        .select()
        .single();

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async updateConversation(
    conversationId: string, 
    updates: Partial<Pick<ChatConversation, 'title' | 'context_metadata' | 'is_active'>>
  ): Promise<ChatConversation> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      if (error) {
        await handleAuthError(error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  private sanitizeString(str: string): string {
    // Basic sanitization - remove potentially dangerous characters
    return str
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\0/g, '') // Remove null bytes
      .slice(0, 10000); // Limit length
  }

  private validateMessageContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new Error('Message content is required and must be a string');
    }
    
    if (content.length > 10000) {
      throw new Error('Message content is too long (max 10,000 characters)');
    }
    
    if (content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
  }

  async createMessage(userId: string, request: CreateMessageRequest): Promise<ChatMessage> {
    try {
      // Validate and sanitize input
      this.validateMessageContent(request.content);
      
      const messageData = {
        conversation_id: request.conversation_id,
        user_id: userId,
        role: request.role,
        content: this.sanitizeString(request.content),
        metadata: request.metadata || {},
        context_data: request.context_data || {}
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async updateMessage(
    messageId: string, 
    updates: Partial<Pick<ChatMessage, 'content' | 'metadata' | 'tokens_used' | 'processing_time_ms' | 'model_used'>>
  ): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update(updates)
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  async getConversationContext(
    conversationId: string, 
    contextTypes?: ChatContext['context_type'][], 
    limit: number = 50
  ): Promise<ChatContext[]> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_context', {
        conversation_uuid: conversationId,
        context_types: contextTypes,
        limit_rows: limit
      });

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversation context:', error);
      throw error;
    }
  }

  async createContext(request: CreateContextRequest): Promise<ChatContext> {
    try {
      const contextData = {
        conversation_id: request.conversation_id,
        context_type: request.context_type,
        context_key: request.context_key,
        context_value: request.context_value,
        relevance_score: request.relevance_score || 1.0,
        expires_at: request.expires_at
      };

      const { data, error } = await supabase
        .from('chat_context')
        .upsert(contextData, { 
          onConflict: 'conversation_id,context_type,context_key' 
        })
        .select()
        .single();

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating context:', error);
      throw error;
    }
  }

  async getConversationSummary(conversationId: string): Promise<ConversationSummary | null> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_summary', {
        conversation_uuid: conversationId
      });

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching conversation summary:', error);
      throw error;
    }
  }

  async getChatUsageStats(userId: string): Promise<ChatUsageStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [conversationsQuery, messagesQuery, tokensQuery, responseTimeQuery] = await Promise.all([
        supabase
          .from('chat_conversations')
          .select('id, created_at')
          .eq('user_id', userId)
          .eq('is_active', true),
        
        supabase
          .from('chat_messages')
          .select('id, created_at, tokens_used, processing_time_ms')
          .eq('user_id', userId),
        
        supabase
          .from('chat_messages')
          .select('tokens_used')
          .eq('user_id', userId)
          .not('tokens_used', 'is', null),
        
        supabase
          .from('chat_messages')
          .select('processing_time_ms')
          .eq('user_id', userId)
          .eq('role', 'assistant')
          .not('processing_time_ms', 'is', null)
      ]);

      const conversations = conversationsQuery.data || [];
      const messages = messagesQuery.data || [];
      const tokensData = tokensQuery.data || [];
      const responseTimeData = responseTimeQuery.data || [];

      const conversationsToday = conversations.filter(c => 
        c.created_at.startsWith(today)
      ).length;

      const messagesToday = messages.filter(m => 
        m.created_at.startsWith(today)
      ).length;

      const totalTokens = tokensData.reduce((sum, m) => sum + (m.tokens_used || 0), 0);
      const averageResponseTime = responseTimeData.length > 0
        ? responseTimeData.reduce((sum, m) => sum + (m.processing_time_ms || 0), 0) / responseTimeData.length
        : 0;

      return {
        total_conversations: conversations.length,
        total_messages: messages.length,
        total_tokens_used: totalTokens,
        average_response_time: Math.round(averageResponseTime),
        conversations_today: conversationsToday,
        messages_today: messagesToday
      };
    } catch (error) {
      console.error('Error fetching chat usage stats:', error);
      throw error;
    }
  }

  async cleanupExpiredContext(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_context');

      if (error) {
        await handleAuthError(error);
        throw error;
      }

      return data || 0;
    } catch (error) {
      console.error('Error cleaning up expired context:', error);
      throw error;
    }
  }

  subscribeToConversationMessages(
    conversationId: string, 
    callback: (message: ChatMessage) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel(`chat_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  }

  subscribeToUserConversations(
    userId: string, 
    callback: (conversation: ChatConversation) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel(`chat_conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as ChatConversation);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  }
}

export const chatService = new ChatService();