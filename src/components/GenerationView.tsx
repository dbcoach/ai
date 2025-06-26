import React, { useState } from 'react';
import { ArrowLeft, FileText, Database, Code, Shield, Zap } from 'lucide-react';
import AIReasoningPanel from './AIReasoningPanel';
import AnalysisTab from './tabs/AnalysisTab';
import SchemaTab from './tabs/SchemaTab';
import ImplementationTab from './tabs/ImplementationTab';
import ValidationTab from './tabs/ValidationTab';
import VisualizationTab from './tabs/VisualizationTab';
import useGeneration from '../hooks/useGeneration';

interface GenerationViewProps {
  onBack: () => void;
}

type TabType = 'analysis' | 'schema' | 'implementation' | 'validation' | 'visualization';

const GenerationView: React.FC<GenerationViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('analysis');
  const { 
    isGenerating, 
    prompt, 
    dbType, 
    getTabStatus
  } = useGeneration();

  const tabs = [
    { id: 'analysis' as TabType, label: 'Requirements', icon: FileText },
    { id: 'schema' as TabType, label: 'Schema Design', icon: Database },
    { id: 'implementation' as TabType, label: 'Implementation', icon: Code },
    { id: 'validation' as TabType, label: 'Quality Report', icon: Shield },
    { id: 'visualization' as TabType, label: 'Visualization', icon: Zap },
  ];

  const renderTabContent = () => {
    const tabStatus = getTabStatus(activeTab);
    
    if (tabStatus === 'pending' || tabStatus === 'generating') {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">
              {tabStatus === 'generating' ? 'Generating' : 'Waiting for'} {tabs.find(t => t.id === activeTab)?.label}...
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'analysis':
        return <AnalysisTab />;
      case 'schema':
        return <SchemaTab dbType={dbType} />;
      case 'implementation':
        return <ImplementationTab />;
      case 'validation':
        return <ValidationTab />;
      case 'visualization':
        return <VisualizationTab />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex overflow-hidden">
      {/* AI Reasoning Panel - Left */}
      <div className="w-2/5 border-r border-slate-700/50 bg-slate-800/20 backdrop-blur-sm flex flex-col">
        <div className="flex-shrink-0 p-6 border-b border-slate-700/50">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Input</span>
          </button>
          <h2 className="text-xl font-semibold text-white">AI Reasoning</h2>
          <p className="text-slate-400 text-sm mt-1">Watch the AI design your database</p>
        </div>
        <div className="flex-1 min-h-0">
          <AIReasoningPanel />
        </div>
      </div>

      {/* Results Panel - Right */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-slate-700/50 bg-slate-800/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-white truncate">Database Design Results</h1>
              <p className="text-slate-400 mt-1 truncate">
                {dbType} database for: "{prompt}"
              </p>
            </div>
            {isGenerating && (
              <div className="flex items-center space-x-2 text-purple-400 flex-shrink-0 ml-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Generating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex-shrink-0 flex border-b border-slate-700/50 bg-slate-800/10 backdrop-blur-sm overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const tabStatus = getTabStatus(tab.id);
            const isActive = activeTab === tab.id;
            const canClick = tabStatus === 'completed';
            
            return (
              <button
                key={tab.id}
                onClick={() => canClick && setActiveTab(tab.id)}
                disabled={!canClick}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'text-purple-400 border-purple-400 bg-slate-800/30'
                    : canClick
                    ? 'text-slate-300 border-transparent hover:text-white hover:bg-slate-800/20'
                    : 'text-slate-500 border-transparent cursor-not-allowed opacity-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tabStatus === 'completed' && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
                {tabStatus === 'generating' && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        /* Webkit browsers */
        :global(.scrollbar-elegant::-webkit-scrollbar) {
          width: 8px;
          height: 8px;
        }
        
        :global(.scrollbar-elegant::-webkit-scrollbar-track) {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 4px;
        }
        
        :global(.scrollbar-elegant::-webkit-scrollbar-thumb) {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        :global(.scrollbar-elegant::-webkit-scrollbar-thumb:hover) {
          background: rgba(139, 92, 246, 0.6);
        }
        
        :global(.scrollbar-elegant::-webkit-scrollbar-corner) {
          background: rgba(30, 41, 59, 0.3);
        }
        
        /* Firefox */
        :global(.scrollbar-elegant) {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.4) rgba(30, 41, 59, 0.3);
        }
      `}</style>
    </div>
  );
};

export default GenerationView;