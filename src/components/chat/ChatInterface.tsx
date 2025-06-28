import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle,
  Database,
  MessageSquare,
  Clock
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { ChatMessage } from '../../services/chatService';

interface ChatInterfaceProps {
  projectId?: string;
  className?: string;
}

export function ChatInterface({ projectId, className = '' }: ChatInterfaceProps) {
  const {
    currentConversation,
    messages,
    loadingMessages,
    isTyping,
    error,
    sendMessage,
    clearError
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const validateMessage = (message: string): boolean => {
    // Check message length (reasonable limits)
    if (message.length > 10000) {
      clearError();
      setTimeout(() => clearError(), 5000);
      return false;
    }
    
    // Check for empty message
    if (!message.trim()) {
      return false;
    }
    
    return true;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isSending) return;

    const messageText = inputMessage.trim();
    
    // Validate message
    if (!validateMessage(messageText)) {
      return;
    }

    // Clear input immediately for better UX
    setInputMessage('');
    setIsSending(true);
    clearError();

    try {
      await sendMessage({
        conversationId: currentConversation.id,
        message: messageText, // Don't sanitize here as backend should handle it
        includeContext: true,
        contextTypes: projectId ? ['schema', 'query_history', 'project_data'] : undefined
      });
    } catch (err) {
      console.error('Error sending message:', err);
      // Restore the message on error so user doesn't lose their input
      setInputMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={message.id}
        className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} ${
          isSystem ? 'justify-center' : ''
        }`}
        data-message-index={index}
      >
        {!isSystem && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-br from-purple-600 to-blue-600' 
              : 'bg-gradient-to-br from-green-600 to-teal-600'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
        )}

        <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''} ${isSystem ? 'max-w-md' : ''}`}>
          <div
            className={`inline-block px-4 py-3 rounded-2xl text-sm ${
              isUser
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                : isSystem
                ? 'bg-slate-700/50 text-slate-300 text-center'
                : 'bg-slate-800/50 text-slate-100 border border-slate-700/50'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            {!isSystem && (
              <div className={`flex items-center gap-2 mt-2 text-xs ${
                isUser ? 'text-purple-200 justify-end' : 'text-slate-400'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{formatMessageTime(message.created_at)}</span>
                
                {message.tokens_used > 0 && !isUser && (
                  <>
                    <span>•</span>
                    <span>{message.tokens_used} tokens</span>
                  </>
                )}
                
                {message.processing_time_ms > 0 && !isUser && (
                  <>
                    <span>•</span>
                    <span>{message.processing_time_ms}ms</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!currentConversation) {
    return (
      <div className={`flex items-center justify-center h-full bg-slate-900/20 rounded-xl border border-slate-700/50 ${className}`}>
        <div className="text-center space-y-4">
          <MessageSquare className="w-16 h-16 text-slate-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No Conversation Selected
            </h3>
            <p className="text-slate-500">
              Select a conversation to start chatting with the AI assistant
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-slate-900/20 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white truncate max-w-xs">
              {currentConversation.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {currentConversation.context_type === 'project' && (
                <>
                  <Database className="w-3 h-3" />
                  <span>Database Context</span>
                </>
              )}
              {currentConversation.context_type === 'general' && (
                <>
                  <MessageSquare className="w-3 h-3" />
                  <span>General Chat</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-elegant"
        role="log"
        aria-label="Chat conversation history"
        aria-live="polite"
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="ml-2 text-slate-300">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-300 mb-2">
              Start the conversation
            </h4>
            <p className="text-slate-500 text-sm">
              Ask me anything about databases, SQL queries, or data analysis!
            </p>
          </div>
        ) : (
          // Limit messages to last 100 for performance, show "load more" if needed
          messages.slice(-100).map((message, index) => renderMessage(message, index))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="ml-2 text-xs text-slate-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-400 hover:text-red-300 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about databases, SQL, or data analysis..."
              disabled={isSending || isTyping}
              aria-label="Chat message input"
              aria-describedby="chat-help-text"
              className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[48px] max-h-32"
              rows={1}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending || isTyping}
            aria-label={isSending ? "Sending message..." : "Send message"}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span id="chat-help-text">Press Enter to send, Shift+Enter for new line</span>
          {currentConversation.context_type === 'project' && (
            <div className="flex items-center gap-1" aria-label="Database context is enabled for this conversation">
              <Database className="w-3 h-3" />
              <span>Database context enabled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}