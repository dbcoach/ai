import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Database, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Clock,
  Search,
  Filter,
  Bot,
  Loader2
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { ChatConversation } from '../../services/chatService';

interface ConversationSidebarProps {
  onNewConversation: () => void;
  projectId?: string;
  className?: string;
}

export function ConversationSidebar({ 
  onNewConversation, 
  projectId, 
  className = '' 
}: ConversationSidebarProps) {
  const {
    conversations,
    currentConversation,
    loadingConversations,
    usageStats,
    selectConversation,
    updateConversationTitle,
    deleteConversation
  } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [contextFilter, setContextFilter] = useState<'all' | 'general' | 'database' | 'project'>('all');
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  // Filter conversations based on search and context
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContext = contextFilter === 'all' || conv.context_type === contextFilter;
    const matchesProject = !projectId || conv.project_id === projectId;
    
    return matchesSearch && matchesContext && matchesProject;
  });

  const handleConversationClick = async (conversation: ChatConversation) => {
    if (editingId === conversation.id) return;
    
    try {
      await selectConversation(conversation.id);
      setExpandedMenuId(null);
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
  };

  const handleEditTitle = (conversation: ChatConversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
    setExpandedMenuId(null);
  };

  const handleSaveTitle = async () => {
    if (!editingId || !editTitle.trim()) return;

    try {
      await updateConversationTitle(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await deleteConversation(conversationId);
      setExpandedMenuId(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getContextIcon = (contextType: string) => {
    switch (contextType) {
      case 'database':
      case 'project':
        return <Database className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">AI Chat</h2>
          </div>
          
          <button
            onClick={onNewConversation}
            className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={contextFilter}
            onChange={(e) => setContextFilter(e.target.value as 'all' | 'general' | 'database' | 'project')}
            className="flex-1 px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All contexts</option>
            <option value="general">General</option>
            <option value="database">Database</option>
            <option value="project">Project</option>
          </select>
        </div>

        {/* Usage Stats */}
        {usageStats && (
          <div className="mt-3 p-2 bg-slate-700/30 rounded-lg">
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Conversations:</span>
                <span className="text-slate-300">{usageStats.total_conversations}</span>
              </div>
              <div className="flex justify-between">
                <span>Messages today:</span>
                <span className="text-slate-300">{usageStats.messages_today}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scrollbar-elegant">
        {loadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="ml-2 text-slate-300 text-sm">Loading...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {searchTerm || contextFilter !== 'all' 
                ? 'No conversations match your filters' 
                : 'No conversations yet'
              }
            </p>
            {!searchTerm && contextFilter === 'all' && (
              <button
                onClick={onNewConversation}
                className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              >
                Start chatting
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentConversation?.id === conversation.id
                    ? 'bg-purple-600/20 border-l-2 border-purple-500'
                    : 'hover:bg-slate-700/30'
                }`}
              >
                {editingId === conversation.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                      onBlur={handleSaveTitle}
                      className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleSaveTitle}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div onClick={() => handleConversationClick(conversation)}>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-white text-sm truncate flex-1 pr-2">
                          {conversation.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedMenuId(
                              expandedMenuId === conversation.id ? null : conversation.id
                            );
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600/50 rounded transition-all"
                        >
                          <MoreVertical className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                          {getContextIcon(conversation.context_type)}
                          <span className="capitalize">{conversation.context_type}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(conversation.last_message_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Context Menu */}
                    {expandedMenuId === conversation.id && (
                      <div className="absolute right-2 top-8 z-10 bg-slate-700 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[120px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTitle(conversation);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit title
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conversation.id);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}