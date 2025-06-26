import React, { useState } from 'react';
import { Copy, Download, Code, Database, Wrench } from 'lucide-react';
import useGeneration from '../../hooks/useGeneration';

const ImplementationTab: React.FC = () => {
  const { getStepContent } = useGeneration();
  const content = getStepContent('implementation');
  const [selectedSection, setSelectedSection] = useState<'overview' | 'migrations' | 'data' | 'api' | 'monitoring'>('overview');

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Code className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Implementation package not yet generated</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content.content);
  };

  const exportContent = () => {
    const blob = new Blob([content.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'implementation-package.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: Wrench },
    { id: 'migrations' as const, label: 'Migrations', icon: Database },
    { id: 'data' as const, label: 'Sample Data', icon: Code },
    { id: 'api' as const, label: 'API Examples', icon: Code },
    { id: 'monitoring' as const, label: 'Monitoring', icon: Wrench },
  ];

  const extractSection = (content: string, sectionName: string) => {
    const variations = [
      sectionName,
      sectionName.toLowerCase(),
      sectionName.toUpperCase(),
      sectionName.replace(/\s+/g, ''),
      sectionName.replace(/\s+/g, '-'),
      sectionName.replace(/\s+/g, '_'),
    ];

    for (const variation of variations) {
      const patterns = [
        new RegExp(`#{1,6}\\s*${variation}[\\s\\S]*?(?=#{1,6}|$)`, 'gi'),
        new RegExp(`\\*\\*${variation}\\*\\*[\\s\\S]*?(?=\\*\\*|$)`, 'gi'),
        new RegExp(`## ${variation}[\\s\\S]*?(?=##|$)`, 'gi'),
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[0].trim().length > variation.length + 10) {
          return match[0].trim();
        }
      }
    }
    return null;
  };

  const renderSectionContent = () => {
    const fullContent = content.content;

    switch (selectedSection) {
      case 'overview':
        return (
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
              {fullContent.substring(0, 2000)}
              {fullContent.length > 2000 && (
                <span className="text-slate-500">... (showing first 2000 characters)</span>
              )}
            </div>
          </div>
        );

      case 'migrations': {
        const migrationsContent = extractSection(fullContent, 'Migration') || 
                                 extractSection(fullContent, 'Schema') ||
                                 extractSection(fullContent, 'DDL');
        return (
          <div className="space-y-4">
            {migrationsContent ? (
              <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 overflow-auto">
                {migrationsContent}
              </pre>
            ) : (
              <div className="text-slate-400 text-center py-8">
                <Database className="w-8 h-8 mx-auto mb-2" />
                <p>Migration scripts section not found in the implementation package</p>
              </div>
            )}
          </div>
        );
      }

      case 'data': {
        const dataContent = extractSection(fullContent, 'Sample Data') || 
                           extractSection(fullContent, 'Test Data') ||
                           extractSection(fullContent, 'INSERT');
        return (
          <div className="space-y-4">
            {dataContent ? (
              <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 overflow-auto">
                {dataContent}
              </pre>
            ) : (
              <div className="text-slate-400 text-center py-8">
                <Code className="w-8 h-8 mx-auto mb-2" />
                <p>Sample data section not found in the implementation package</p>
              </div>
            )}
          </div>
        );
      }

      case 'api': {
        const apiContent = extractSection(fullContent, 'API') || 
                          extractSection(fullContent, 'Endpoint') ||
                          extractSection(fullContent, 'CRUD');
        return (
          <div className="space-y-4">
            {apiContent ? (
              <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 overflow-auto">
                {apiContent}
              </pre>
            ) : (
              <div className="text-slate-400 text-center py-8">
                <Code className="w-8 h-8 mx-auto mb-2" />
                <p>API examples section not found in the implementation package</p>
              </div>
            )}
          </div>
        );
      }

      case 'monitoring': {
        const monitoringContent = extractSection(fullContent, 'Monitoring') || 
                                 extractSection(fullContent, 'Performance') ||
                                 extractSection(fullContent, 'Health');
        return (
          <div className="space-y-4">
            {monitoringContent ? (
              <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 overflow-auto">
                {monitoringContent}
              </pre>
            ) : (
              <div className="text-slate-400 text-center py-8">
                <Wrench className="w-8 h-8 mx-auto mb-2" />
                <p>Monitoring section not found in the implementation package</p>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };


  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6 border-b border-slate-700/50 bg-slate-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Implementation Package</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-300"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={exportContent}
              className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors text-sm text-purple-300"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex space-x-2 mt-4 overflow-x-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = selectedSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {renderSectionContent()}
      </div>
    </div>
  );
};

export default ImplementationTab;