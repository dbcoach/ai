import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { Settings } from './components/Settings';
import { DatabaseProjectsPage } from './components/projects/DatabaseProjectsPage';
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