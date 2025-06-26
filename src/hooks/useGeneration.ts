import { useGeneration as useGenerationContext } from '../context/GenerationContext';
import { TabType } from '../context/GenerationContext';

export function useGeneration() {
  const context = useGenerationContext();
  
  return {
    // State
    isGenerating: context.state.isGenerating,
    currentStep: context.state.currentStep,
    completedSteps: Array.from(context.state.completedSteps),
    reasoningMessages: context.state.reasoningMessages,
    error: context.state.error,
    prompt: context.state.prompt,
    dbType: context.state.dbType,
    state: context.state, // Expose full state for components that need it
    
    // Actions
    startGeneration: context.startGeneration,
    resetGeneration: context.resetGeneration,
    
    // Utilities
    isStepComplete: context.isStepComplete,
    getStepContent: context.getStepContent,
    
    // Progress tracking
    getProgress: () => {
      const totalSteps = 4; // schema, data, api, visualization
      const completedCount = context.state.completedSteps.size;
      return Math.round((completedCount / totalSteps) * 100);
    },
    
    // Tab status helpers
    getTabStatus: (tab: TabType) => {
      if (context.state.completedSteps.has(tab)) {
        return 'completed';
      } else if (context.state.currentStep === tab) {
        return 'generating';
      } else {
        return 'pending';
      }
    }
  };
}

export default useGeneration;