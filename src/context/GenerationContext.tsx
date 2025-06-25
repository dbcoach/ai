import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GenerationStep, GenerationProgress } from '../services/geminiService';

export type TabType = 'schema' | 'data' | 'api' | 'visualization';

interface GenerationState {
  isGenerating: boolean;
  currentStep: TabType | null;
  completedSteps: Set<TabType>;
  generatedContent: Map<TabType, GenerationStep>;
  reasoningMessages: Array<{
    id: string;
    type: 'ai' | 'user';
    content: string;
    timestamp: Date;
  }>;
  error: string | null;
  prompt: string;
  dbType: string;
}

type GenerationAction =
  | { type: 'START_GENERATION'; payload: { prompt: string; dbType: string } }
  | { type: 'UPDATE_PROGRESS'; payload: GenerationProgress }
  | { type: 'COMPLETE_STEP'; payload: GenerationStep }
  | { type: 'ADD_REASONING_MESSAGE'; payload: { content: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_GENERATION' };

const initialState: GenerationState = {
  isGenerating: false,
  currentStep: null,
  completedSteps: new Set(),
  generatedContent: new Map(),
  reasoningMessages: [],
  error: null,
  prompt: '',
  dbType: ''
};

function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'START_GENERATION':
      return {
        ...initialState,
        isGenerating: true,
        prompt: action.payload.prompt,
        dbType: action.payload.dbType,
        reasoningMessages: [
          {
            id: '1',
            type: 'user',
            content: `Create a ${action.payload.dbType} database: ${action.payload.prompt}`,
            timestamp: new Date()
          }
        ]
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        currentStep: action.payload.step,
        completedSteps: action.payload.isComplete
          ? new Set([...state.completedSteps, action.payload.step])
          : state.completedSteps,
        isGenerating: !action.payload.isComplete || state.completedSteps.size < 3 // Continue generating until all 4 steps are done
      };

    case 'COMPLETE_STEP': {
      const newContent = new Map(state.generatedContent);
      newContent.set(action.payload.type, action.payload);
      const newCompletedSteps = new Set([...state.completedSteps, action.payload.type]);
      
      return {
        ...state,
        generatedContent: newContent,
        completedSteps: newCompletedSteps,
        isGenerating: newCompletedSteps.size < 4, // Stop generating when all 4 steps are done
        currentStep: newCompletedSteps.size < 4 ? state.currentStep : null
      };
    }

    case 'ADD_REASONING_MESSAGE':
      return {
        ...state,
        reasoningMessages: [
          ...state.reasoningMessages,
          {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: action.payload.content,
            timestamp: new Date()
          }
        ]
      };

    case 'SET_ERROR':
      return {
        ...state,
        isGenerating: false,
        error: action.payload
      };

    case 'RESET_GENERATION':
      return initialState;

    default:
      return state;
  }
}

interface GenerationContextType {
  state: GenerationState;
  startGeneration: (prompt: string, dbType: string) => Promise<void>;
  resetGeneration: () => void;
  isStepComplete: (step: TabType) => boolean;
  getStepContent: (step: TabType) => GenerationStep | undefined;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(generationReducer, initialState);

  const startGeneration = async (prompt: string, dbType: string) => {
    dispatch({ type: 'START_GENERATION', payload: { prompt, dbType } });
    
    try {
      const { geminiService } = await import('../services/geminiService');
      
      // Test connection first
      const isConnected = await geminiService.testConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to Gemini API. Please check your API key and network connection.');
      }
      
      await geminiService.generateDatabaseDesign(
        prompt,
        dbType,
        (progress: GenerationProgress) => {
          dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
          dispatch({ type: 'ADD_REASONING_MESSAGE', payload: { content: progress.reasoning } });
        }
      ).then((steps: GenerationStep[]) => {
        steps.forEach(step => {
          dispatch({ type: 'COMPLETE_STEP', payload: step });
        });
        
        dispatch({ 
          type: 'ADD_REASONING_MESSAGE', 
          payload: { content: '✅ Database design complete! All components have been generated successfully.' }
        });
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Provide helpful error message based on error type
      let userFriendlyMessage = '';
      if (errorMessage.includes('API key')) {
        userFriendlyMessage = '❌ API Key Error: Please check your Gemini API key in the .env file.';
      } else if (errorMessage.includes('RATE_LIMIT')) {
        userFriendlyMessage = '❌ Rate Limit: Too many requests. Please wait a moment and try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connect')) {
        userFriendlyMessage = '❌ Connection Error: Please check your internet connection and try again.';
      } else {
        userFriendlyMessage = `❌ Generation Error: ${errorMessage}`;
      }
      
      dispatch({ 
        type: 'ADD_REASONING_MESSAGE', 
        payload: { content: userFriendlyMessage }
      });
    }
  };

  const resetGeneration = () => {
    dispatch({ type: 'RESET_GENERATION' });
  };

  const isStepComplete = (step: TabType): boolean => {
    return state.completedSteps.has(step);
  };

  const getStepContent = (step: TabType): GenerationStep | undefined => {
    return state.generatedContent.get(step);
  };

  const contextValue: GenerationContextType = {
    state,
    startGeneration,
    resetGeneration,
    isStepComplete,
    getStepContent
  };

  return (
    <GenerationContext.Provider value={contextValue}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}