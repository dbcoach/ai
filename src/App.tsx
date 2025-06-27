import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import GenerationView from './components/GenerationView';
import { Settings } from './components/Settings';
import { ResultsPage } from './components/results/ResultsPage';
import { GenerationProvider, DBCoachMode } from './context/GenerationContext';
import { AuthProvider } from './contexts/AuthContext';
import useGeneration from './hooks/useGeneration';

type AppState = 'landing' | 'generating';

function AppContent() {
  const [appState, setAppState] = useState<AppState>('landing');
  const { startGeneration, resetGeneration } = useGeneration();

  const handleGenerate = async (prompt: string, dbType: string, mode?: DBCoachMode) => {
    setAppState('generating');
    await startGeneration(prompt, dbType, mode);
  };

  const handleBack = () => {
    setAppState('landing');
    resetGeneration();
  };

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={
          appState === 'landing' ? (
            <LandingPage onGenerate={handleGenerate} />
          ) : (
            <GenerationView onBack={handleBack} />
          )
        } />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/settings/*" element={<Settings />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <GenerationProvider>
          <AppContent />
        </GenerationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;