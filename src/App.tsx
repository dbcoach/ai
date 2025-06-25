import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import GenerationView from './components/GenerationView';

type AppState = 'landing' | 'generating';

interface GenerationData {
  prompt: string;
  dbType: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [generationData, setGenerationData] = useState<GenerationData | null>(null);

  const handleGenerate = (prompt: string, dbType: string) => {
    setGenerationData({ prompt, dbType });
    setAppState('generating');
  };

  const handleBack = () => {
    setAppState('landing');
    setGenerationData(null);
  };

  return (
    <div className="min-h-screen">
      {appState === 'landing' ? (
        <LandingPage onGenerate={handleGenerate} />
      ) : generationData ? (
        <GenerationView 
          prompt={generationData.prompt}
          dbType={generationData.dbType}
          onBack={handleBack}
        />
      ) : null}
    </div>
  );
}

export default App;