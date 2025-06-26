import React from 'react';
import { Download, Eye } from 'lucide-react';
import useGeneration from '../../hooks/useGeneration';

const VisualizationTab: React.FC = () => {
  const { getStepContent } = useGeneration();
  
  const vizContent = getStepContent('visualization');
  const vizDescription = vizContent?.content || 'No visualization description generated yet.';

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center space-x-3 min-w-0">
          <Eye className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium text-white truncate">
              {vizContent?.title || 'Database Visualization'}
            </h3>
            <p className="text-xs text-slate-400">Entity relationships and structure</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-200">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export Diagram</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-elegant p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-6">
            <div className="prose prose-slate prose-invert max-w-none">
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {vizDescription}
              </div>
            </div>
          </div>
          
          {/* Placeholder for future interactive diagram */}
          <div className="mt-6 bg-slate-800/20 rounded-lg border border-slate-700/30 p-8 text-center">
            <div className="text-slate-400 mb-4">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Interactive Diagram</p>
              <p className="text-sm">Visual ER diagram coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationTab;