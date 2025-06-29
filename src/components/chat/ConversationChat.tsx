import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Database, Code, FileText, Loader2 } from 'lucide-react';
import { SavedConversation } from '../../services/conversationStorage';
import { AIChatService } from '../../services/aiChatService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'sql';
}

interface ConversationChatProps {
  conversation: SavedConversation;
  className?: string;
}

export function ConversationChat({ conversation, className = '' }: ConversationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: `Hello! I'm your AI assistant for the "${conversation.title}" database project. I can help you understand the generated schema, explain SQL queries, suggest improvements, or answer any questions about this database design. What would you like to know?`,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
  }, [conversation.title]);


  const generateAIResponse = async (userQuestion: string): Promise<string> => {
    try {
      // Use the enhanced AI chat service
      const response = await AIChatService.generateResponse(conversation, userQuestion);
      return response.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback to a simple response
      return `I apologize, but I encountered an error while analyzing your question about "${userQuestion}". 

However, I can still help you with your **${conversation.title}** database project. Here's what I know:

• **Database Type**: ${conversation.dbType}
• **Generated Components**: ${conversation.tasks.length} completed tasks
• **Original Request**: "${conversation.prompt}"

Please try rephrasing your question, or ask me about:
• Database schema and table structure
• SQL queries and examples  
• Performance optimization tips
• Security best practices
• API design recommendations

What specific aspect of your database would you like to explore?`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate AI response based on conversation data
      const aiResponse = await generateAIResponse(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        type: aiResponse.includes('```') ? 'code' : 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again or rephrase your question.',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (message: ChatMessage) => {
    if (message.type === 'code' && message.content.includes('```')) {
      const parts = message.content.split('```');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          // This is a code block
          const lines = part.split('\n');
          const language = lines[0] || '';
          const code = lines.slice(1).join('\n');
          return (
            <div key={index} className="my-3">
              <div className="bg-slate-900 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-t-lg border-b border-slate-700">
                  <Code className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">{language.toUpperCase()}</span>
                </div>
                <pre className="p-4 text-sm text-slate-200 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          );
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      });
    }

    // Regular text formatting
    return message.content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {index > 0 && <br />}
        {line.startsWith('• ') ? (
          <div className="flex items-start gap-2 my-1">
            <span className="text-purple-400 mt-1">•</span>
            <span>{line.substring(2)}</span>
          </div>
        ) : (
          line
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex flex-col bg-slate-800/30 rounded-lg border border-slate-700/50 ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700/50 bg-slate-800/50">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Database Assistant</h3>
          <p className="text-xs text-slate-400">Ask me anything about your database project</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-200 border border-slate-600/50'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {formatMessage(message)}
              </div>
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-purple-200' : 'text-slate-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your database schema, queries, or optimizations..."
            className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            `Explain the ${conversation.dbType} schema`,
            "Show me SQL queries for this database", 
            "How can I optimize performance?",
            "What API endpoints should I create?",
            "Security recommendations for this project"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputMessage(suggestion)}
              className="px-3 py-1 text-xs bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-full transition-colors border border-slate-600/50"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}