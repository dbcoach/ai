import React from 'react';
import { Download, Code } from 'lucide-react';
import useGeneration from '../../hooks/useGeneration';

const SampleDataTab: React.FC = () => {
  const { getStepContent } = useGeneration();
  
  const dataContent = getStepContent('data');
  const sampleDataCode = dataContent?.content || 'No sample data generated yet.';

  // For now, we'll show the code view since parsing dynamic data into tables would be complex
  // In a production app, you'd want to parse the data content and display it properly

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center space-x-4">
          <h3 className="font-medium text-white">
            {dataContent?.title || 'Sample Data'}
          </h3>
          <div className="flex items-center space-x-2 text-slate-400">
            <Code className="w-4 h-4" />
            <span className="text-sm">Generated Sample Data</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all duration-200">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export CSV</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-200">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export JSON</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Line numbers */}
          <div className="bg-slate-800/50 border-r border-slate-700/50 p-4 text-slate-500 text-sm font-mono select-none">
            {sampleDataCode.split('\n').map((_, index) => (
              <div key={index} className="leading-6">
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* Code content */}
          <div className="flex-1 p-4 font-mono text-sm leading-6 overflow-x-auto">
            <pre className="text-slate-200">
              <code dangerouslySetInnerHTML={{ 
                __html: sampleDataCode
                  .replace(/--.*$/gm, '<span style="color: #6B7280; font-style: italic;">$&</span>')
                  .replace(/\b(INSERT|INTO|VALUES|SELECT|FROM|WHERE|AND|OR|CREATE|TABLE|PRIMARY|KEY|REFERENCES|INDEX|ON|DELETE|CASCADE|SET|NULL|DEFAULT|CURRENT_TIMESTAMP|UNIQUE|NOT|SERIAL|INTEGER|VARCHAR|TEXT|BOOLEAN|TIMESTAMP)\b/g, '<span style="color: #8B5CF6; font-weight: 600;">$1</span>')
                  .replace(/\b([a-z_]+)(?=\s*\()/g, '<span style="color: #10B981;">$1</span>')
                  .replace(/'([^']*)'/g, '<span style="color: #F59E0B;">\'$1\'</span>')
              }} />
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleDataTab;