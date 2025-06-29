import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Plus,
  MessageSquare,
  Database
} from 'lucide-react';
import { ConversationHistory } from './ConversationHistory';
import { SavedStreamingCanvas } from './SavedStreamingCanvas';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';

export function ConversationInterface() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleNewGeneration = () => {
    // Navigate to streaming page for new generation
    window.location.href = '/';
  };

  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    console.log(`Exporting in ${format} format`);
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
                onSelectConversation={setSelectedSessionId}
                selectedSessionId={selectedSessionId}
              />
            </div>

            {/* Canvas Viewer */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedSessionId ? (
                <SavedStreamingCanvas
                  sessionId={selectedSessionId}
                  onStartNewChat={handleNewGeneration}
                  onExport={handleExport}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">
                      Select a Database Generation
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Choose a conversation from the sidebar to view its streaming canvas and results, or start a new generation.
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