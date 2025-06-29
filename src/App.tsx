import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { Settings } from './components/Settings';
import { DatabaseProjectsPage } from './components/projects/DatabaseProjectsPage';
import { StreamingPage } from './components/streaming/StreamingPage';
import { LiveStreamingPage } from './components/streaming/LiveStreamingPage';
import { StreamingCanvasPage } from './components/streaming/StreamingCanvasPage';
import { UnifiedProjectWorkspace } from './components/projects/UnifiedProjectWorkspace';
import { GenerationProvider } from './context/GenerationContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthErrorHandler } from './components/auth/AuthErrorHandler';
import { AuthDebugPanel } from './components/debug/AuthDebugPanel';

function AppContent() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/projects" element={<DatabaseProjectsPage />} />
        <Route path="/projects/:projectId" element={<UnifiedProjectWorkspace />} />
        <Route path="/generate" element={<UnifiedProjectWorkspace />} />
        <Route path="/streaming" element={<UnifiedProjectWorkspace />} />
        <Route path="/streaming-canvas" element={<StreamingCanvasPage />} />
        <Route path="/streaming-legacy" element={<LiveStreamingPage />} />
        <Route path="/streaming-old" element={<StreamingPage />} />
        <Route path="/settings/*" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthDebugPanel />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthErrorHandler>
        <Router>
          <GenerationProvider>
            <AppContent />
          </GenerationProvider>
        </Router>
      </AuthErrorHandler>
    </AuthProvider>
  );
}

export default App;