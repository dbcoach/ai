import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatInterface } from './ChatInterface';
import { ConversationSidebar } from './ConversationSidebar';
import { CreateConversationModal } from './CreateConversationModal';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { databaseProjectsService } from '../../services/databaseProjectsService';
import { aiChatService } from '../../services/aiChatService';

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    createConversation, 
    selectConversation, 
    conversations 
  } = useChat();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectId] = useState(searchParams.get('project') || undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleCreateProjectConversation = useCallback(async () => {
    if (!projectId) return;

    try {
      // Get project details for context
      const project = await databaseProjectsService.getProject(projectId);
      if (!project) return;

      const conversation = await createConversation({
        title: `${project.database_name} Discussion`,
        project_id: projectId,
        context_type: 'project',
        context_metadata: {
          project_name: project.database_name,
          database_type: project.database_type,
          description: project.description
        }
      });

      // Add project context to the conversation
      await aiChatService.addSchemaContext(
        conversation.id,
        project.metadata?.schema || {},
        1.0
      );

      // Get recent queries for context
      const sessions = await databaseProjectsService.getProjectSessions(projectId);
      if (sessions.length > 0) {
        const recentQueries = await databaseProjectsService.getSessionQueries(sessions[0].id);
        if (recentQueries.length > 0) {
          await aiChatService.addQueryHistoryContext(
            conversation.id,
            recentQueries.slice(0, 10),
            0.8
          );
        }
      }

      // Update URL to include conversation ID
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('conversation', conversation.id);
      navigate(`/chat?${newSearchParams.toString()}`, { replace: true });

    } catch (error) {
      console.error('Error creating project conversation:', error);
    }
  }, [projectId, createConversation, searchParams, navigate]);

  // Initialize conversation on page load
  useEffect(() => {
    if (!user?.id || isInitialized) return;

    const initializeChat = async () => {
      try {
        const conversationId = searchParams.get('conversation');
        
        if (conversationId) {
          // Load specific conversation
          await selectConversation(conversationId);
        } else if (conversations.length > 0) {
          // Load most recent conversation
          await selectConversation(conversations[0].id);
        } else if (projectId) {
          // Auto-create project conversation
          await handleCreateProjectConversation();
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, [user?.id, conversations.length, projectId, searchParams, isInitialized, selectConversation, handleCreateProjectConversation]);


  const handleNewConversation = () => {
    setShowCreateModal(true);
  };

  const handleCreateConversation = async (data: {
    title: string;
    contextType: 'general' | 'database' | 'project';
    selectedProjectId?: string;
  }) => {
    try {
      const conversation = await createConversation({
        title: data.title,
        project_id: data.selectedProjectId || projectId,
        context_type: data.contextType,
        context_metadata: data.selectedProjectId ? {
          project_id: data.selectedProjectId
        } : {}
      });

      // Add context if it's a database/project conversation
      if ((data.contextType === 'project' || data.contextType === 'database') && conversation.project_id) {
        try {
          const project = await databaseProjectsService.getProject(conversation.project_id);
          if (project?.metadata?.schema) {
            await aiChatService.addSchemaContext(conversation.id, project.metadata.schema);
          }
        } catch (contextError) {
          console.warn('Could not add project context:', contextError);
        }
      }

      // Update URL
      const newSearchParams = new URLSearchParams();
      if (conversation.project_id) {
        newSearchParams.set('project', conversation.project_id);
      }
      newSearchParams.set('conversation', conversation.id);
      navigate(`/chat?${newSearchParams.toString()}`, { replace: true });

      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-400">Please sign in to access the chat feature.</p>
        </div>
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="flex-1 flex gap-6 p-6 min-h-0">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <ChatErrorBoundary>
              <ConversationSidebar
                onNewConversation={handleNewConversation}
                projectId={projectId}
                className="h-full"
              />
            </ChatErrorBoundary>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 min-w-0">
            <ChatErrorBoundary>
              <ChatInterface
                projectId={projectId}
                className="h-full"
              />
            </ChatErrorBoundary>
          </div>
        </div>

        {/* Create Conversation Modal */}
        {showCreateModal && (
          <CreateConversationModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateConversation={handleCreateConversation}
            defaultProjectId={projectId}
          />
        )}
      </div>
    </ChatErrorBoundary>
  );
}