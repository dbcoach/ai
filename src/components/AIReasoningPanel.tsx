import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Zap, Database, Code, Eye } from 'lucide-react';

interface AIReasoningPanelProps {
  prompt: string;
  dbType: string;
  isGenerating: boolean;
}

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

const AIReasoningPanel: React.FC<AIReasoningPanelProps> = ({ prompt, dbType, isGenerating }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial user message
    setMessages([
      {
        id: '1',
        type: 'user',
        content: `Create a ${dbType} database: ${prompt}`,
        timestamp: new Date(),
      }
    ]);

    // Simulate AI reasoning messages
    const aiMessages = [
      {
        content: "I'll analyze your requirements and design an optimal database structure.",
        delay: 1000,
      },
      {
        content: `For a ${dbType} database, I'm identifying the core entities and relationships...`,
        delay: 2500,
      },
      {
        content: "🔍 Analyzing entity relationships and determining optimal table structure",
        delay: 4000,
      },
      {
        content: "📊 Generating schema with proper indexing and constraints",
        delay: 6000,
      },
      {
        content: "🎯 Creating sample data that reflects real-world usage patterns",
        delay: 8000,
      },
      {
        content: "🔧 Building REST API endpoints for full CRUD operations",
        delay: 10000,
      },
      {
        content: "🎨 Preparing visual ER diagram for better understanding",
        delay: 12000,
      },
      {
        content: "✅ Database design complete! Review the generated schema and make any adjustments.",
        delay: 14000,
      },
    ];

    aiMessages.forEach((msg, index) => {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${index + 2}`,
            type: 'ai',
            content: msg.content,
            timestamp: new Date(),
          }
        ]);
      }, msg.delay);
    });
  }, [prompt, dbType]);

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              message.type === 'ai' 
                ? 'bg-purple-500/20 border border-purple-500/30' 
                : 'bg-slate-600/30 border border-slate-500/30'
            }`}>
              {message.type === 'ai' ? (
                <Bot className="w-4 h-4 text-purple-400" />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <div className={`p-3 rounded-lg ${
                message.type === 'ai'
                  ? 'bg-slate-700/30 border border-slate-600/30'
                  : 'bg-slate-600/30 border border-slate-500/30'
              }`}>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-slate-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isGenerating && (
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30 flex-shrink-0">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-slate-400 text-sm ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Progress indicators */}
      <div className="p-6 border-t border-slate-700/50 bg-slate-800/20">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Generation Progress</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Database, label: 'Schema', completed: !isGenerating },
              { icon: Eye, label: 'Sample Data', completed: !isGenerating },
              { icon: Code, label: 'API Endpoints', completed: !isGenerating },
              { icon: Zap, label: 'Visualization', completed: !isGenerating },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={`flex items-center space-x-2 p-2 rounded-lg ${
                  item.completed 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-slate-700/30 border border-slate-600/30'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    item.completed ? 'text-green-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-xs ${
                    item.completed ? 'text-green-300' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                  {item.completed && (
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-auto"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReasoningPanel;