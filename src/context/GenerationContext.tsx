import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GenerationStep, GenerationProgress } from '../services/geminiService';
import { GenerationStep as DBCoachStep, GenerationProgress as DBCoachProgress } from '../services/enhancedDBCoachService';

export type TabType = 'schema' | 'data' | 'api' | 'visualization';
export type DBCoachMode = 'standard' | 'dbcoach';

// Union types to support both services
export type UnifiedGenerationStep = GenerationStep | DBCoachStep;
export type UnifiedGenerationProgress = GenerationProgress | DBCoachProgress;

interface GenerationState {
  isGenerating: boolean;
  currentStep: TabType | null;
  completedSteps: Set<TabType>;
  generatedContent: Map<TabType, UnifiedGenerationStep>;
  dbCoachSteps: DBCoachStep[];
  reasoningMessages: Array<{
    id: string;
    type: 'ai' | 'user';
    content: string;
    timestamp: Date;
    agent?: string;
  }>;
  error: string | null;
  prompt: string;
  dbType: string;
  mode: DBCoachMode;
  currentAgent: string;
  progressStep: number;
  totalSteps: number;
  messageCounter: number; // Added to ensure unique keys
}

type GenerationAction =
  | { type: 'START_GENERATION'; payload: { prompt: string; dbType: string; mode: DBCoachMode } }
  | { type: 'UPDATE_PROGRESS'; payload: UnifiedGenerationProgress }
  | { type: 'COMPLETE_STEP'; payload: UnifiedGenerationStep }
  | { type: 'ADD_DBCOACH_STEP'; payload: DBCoachStep }
  | { type: 'ADD_REASONING_MESSAGE'; payload: { content: string; agent?: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_GENERATION' };

const initialState: GenerationState = {
  isGenerating: false,
  currentStep: null,
  completedSteps: new Set(),
  generatedContent: new Map(),
  dbCoachSteps: [],
  reasoningMessages: [],
  error: null,
  prompt: '',
  dbType: '',
  mode: 'standard',
  currentAgent: '',
  progressStep: 0,
  totalSteps: 4,
  messageCounter: 0
};

function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'START_GENERATION':
      return {
        ...initialState,
        isGenerating: true,
        prompt: action.payload.prompt,
        dbType: action.payload.dbType,
        mode: action.payload.mode,
        totalSteps: action.payload.mode === 'dbcoach' ? 8 : 4,
        messageCounter: 1,
        reasoningMessages: [
          {
            id: '1',
            type: 'user',
            content: `Create a ${action.payload.dbType} database: ${action.payload.prompt}`,
            timestamp: new Date()
          }
        ]
      };

    case 'UPDATE_PROGRESS': {
      const progress = action.payload as UnifiedGenerationProgress;
      const isDBCoach = 'agent' in progress;
      
      if (isDBCoach) {
        return {
          ...state,
          currentAgent: progress.agent || '',
          progressStep: progress.currentStep || 0,
          currentStep: progress.step === 'analysis' ? 'schema' : 
                     progress.step === 'design' ? 'schema' :
                     progress.step === 'validation' ? 'api' : 'visualization',
          isGenerating: !progress.isComplete
        };
      } else {
        return {
          ...state,
          currentStep: progress.step,
          completedSteps: progress.isComplete
            ? new Set([...state.completedSteps, progress.step])
            : state.completedSteps,
          isGenerating: !progress.isComplete || state.completedSteps.size < 3
        };
      }
    }

    case 'COMPLETE_STEP': {
      const step = action.payload as UnifiedGenerationStep;
      const newContent = new Map(state.generatedContent);
      
      // Map DBCoach steps to tab types
      if ('agent' in step) {
        const tabType = step.type === 'analysis' || step.type === 'design' ? 'schema' :
                       step.type === 'validation' ? 'api' : 'data';
        newContent.set(tabType, step);
      } else {
        newContent.set(step.type, step);
      }
      
      const newCompletedSteps = new Set([...state.completedSteps, step.type]);
      
      return {
        ...state,
        generatedContent: newContent,
        completedSteps: newCompletedSteps,
        isGenerating: newCompletedSteps.size < state.totalSteps,
        currentStep: newCompletedSteps.size < state.totalSteps ? state.currentStep : null
      };
    }

    case 'ADD_DBCOACH_STEP':
      return {
        ...state,
        dbCoachSteps: [...state.dbCoachSteps, action.payload]
      };

    case 'ADD_REASONING_MESSAGE':
      return {
        ...state,
        messageCounter: state.messageCounter + 1,
        reasoningMessages: [
          ...state.reasoningMessages,
          {
            id: `ai-${state.messageCounter}`,
            type: 'ai',
            content: action.payload.content,
            timestamp: new Date(),
            agent: action.payload.agent
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
  startGeneration: (prompt: string, dbType: string, mode?: DBCoachMode) => Promise<void>;
  resetGeneration: () => void;
  isStepComplete: (step: TabType) => boolean;
  getStepContent: (step: TabType) => UnifiedGenerationStep | undefined;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(generationReducer, initialState);

  const startGeneration = async (prompt: string, dbType: string, mode: DBCoachMode = 'standard') => {
    dispatch({ type: 'START_GENERATION', payload: { prompt, dbType, mode } });
    
    try {
      if (mode === 'dbcoach') {
        // Use Enhanced DBCoach service
        const { enhancedDBCoachService } = await import('../services/enhancedDBCoachService');
        
        const isConnected = await enhancedDBCoachService.testConnection();
        if (!isConnected) {
          throw new Error('Unable to connect to Enhanced DBCoach API. Please check your API key and network connection.');
        }
        
        await enhancedDBCoachService.generateDatabaseDesign(
          prompt,
          dbType,
          (progress: DBCoachProgress) => {
            dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
            dispatch({ 
              type: 'ADD_REASONING_MESSAGE', 
              payload: { 
                content: `🤖 ${progress.agent}: ${progress.reasoning}`,
                agent: progress.agent
              }
            });
          }
        ).then((steps: DBCoachStep[]) => {
          steps.forEach(step => {
            dispatch({ type: 'ADD_DBCOACH_STEP', payload: step });
            dispatch({ type: 'COMPLETE_STEP', payload: step });
          });
          
          // Mark generation as complete
          dispatch({ 
            type: 'UPDATE_PROGRESS', 
            payload: { 
              step: 'validation', 
              agent: 'DBCoach Master',
              reasoning: 'All phases completed successfully', 
              isComplete: true,
              currentStep: 4,
              totalSteps: 4
            } as DBCoachProgress
          });
          
          dispatch({ 
            type: 'ADD_REASONING_MESSAGE', 
            payload: { 
              content: '✅ DBCoach analysis complete! Enterprise-grade database design delivered with multi-agent validation.',
              agent: 'DBCoach Master'
            }
          });
        });
      } else {
        // Use standard Gemini service
        const { geminiService } = await import('../services/geminiService');
        
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
      }
      
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

  const getStepContent = (step: TabType): UnifiedGenerationStep | undefined => {
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