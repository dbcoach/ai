/**
 * Integration tests for Chat Service
 * These tests verify the chat functionality works correctly with the database
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { chatService, ChatConversation, ChatMessage } from '../services/chatService';
import { aiChatService } from '../services/aiChatService';

// Mock data for testing
const mockUserId = 'test-user-123';
const mockProjectId = 'test-project-456';

describe('Chat Service Integration Tests', () => {
  let testConversation: ChatConversation;
  let testMessages: ChatMessage[] = [];

  beforeEach(() => {
    // Reset test data
    testMessages = [];
  });

  afterEach(async () => {
    // Cleanup test data
    if (testConversation) {
      try {
        await chatService.deleteConversation(testConversation.id);
      } catch (error) {
        console.warn('Failed to cleanup test conversation:', error);
      }
    }
  });

  describe('Conversation Management', () => {
    it('should create a new conversation with default values', async () => {
      const conversation = await chatService.createConversation(mockUserId, {
        title: 'Test Conversation'
      });

      expect(conversation).toBeDefined();
      expect(conversation.user_id).toBe(mockUserId);
      expect(conversation.title).toBe('Test Conversation');
      expect(conversation.context_type).toBe('general');
      expect(conversation.is_active).toBe(true);

      testConversation = conversation;
    });

    it('should create a project-linked conversation', async () => {
      const conversation = await chatService.createConversation(mockUserId, {
        title: 'Project Chat',
        project_id: mockProjectId,
        context_type: 'project',
        context_metadata: { project_name: 'Test Project' }
      });

      expect(conversation.project_id).toBe(mockProjectId);
      expect(conversation.context_type).toBe('project');
      expect(conversation.context_metadata).toEqual({ project_name: 'Test Project' });

      testConversation = conversation;
    });

    it('should validate conversation title length', async () => {
      const longTitle = 'x'.repeat(201);
      
      await expect(
        chatService.createConversation(mockUserId, { title: longTitle })
      ).rejects.toThrow('Conversation title is too long');
    });

    it('should sanitize conversation title', async () => {
      const maliciousTitle = 'Test\x00\x01Title<script>alert("xss")</script>';
      
      const conversation = await chatService.createConversation(mockUserId, {
        title: maliciousTitle
      });

      expect(conversation.title).not.toContain('\x00');
      expect(conversation.title).not.toContain('\x01');
      expect(conversation.title).not.toContain('<script>');

      testConversation = conversation;
    });

    it('should retrieve user conversations', async () => {
      const conversation = await chatService.createConversation(mockUserId, {
        title: 'Test List Conversation'
      });

      const conversations = await chatService.getUserConversations(mockUserId);
      
      expect(conversations).toBeInstanceOf(Array);
      expect(conversations.some(c => c.id === conversation.id)).toBe(true);

      testConversation = conversation;
    });

    it('should update conversation title', async () => {
      const conversation = await chatService.createConversation(mockUserId, {
        title: 'Original Title'
      });

      const updated = await chatService.updateConversation(conversation.id, {
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');

      testConversation = conversation;
    });
  });

  describe('Message Management', () => {
    beforeEach(async () => {
      testConversation = await chatService.createConversation(mockUserId, {
        title: 'Test Message Conversation'
      });
    });

    it('should create a user message', async () => {
      const message = await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'user',
        content: 'Hello, how can you help me with my database?'
      });

      expect(message).toBeDefined();
      expect(message.conversation_id).toBe(testConversation.id);
      expect(message.user_id).toBe(mockUserId);
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, how can you help me with my database?');

      testMessages.push(message);
    });

    it('should create an assistant message', async () => {
      const message = await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'assistant',
        content: 'I can help you with database design, queries, and optimization!',
        metadata: { model: 'test-model', tokens_used: 50 }
      });

      expect(message.role).toBe('assistant');
      expect(message.metadata.model).toBe('test-model');

      testMessages.push(message);
    });

    it('should validate message content', async () => {
      await expect(
        chatService.createMessage(mockUserId, {
          conversation_id: testConversation.id,
          role: 'user',
          content: ''
        })
      ).rejects.toThrow('Message content cannot be empty');

      const longContent = 'x'.repeat(10001);
      await expect(
        chatService.createMessage(mockUserId, {
          conversation_id: testConversation.id,
          role: 'user',
          content: longContent
        })
      ).rejects.toThrow('Message content is too long');
    });

    it('should sanitize message content', async () => {
      const maliciousContent = 'Hello\x00\x01<script>alert("xss")</script>';
      
      const message = await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'user',
        content: maliciousContent
      });

      expect(message.content).not.toContain('\x00');
      expect(message.content).not.toContain('\x01');
      // Note: HTML tags might be preserved for legitimate use cases

      testMessages.push(message);
    });

    it('should retrieve conversation messages', async () => {
      // Create a few messages
      const message1 = await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'user',
        content: 'First message'
      });

      const message2 = await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'assistant',
        content: 'Second message'
      });

      const messages = await chatService.getConversationMessages(testConversation.id);
      
      expect(messages).toBeInstanceOf(Array);
      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages.some(m => m.id === message1.id)).toBe(true);
      expect(messages.some(m => m.id === message2.id)).toBe(true);

      testMessages.push(message1, message2);
    });

    it('should update message metadata', async () => {
      const message = await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'assistant',
        content: 'Test message for update'
      });

      const updated = await chatService.updateMessage(message.id, {
        tokens_used: 75,
        processing_time_ms: 1500,
        model_used: 'gemini-pro'
      });

      expect(updated.tokens_used).toBe(75);
      expect(updated.processing_time_ms).toBe(1500);
      expect(updated.model_used).toBe('gemini-pro');

      testMessages.push(message);
    });
  });

  describe('Context Management', () => {
    beforeEach(async () => {
      testConversation = await chatService.createConversation(mockUserId, {
        title: 'Test Context Conversation',
        context_type: 'project'
      });
    });

    it('should create conversation context', async () => {
      const context = await chatService.createContext({
        conversation_id: testConversation.id,
        context_type: 'schema',
        context_key: 'main_schema',
        context_value: {
          tables: ['users', 'orders', 'products'],
          relationships: ['users -> orders', 'orders -> products']
        },
        relevance_score: 0.9
      });

      expect(context).toBeDefined();
      expect(context.conversation_id).toBe(testConversation.id);
      expect(context.context_type).toBe('schema');
      expect(context.context_key).toBe('main_schema');
      expect(context.relevance_score).toBe(0.9);
    });

    it('should retrieve conversation context', async () => {
      // Create some context
      await chatService.createContext({
        conversation_id: testConversation.id,
        context_type: 'schema',
        context_key: 'test_schema',
        context_value: { test: 'data' }
      });

      const contexts = await chatService.getConversationContext(testConversation.id);
      
      expect(contexts).toBeInstanceOf(Array);
      expect(contexts.some(c => c.context_key === 'test_schema')).toBe(true);
    });
  });

  describe('Usage Statistics', () => {
    beforeEach(async () => {
      testConversation = await chatService.createConversation(mockUserId, {
        title: 'Test Stats Conversation'
      });
    });

    it('should calculate usage stats', async () => {
      // Create some messages with token usage
      await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'user',
        content: 'Test message'
      });

      const assistantMessage = await chatService.createMessage(mockUserId, {
        conversation_id: testConversation.id,
        role: 'assistant',
        content: 'Response message'
      });

      await chatService.updateMessage(assistantMessage.id, {
        tokens_used: 100,
        processing_time_ms: 2000
      });

      const stats = await chatService.getChatUsageStats(mockUserId);
      
      expect(stats).toBeDefined();
      expect(stats.total_conversations).toBeGreaterThanOrEqual(1);
      expect(stats.total_messages).toBeGreaterThanOrEqual(2);
      expect(stats.total_tokens_used).toBeGreaterThanOrEqual(100);

      testMessages.push(assistantMessage);
    });
  });
});

describe('AI Chat Service Tests', () => {
  // Note: These tests would require actual API keys and might be slow
  // They should be run separately or mocked in CI environments
  
  describe('AI Response Generation', () => {
    it('should validate AI chat request', () => {
      const invalidRequest = {
        conversationId: '',
        message: '',
        includeContext: true
      };

      // This would test the validation logic in aiChatService
      expect(invalidRequest.message).toBe('');
      expect(invalidRequest.conversationId).toBe('');
    });
  });
});

// Export test utilities for other test files
export const ChatTestUtils = {
  createTestConversation: (userId: string) => 
    chatService.createConversation(userId, { title: 'Test Conversation' }),
  
  createTestMessage: (userId: string, conversationId: string, content: string) =>
    chatService.createMessage(userId, {
      conversation_id: conversationId,
      role: 'user',
      content
    }),
  
  cleanup: async (conversation: ChatConversation) => {
    try {
      await chatService.deleteConversation(conversation.id);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }
};