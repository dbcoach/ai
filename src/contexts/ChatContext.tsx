import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  chatService, 
  ChatConversation, 
  ChatMessage, 
  CreateConversationRequest,
  ChatUsageStats
} from '../services/chatService';
import { aiChatService, AIChatRequest } from '../services/aiChatService';

interface ChatContextType {
  // Conversations
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  loadingConversations: boolean;
  
  // Messages
  messages: ChatMessage[];
  loadingMessages: boolean;
  
  // Actions
  createConversation: (request: CreateConversationRequest) => Promise<ChatConversation>;
  selectConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  sendMessage: (request: AIChatRequest) => Promise<void>;
  
  // State
  isTyping: boolean;
  error: string | null;
  usageStats: ChatUsageStats | null;
  
  // Utility
  refreshConversations: () => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<ChatUsageStats | null>(null);

  // Subscriptions
  const [messageSubscription, setMessageSubscription] = useState<{ unsubscribe: () => void } | null>(null);
  const [conversationSubscription, setConversationSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  // Load conversations when user changes
  useEffect(() => {
    if (user?.id) {
      refreshConversations();
      loadUsageStats();
      setupConversationSubscription();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setUsageStats(null);
      cleanupSubscriptions();
    }

    return () => {
      cleanupSubscriptions();
    };
  }, [user?.id]);

  // Setup message subscription when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      setupMessageSubscription(currentConversation.id);
    } else {
      cleanupMessageSubscription();
    }

    return () => {
      cleanupMessageSubscription();
    };
  }, [currentConversation?.id]);

  const setupConversationSubscription = useCallback(() => {
    if (!user?.id) return;

    cleanupConversationSubscription();

    const subscription = chatService.subscribeToUserConversations(
      user.id,
      (conversation) => {
        setConversations(prev => {
          const existing = prev.find(c => c.id === conversation.id);
          if (existing) {
            return prev.map(c => c.id === conversation.id ? conversation : c);
          } else {
            return [conversation, ...prev];
          }
        });
      }
    );

    setConversationSubscription(subscription);
  }, [user?.id]);

  const setupMessageSubscription = useCallback((conversationId: string) => {
    cleanupMessageSubscription();

    const subscription = chatService.subscribeToConversationMessages(
      conversationId,
      (message) => {
        setMessages(prev => [...prev, message]);
        setIsTyping(false);
      }
    );

    setMessageSubscription(subscription);
  }, []);

  const cleanupSubscriptions = useCallback(() => {
    cleanupMessageSubscription();
    cleanupConversationSubscription();
  }, []);

  const cleanupMessageSubscription = useCallback(() => {
    if (messageSubscription) {
      messageSubscription.unsubscribe();
      setMessageSubscription(null);
    }
  }, [messageSubscription]);

  const cleanupConversationSubscription = useCallback(() => {
    if (conversationSubscription) {
      conversationSubscription.unsubscribe();
      setConversationSubscription(null);
    }
  }, [conversationSubscription]);

  const refreshConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingConversations(true);
      setError(null);
      
      const fetchedConversations = await chatService.getUserConversations(user.id);
      setConversations(fetchedConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id]);

  const loadUsageStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const stats = await chatService.getChatUsageStats(user.id);
      setUsageStats(stats);
    } catch (err) {
      console.error('Error loading usage stats:', err);
    }
  }, [user?.id]);

  const createConversation = useCallback(async (request: CreateConversationRequest): Promise<ChatConversation> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);
      
      const conversation = await chatService.createConversation(user.id, request);
      
      // Auto-generate title if not provided and we can access AI service
      if (!request.title || request.title === 'New Conversation') {
        try {
          const generatedTitle = await aiChatService.generateConversationTitle(conversation.id);
          if (generatedTitle !== 'New Conversation') {
            await chatService.updateConversation(conversation.id, { title: generatedTitle });
            conversation.title = generatedTitle;
          }
        } catch (titleError) {
          console.warn('Could not generate conversation title:', titleError);
        }
      }
      
      setConversations(prev => [conversation, ...prev]);
      await loadUsageStats();
      
      return conversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      throw err;
    }
  }, [user?.id, loadUsageStats]);

  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      setError(null);
      
      const [conversation, conversationMessages] = await Promise.all([
        chatService.getConversation(conversationId),
        chatService.getConversationMessages(conversationId)
      ]);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      setCurrentConversation(conversation);
      setMessages(conversationMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
      console.error('Error selecting conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      setError(null);
      
      await chatService.updateConversation(conversationId, { title });
      
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title } : c
      ));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, title } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation title');
      throw err;
    }
  }, [currentConversation?.id]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      
      await chatService.deleteConversation(conversationId);
      
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      await loadUsageStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
      throw err;
    }
  }, [currentConversation?.id, loadUsageStats]);

  const sendMessage = useCallback(async (request: AIChatRequest) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);
      setIsTyping(true);
      
      await aiChatService.sendMessage(user.id, request);
      await loadUsageStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsTyping(false);
      throw err;
    }
  }, [user?.id, loadUsageStats]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ChatContextType = {
    // Conversations
    conversations,
    currentConversation,
    loadingConversations,
    
    // Messages
    messages,
    loadingMessages,
    
    // Actions
    createConversation,
    selectConversation,
    updateConversationTitle,
    deleteConversation,
    sendMessage,
    
    // State
    isTyping,
    error,
    usageStats,
    
    // Utility
    refreshConversations,
    clearError
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}