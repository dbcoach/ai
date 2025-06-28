import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  MessageSquare, 
  Database, 
  FolderOpen,
  Bot,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { databaseProjectsService, DatabaseProject } from '../../services/databaseProjectsService';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (data: {
    title: string;
    contextType: 'general' | 'database' | 'project';
    selectedProjectId?: string;
  }) => Promise<void>;
  defaultProjectId?: string;
}

export function CreateConversationModal({
  isOpen,
  onClose,
  onCreateConversation,
  defaultProjectId
}: CreateConversationModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [contextType, setContextType] = useState<'general' | 'database' | 'project'>('general');
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || '');
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadUserProjects = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingProjects(true);
      // Use getUserProjects if available, otherwise fall back to getProjects
      const userProjects = await (databaseProjectsService.getUserProjects 
        ? databaseProjectsService.getUserProjects(user.id)
        : databaseProjectsService.getProjects(user.id));
      setProjects(userProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  }, [user?.id]);

  // Load user's projects when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserProjects();
    }
  }, [isOpen, user?.id, loadUserProjects]);

  // Set default values based on context
  useEffect(() => {
    if (defaultProjectId) {
      setContextType('project');
      setSelectedProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || creating) return;

    try {
      setCreating(true);
      
      await onCreateConversation({
        title: title.trim(),
        contextType,
        selectedProjectId: contextType === 'project' ? selectedProjectId : undefined
      });

      // Reset form
      setTitle('');
      setContextType('general');
      setSelectedProjectId(defaultProjectId || '');
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreating(false);
    }
  };

  const getContextDescription = () => {
    switch (contextType) {
      case 'general':
        return 'General purpose chat for any questions or discussions';
      case 'database':
        return 'Database-focused conversation with schema awareness';
      case 'project':
        return 'Project-specific chat with full context and history';
      default:
        return '';
    }
  };

  const getContextIcon = () => {
    switch (contextType) {
      case 'general':
        return <MessageSquare className="w-5 h-5" />;
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'project':
        return <FolderOpen className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">New Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
              Conversation Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Database optimization help"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {/* Context Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Context Type
            </label>
            <div className="space-y-3">
              {/* General */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-600/50 hover:border-slate-500/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="contextType"
                  value="general"
                  checked={contextType === 'general'}
                  onChange={(e) => setContextType(e.target.value as 'general' | 'database' | 'project')}
                  className="mt-1 w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500/50 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">General Chat</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    General purpose chat for any questions or discussions
                  </p>
                </div>
              </label>

              {/* Database */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-600/50 hover:border-slate-500/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="contextType"
                  value="database"
                  checked={contextType === 'database'}
                  onChange={(e) => setContextType(e.target.value as 'general' | 'database' | 'project')}
                  className="mt-1 w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500/50 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-white">Database Context</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Database-focused conversation with schema awareness
                  </p>
                </div>
              </label>

              {/* Project */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-600/50 hover:border-slate-500/50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="contextType"
                  value="project"
                  checked={contextType === 'project'}
                  onChange={(e) => setContextType(e.target.value as 'general' | 'database' | 'project')}
                  className="mt-1 w-4 h-4 text-purple-500 border-slate-600 bg-slate-700 focus:ring-purple-500/50 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-white">Project Context</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Project-specific chat with full context and history
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Project Selection */}
          {contextType === 'project' && (
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-slate-300 mb-2">
                Select Project
              </label>
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  <span className="ml-2 text-slate-300">Loading projects...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-sm">No projects found</p>
                  <p className="text-xs mt-1">Create a project first to use project context</p>
                </div>
              ) : (
                <select
                  id="project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.database_name} ({project.database_type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Selected Context Summary */}
          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <div className="flex items-center gap-2 mb-2">
              {getContextIcon()}
              <span className="font-medium text-white capitalize">{contextType} Context</span>
            </div>
            <p className="text-sm text-slate-400">
              {getContextDescription()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || creating || (contextType === 'project' && !selectedProjectId)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Start Chat
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}