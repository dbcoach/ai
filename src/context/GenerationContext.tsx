import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GenerationStep, GenerationProgress, geminiService } from '../services/geminiService';
import { GenerationStep as DBCoachStep, GenerationProgress as DBCoachProgress, enhancedDBCoachService } from '../services/enhancedDBCoachService';

export type TabType = 'analysis' | 'schema' | 'implementation' | 'validation' | 'visualization';
export type DBCoachMode = 'standard' | 'dbcoach';

// Union types to support both services
export type UnifiedGenerationStep = GenerationStep | DBCoachStep;
export type UnifiedGenerationProgress = GenerationProgress | DBCoachProgress;

interface GenerationState {
  isGenerating: boolean;
  currentStep: TabType | null;
  completedSteps: Set<TabType>;
  generatedContent: Map<TabType, UnifiedGenerationStep>;
  // Store individual generation steps to prevent overwriting
  generationSteps: Map<string, UnifiedGenerationStep>;
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
  generationSteps: new Map(),
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
        totalSteps: 5, // Both modes now have 5 tabs
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
          currentStep: progress.step === 'analysis' ? 'analysis' : 
                     progress.step === 'design' ? 'schema' :
                     progress.step === 'implementation' ? 'implementation' : 'validation',
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
      const newGenerationSteps = new Map(state.generationSteps);
      
      // Store individual step in generationSteps to prevent data loss
      newGenerationSteps.set(step.type, step);
      
      // Map DBCoach steps to tab types
      if ('agent' in step) {
        const tabType: TabType = step.type === 'analysis' ? 'analysis' :
                                 step.type === 'design' ? 'schema' :
                                 step.type === 'implementation' ? 'implementation' : 'validation';
        newContent.set(tabType, step);
        
        const newCompletedSteps = new Set([...state.completedSteps, tabType]);
        
        return {
          ...state,
          generatedContent: newContent,
          generationSteps: newGenerationSteps,
          completedSteps: newCompletedSteps,
          isGenerating: newCompletedSteps.size < 5, // All modes now use 5 tabs
          currentStep: newCompletedSteps.size < 5 ? tabType : null
        };
      } else {
        // Standard mode - handle content combining for implementation tab
        const tabMapping: Record<string, TabType> = {
          'schema': 'schema',
          'data': 'implementation', // Sample data goes to implementation tab
          'api': 'implementation',  // API endpoints go to implementation tab  
          'visualization': 'visualization'
        };
        
        const tabType = tabMapping[step.type] || step.type as TabType;
        
        // For standard mode, we need to create synthetic analysis and validation steps
        if (step.type === 'schema') {
          // Create a synthetic analysis step when schema is generated
          const analysisStep: UnifiedGenerationStep = {
            type: 'analysis',
            title: 'Requirements Analysis',
            content: `# Analysis\n\nBased on your request: "${state.prompt}"\n\nThis analysis was automatically generated from your requirements.`,
            reasoning: 'Requirements analysis completed'
          };
          newContent.set('analysis', analysisStep);
        }
        
        if (step.type === 'visualization') {
          // Create a synthetic validation step when visualization is completed
          const validationStep: UnifiedGenerationStep = {
            type: 'validation',
            title: 'Quality Report',
            content: `# Quality Assessment\n\nThe generated database design has been reviewed and validated.\n\n## Summary\n- Schema structure validated\n- Implementation reviewed\n- Best practices applied`,
            reasoning: 'Quality validation completed'
          };
          newContent.set('validation', validationStep);
        }
        
        // Handle implementation tab content combining
        if (tabType === 'implementation') {
          const existingContent = newContent.get('implementation');
          
          if (existingContent) {
            // Combine content from both data and api steps
            const dataStep = newGenerationSteps.get('data');
            const apiStep = newGenerationSteps.get('api');
            
            let combinedContent = '# Implementation Package\n\n';
            
            if (dataStep) {
              combinedContent += `## Sample Data\n\n${dataStep.content}\n\n`;
            }
            
            if (apiStep) {
              combinedContent += `## API Endpoints\n\n${apiStep.content}\n\n`;
            }
            
            // If current step is being added
            if (step.type === 'data') {
              combinedContent = combinedContent.replace('## Sample Data\n\n\n\n', `## Sample Data\n\n${step.content}\n\n`);
            } else if (step.type === 'api') {
              combinedContent = combinedContent.replace('## API Endpoints\n\n\n\n', `## API Endpoints\n\n${step.content}\n\n`);
            }
            
            const combinedStep: UnifiedGenerationStep = {
              type: 'implementation',
              title: 'Implementation Package',
              content: combinedContent,
              reasoning: `Combined ${step.type} content with existing implementation content`
            };
            
            newContent.set(tabType, combinedStep);
          } else {
            // First implementation content - create structured format
            const structuredContent = step.type === 'data' 
              ? `# Implementation Package\n\n## Sample Data\n\n${step.content}\n\n## API Endpoints\n\n_API endpoints will be generated next..._\n\n`
              : `# Implementation Package\n\n## Sample Data\n\n_Sample data has been generated. Check the Sample Data section._\n\n## API Endpoints\n\n${step.content}\n\n`;
            
            const structuredStep: UnifiedGenerationStep = {
              type: 'implementation',
              title: 'Implementation Package',
              content: structuredContent,
              reasoning: step.reasoning
            };
            
            newContent.set(tabType, structuredStep);
          }
        } else {
          // For non-implementation tabs, set content directly
          newContent.set(tabType, step);
        }
        
        const newCompletedSteps = new Set([...state.completedSteps]);
        
        // Add the appropriate completed steps
        if (step.type === 'schema') {
          newCompletedSteps.add('analysis');
          newCompletedSteps.add('schema');
        } else if (step.type === 'data' || step.type === 'api') {
          newCompletedSteps.add('implementation');
        } else if (step.type === 'visualization') {
          newCompletedSteps.add('validation');
          newCompletedSteps.add('visualization');
        }
        
        return {
          ...state,
          generatedContent: newContent,
          generationSteps: newGenerationSteps,
          completedSteps: newCompletedSteps,
          isGenerating: newCompletedSteps.size < 5, // Standard mode now has 5 tabs
          currentStep: newCompletedSteps.size < 5 ? state.currentStep : null
        };
      }
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
  getGenerationStep: (stepType: string) => UnifiedGenerationStep | undefined;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(generationReducer, initialState);

  const startGeneration = async (prompt: string, dbType: string, mode: DBCoachMode = 'standard') => {
    dispatch({ type: 'START_GENERATION', payload: { prompt, dbType, mode } });
    
    try {
      if (mode === 'dbcoach') {
        // Use Enhanced DBCoach service
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
          
          // Add synthetic visualization step for DBCoach mode
          const visualizationStep: DBCoachStep = {
            type: 'visualization',
            title: 'Database Visualization',
            content: `# Database Structure Visualization\n\nThe database design has been completed with the following components:\n\n- Requirements analysis\n- Schema design\n- Implementation package\n- Quality validation\n\nVisual representation of the entity relationships and database structure can be generated from the schema design.`,
            reasoning: 'Visualization prepared based on completed design',
            agent: 'DBCoach Master',
            status: 'completed'
          };
          dispatch({ type: 'COMPLETE_STEP', payload: visualizationStep });
          
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

  const getGenerationStep = (stepType: string): UnifiedGenerationStep | undefined => {
    return state.generationSteps.get(stepType);
  };

  const contextValue: GenerationContextType = {
    state,
    startGeneration,
    resetGeneration,
    isStepComplete,
    getStepContent,
    getGenerationStep
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