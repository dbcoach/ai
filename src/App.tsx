import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import GenerationView from './components/GenerationView';
import { GenerationProvider, DBCoachMode } from './context/GenerationContext';
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
      {appState === 'landing' ? (
        <LandingPage onGenerate={handleGenerate} />
      ) : (
        <GenerationView onBack={handleBack} />
      )}
    </div>
  );
}

function App() {
  return (
    <GenerationProvider>
      <AppContent />
    </GenerationProvider>
  );
}

export default App;