import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Plus,
  MessageSquare,
  Database
} from 'lucide-react';
import { ConversationHistory } from './ConversationHistory';
import { EnhancedStreamingInterface } from './EnhancedStreamingInterface';
import { StreamingErrorBoundary } from './StreamingErrorBoundary';
import { conversationStorage, SavedConversation } from '../../services/conversationStorage';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';

export function ConversationInterface() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<SavedConversation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSessionId) {
      loadConversationData(selectedSessionId);
    } else {
      setSelectedConversation(null);
    }
  }, [selectedSessionId]);

  const loadConversationData = async (sessionId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Loading conversation data for sessionId:', sessionId);
      const conversation = await conversationStorage.getConversation(sessionId);
      console.log('📋 Loaded conversation:', conversation);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      setSelectedConversation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNewGeneration = () => {
    // Navigate to home page for new generation
    window.location.href = window.location.origin + '/';
  };

  const handleSelectConversation = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/30 to-slate-900/20 pointer-events-none" />
        
        <div className="relative z-10 h-screen flex flex-col">
          {/* Navigation Header */}
          <nav className="p-4 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
                >
                  <Home className="w-4 h-4" />
                  <span className="font-medium">Home</span>
                </Link>
                
                <div className="flex items-center space-x-2 text-slate-400">
                  <span>/</span>
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 font-medium">Database Generations</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleNewGeneration}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">New Generation</span>
                </button>
                
                <Link 
                  to="/projects" 
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
                >
                  <Database className="w-4 h-4" />
                  <span className="font-medium">Projects</span>
                </Link>
                
                <Link 
                  to="/settings" 
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">Settings</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Conversation History Sidebar */}
            <div className="w-80 border-r border-slate-700/50 bg-slate-800/20 flex flex-col">
              <ConversationHistory 
                onSelectConversation={handleSelectConversation}
                selectedSessionId={selectedSessionId}
              />
            </div>

            {/* Streaming Interface Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedConversation ? (
                <div className="h-full flex flex-col">
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white mb-1">
                          {selectedConversation.prompt}
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span>{selectedConversation.dbType}</span>
                          <span>•</span>
                          <span>{new Date(selectedConversation.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleNewGeneration}
                        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Generation</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Streaming Interface */}
                  <div className="flex-1 overflow-hidden">
                    <StreamingErrorBoundary>
                      <div className="h-full p-4">
                        {/* Temporary debug view */}
                        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                          <h3 className="text-white font-semibold mb-2">Debug: Conversation Data</h3>
                          <pre className="text-slate-300 text-xs overflow-auto max-h-32">
                            {JSON.stringify(selectedConversation, null, 2)}
                          </pre>
                        </div>
                        
                        <EnhancedStreamingInterface
                          prompt={selectedConversation.prompt}
                          dbType={selectedConversation.dbType}
                          onComplete={() => {}}
                          onError={(error) => {
                            console.error('❌ EnhancedStreamingInterface error:', error);
                          }}
                          className="h-full"
                          isViewingMode={true}
                          existingConversation={selectedConversation}
                        />
                      </div>
                    </StreamingErrorBoundary>
                  </div>
                </div>
              ) : loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading conversation...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">
                      Select a Database Generation
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Choose a conversation from the sidebar to view its streaming interface and results, or start a new generation.
                    </p>
                    <button
                      onClick={handleNewGeneration}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Start New Generation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}