import { GoogleGenerativeAI } from '@google/generative-ai';
import { chatService, ChatMessage, ChatContext, ChatConversation } from './chatService';
import { databaseProjectsService } from './databaseProjectsService';

export interface AIChatRequest {
  conversationId: string;
  message: string;
  includeContext?: boolean;
  contextTypes?: ChatContext['context_type'][];
}

export interface AIChatResponse {
  message: ChatMessage;
  tokensUsed: number;
  processingTimeMs: number;
  contextUsed: ChatContext[];
}

export interface DatabaseAwareContext {
  schema?: any;
  recentQueries?: any[];
  projectData?: any;
  sessionData?: any;
  analysisResults?: any;
}

class AIChatService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });
  }

  async sendMessage(userId: string, request: AIChatRequest): Promise<AIChatResponse> {
    const startTime = Date.now();
    
    try {
      // Get conversation to understand context
      const conversation = await chatService.getConversation(request.conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Create user message
      const userMessage = await chatService.createMessage(userId, {
        conversation_id: request.conversationId,
        role: 'user',
        content: request.message
      });

      // Get conversation history
      const messageHistory = await chatService.getConversationMessages(request.conversationId);
      
      // Get relevant context if requested
      let contextUsed: ChatContext[] = [];
      let databaseContext: DatabaseAwareContext = {};
      
      if (request.includeContext !== false) {
        contextUsed = await chatService.getConversationContext(
          request.conversationId,
          request.contextTypes,
          20
        );

        // Build database-aware context
        databaseContext = await this.buildDatabaseContext(conversation, contextUsed);
      }

      // Generate AI response
      const systemPrompt = this.buildSystemPrompt(conversation, databaseContext);
      const conversationPrompt = this.buildConversationPrompt(messageHistory, request.message);
      
      const fullPrompt = `${systemPrompt}\n\n${conversationPrompt}`;
      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const aiResponseText = response.text();

      // Estimate tokens (rough approximation)
      const tokensUsed = Math.ceil((fullPrompt.length + aiResponseText.length) / 4);
      const processingTime = Date.now() - startTime;

      // Create assistant message
      const assistantMessage = await chatService.createMessage(userId, {
        conversation_id: request.conversationId,
        role: 'assistant',
        content: aiResponseText,
        metadata: {
          model: 'gemini-2.5-flash-lite-preview-06-17',
          tokens_used: tokensUsed,
          processing_time_ms: processingTime,
          context_types_used: contextUsed.map(c => c.context_type)
        },
        context_data: {
          database_context: databaseContext,
          context_count: contextUsed.length
        }
      });

      // Update message with actual stats
      await chatService.updateMessage(assistantMessage.id, {
        tokens_used: tokensUsed,
        processing_time_ms: processingTime,
        model_used: 'gemini-2.5-flash-lite-preview-06-17'
      });

      return {
        message: assistantMessage,
        tokensUsed,
        processingTimeMs: processingTime,
        contextUsed
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Create error message
      const errorMessage = await chatService.createMessage(userId, {
        conversation_id: request.conversationId,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your message. Please try again.',
        metadata: {
          error: true,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  private async buildDatabaseContext(
    conversation: ChatConversation, 
    contextData: ChatContext[]
  ): Promise<DatabaseAwareContext> {
    const context: DatabaseAwareContext = {};

    try {
      // If conversation is linked to a project, get project data
      if (conversation.project_id) {
        const project = await databaseProjectsService.getProject(conversation.project_id);
        if (project) {
          context.projectData = {
            name: project.database_name,
            type: project.database_type,
            description: project.description,
            metadata: project.metadata
          };

          // Get recent sessions and queries
          const sessions = await databaseProjectsService.getProjectSessions(conversation.project_id);
          if (sessions.length > 0) {
            const recentSession = sessions[0];
            const recentQueries = await databaseProjectsService.getSessionQueries(recentSession.id);
            
            context.sessionData = {
              session_name: recentSession.session_name,
              description: recentSession.description,
              query_count: recentSession.query_count
            };

            context.recentQueries = recentQueries.slice(0, 10).map(q => ({
              query_text: q.query_text,
              query_type: q.query_type,
              success: q.success,
              row_count: q.row_count,
              execution_time_ms: q.execution_time_ms,
              created_at: q.created_at
            }));
          }
        }
      }

      // Process context data by type
      for (const ctx of contextData) {
        switch (ctx.context_type) {
          case 'schema':
            context.schema = ctx.context_value;
            break;
          case 'analysis_results':
            context.analysisResults = ctx.context_value;
            break;
          case 'query_history':
            if (!context.recentQueries) {
              context.recentQueries = [];
            }
            context.recentQueries.push(ctx.context_value);
            break;
        }
      }

    } catch (error) {
      console.error('Error building database context:', error);
    }

    return context;
  }

  private buildSystemPrompt(conversation: ChatConversation, dbContext: DatabaseAwareContext): string {
    let prompt = `You are DBCoach AI, an expert database consultant and assistant. You help users with database design, optimization, querying, and analysis.

Your capabilities include:
- Database schema design and optimization
- SQL query writing and optimization
- Data analysis and insights
- Database performance troubleshooting
- Best practices recommendations
- Code generation for database operations

`;

    // Add context-specific instructions
    if (conversation.context_type === 'database' || conversation.context_type === 'project') {
      prompt += `You are currently assisting with a specific database project. `;
      
      if (dbContext.projectData) {
        prompt += `The project is "${dbContext.projectData.name}" (${dbContext.projectData.type} database)`;
        if (dbContext.projectData.description) {
          prompt += ` - ${dbContext.projectData.description}`;
        }
        prompt += `.\n\n`;
      }

      if (dbContext.schema) {
        prompt += `Database Schema Information:
${JSON.stringify(dbContext.schema, null, 2)}

`;
      }

      if (dbContext.recentQueries && dbContext.recentQueries.length > 0) {
        prompt += `Recent Database Activity:
`;
        dbContext.recentQueries.slice(0, 5).forEach((query, index) => {
          prompt += `${index + 1}. ${query.query_type} query (${query.success ? 'successful' : 'failed'})
   SQL: ${query.query_text}
   Rows affected: ${query.row_count || 'N/A'}
   Execution time: ${query.execution_time_ms || 'N/A'}ms
   Time: ${query.created_at}

`;
        });
      }

      if (dbContext.analysisResults) {
        prompt += `Previous Analysis Results:
${JSON.stringify(dbContext.analysisResults, null, 2)}

`;
      }
    }

    prompt += `Guidelines:
- Be helpful, accurate, and concise
- When suggesting SQL queries, provide complete, runnable examples
- Explain your reasoning and best practices
- If you're unsure about something, ask clarifying questions
- Always consider performance and security implications
- Use the database context provided to give relevant, specific advice
- If asked about tables or data not in the provided context, acknowledge what you don't know

Please respond in a helpful, professional manner.`;

    return prompt;
  }

  private buildConversationPrompt(messages: ChatMessage[], newMessage: string): string {
    let prompt = 'Conversation History:\n';

    // Include last 10 messages for context
    const recentMessages = messages.slice(-10);
    
    for (const message of recentMessages) {
      const role = message.role === 'user' ? 'User' : 'Assistant';
      prompt += `${role}: ${message.content}\n`;
    }

    prompt += `\nUser: ${newMessage}\n\nAssistant:`;
    
    return prompt;
  }

  async updateConversationContext(
    conversationId: string,
    contextType: ChatContext['context_type'],
    contextKey: string,
    contextValue: any,
    relevanceScore: number = 1.0,
    expiresInHours?: number
  ): Promise<void> {
    try {
      let expiresAt: string | undefined;
      if (expiresInHours) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + expiresInHours);
        expiresAt = expiry.toISOString();
      }

      await chatService.createContext({
        conversation_id: conversationId,
        context_type: contextType,
        context_key: contextKey,
        context_value: contextValue,
        relevance_score: relevanceScore,
        expires_at: expiresAt
      });
    } catch (error) {
      console.error('Error updating conversation context:', error);
      throw error;
    }
  }

  async addSchemaContext(
    conversationId: string,
    schema: any,
    relevanceScore: number = 1.0
  ): Promise<void> {
    await this.updateConversationContext(
      conversationId,
      'schema',
      'database_schema',
      schema,
      relevanceScore,
      24 // Expires in 24 hours
    );
  }

  async addQueryHistoryContext(
    conversationId: string,
    queries: any[],
    relevanceScore: number = 0.8
  ): Promise<void> {
    await this.updateConversationContext(
      conversationId,
      'query_history',
      'recent_queries',
      queries,
      relevanceScore,
      6 // Expires in 6 hours
    );
  }

  async addAnalysisContext(
    conversationId: string,
    analysisResults: any,
    relevanceScore: number = 0.9
  ): Promise<void> {
    await this.updateConversationContext(
      conversationId,
      'analysis_results',
      'latest_analysis',
      analysisResults,
      relevanceScore,
      12 // Expires in 12 hours
    );
  }

  async generateConversationTitle(conversationId: string): Promise<string> {
    try {
      const messages = await chatService.getConversationMessages(conversationId);
      if (messages.length === 0) return 'New Conversation';

      const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
      
      if (firstUserMessage.length <= 50) {
        return firstUserMessage;
      }

      const titlePrompt = `Generate a concise, descriptive title (max 50 characters) for a conversation that started with this message: "${firstUserMessage}"

The title should be:
- Clear and descriptive
- Maximum 50 characters
- No quotes or special formatting
- Focused on the main topic

Title:`;

      const result = await this.model.generateContent(titlePrompt);
      const response = await result.response;
      let title = response.text().trim();

      // Clean up the title
      title = title.replace(/^["']|["']$/g, ''); // Remove quotes
      title = title.substring(0, 50); // Ensure max length
      
      return title || 'New Conversation';

    } catch (error) {
      console.error('Error generating conversation title:', error);
      return 'New Conversation';
    }
  }
}

export const aiChatService = new AIChatService();