import React, { useState } from 'react';
import { ArrowLeft, Eye, Code, Database, Zap } from 'lucide-react';
import AIReasoningPanel from './AIReasoningPanel';
import SchemaTab from './tabs/SchemaTab';
import SampleDataTab from './tabs/SampleDataTab';
import APIEndpointsTab from './tabs/APIEndpointsTab';
import VisualizationTab from './tabs/VisualizationTab';
import useGeneration from '../hooks/useGeneration';

interface GenerationViewProps {
  onBack: () => void;
}

type TabType = 'schema' | 'data' | 'api' | 'visualization';

const GenerationView: React.FC<GenerationViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('schema');
  const { 
    isGenerating, 
    prompt, 
    dbType, 
    getTabStatus
  } = useGeneration();

  const tabs = [
    { id: 'schema' as TabType, label: 'Schema', icon: Database },
    { id: 'data' as TabType, label: 'Sample Data', icon: Eye },
    { id: 'api' as TabType, label: 'API Endpoints', icon: Code },
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
      case 'schema':
        return <SchemaTab dbType={dbType} />;
      case 'data':
        return <SampleDataTab />;
      case 'api':
        return <APIEndpointsTab />;
      case 'visualization':
        return <VisualizationTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* AI Reasoning Panel - Left */}
      <div className="w-2/5 border-r border-slate-700/50 bg-slate-800/20 backdrop-blur-sm">
        <div className="p-6 border-b border-slate-700/50">
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
        <AIReasoningPanel />
      </div>

      {/* Results Panel - Right */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Database Design Results</h1>
              <p className="text-slate-400 mt-1">
                {dbType} database for: "{prompt}"
              </p>
            </div>
            {isGenerating && (
              <div className="flex items-center space-x-2 text-purple-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Generating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-700/50 bg-slate-800/10 backdrop-blur-sm">
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
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
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
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default GenerationView;