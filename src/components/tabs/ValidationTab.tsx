import React, { useState } from 'react';
import { Copy, Download, Shield, CheckCircle, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';
import useGeneration from '../../hooks/useGeneration';

const ValidationTab: React.FC = () => {
  const { getStepContent } = useGeneration();
  const content = getStepContent('validation');
  const [selectedSection, setSelectedSection] = useState<'overview' | 'technical' | 'performance' | 'security' | 'recommendations'>('overview');

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Quality assurance report not yet generated</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content.content);
  };

  const exportReport = () => {
    const blob = new Blob([content.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quality-assurance-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sections = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'technical' as const, label: 'Technical', icon: CheckCircle },
    { id: 'performance' as const, label: 'Performance', icon: BarChart3 },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'recommendations' as const, label: 'Recommendations', icon: AlertTriangle },
  ];

  const extractSection = (content: string, sectionName: string) => {
    const variations = [
      sectionName,
      sectionName.toLowerCase(),
      sectionName.toUpperCase(),
      `${sectionName} Validation`,
      `${sectionName} Review`,
      `${sectionName} Assessment`,
      `${sectionName} Audit`,
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

  const parseValidationItems = (text: string) => {
    const items: Array<{ type: 'pass' | 'warning' | 'fail', text: string }> = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('✓') || trimmed.includes('PASS') || trimmed.includes('✅')) {
        items.push({ type: 'pass', text: trimmed.replace(/[✓✅]/gu, '').trim() });
      } else if (trimmed.includes('⚠') || trimmed.includes('WARNING') || trimmed.includes('🟡')) {
        items.push({ type: 'warning', text: trimmed.replace(/[⚠🟡]/gu, '').trim() });
      } else if (trimmed.includes('❌') || trimmed.includes('FAIL') || trimmed.includes('✗')) {
        items.push({ type: 'fail', text: trimmed.replace(/[❌✗]/gu, '').trim() });
      } else if (trimmed.includes('-') || trimmed.includes('•') || trimmed.includes('*')) {
        // Default to neutral/info item
        if (trimmed.length > 5) {
          items.push({ type: 'pass', text: trimmed.replace(/^[-•*]\s*/, '') });
        }
      }
    }

    return items;
  };

  const renderValidationItems = (items: Array<{ type: 'pass' | 'warning' | 'fail', text: string }>) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        {items.map((item, index) => {
          const iconColor = item.type === 'pass' ? 'text-green-400' : 
                           item.type === 'warning' ? 'text-yellow-400' : 'text-red-400';
          const bgColor = item.type === 'pass' ? 'bg-green-900/20 border-green-700/50' : 
                         item.type === 'warning' ? 'bg-yellow-900/20 border-yellow-700/50' : 'bg-red-900/20 border-red-700/50';
          const Icon = item.type === 'pass' ? CheckCircle : 
                      item.type === 'warning' ? AlertTriangle : XCircle;

          return (
            <div key={index} className={`p-3 rounded-lg border ${bgColor}`}>
              <div className="flex items-start space-x-3">
                <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                <p className="text-slate-300 text-sm leading-relaxed">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSectionContent = () => {
    const fullContent = content.content;

    switch (selectedSection) {
      case 'overview': {
        const summaryContent = extractSection(fullContent, 'Summary') || 
                              extractSection(fullContent, 'Overview') ||
                              fullContent.substring(0, 1500);
        return (
          <div className="space-y-6">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
              <h4 className="text-purple-300 font-medium mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Quality Assessment Summary
              </h4>
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {summaryContent}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'technical': {
        const technicalContent = extractSection(fullContent, 'Technical') ||
                                extractSection(fullContent, 'Validation');
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
              <h4 className="text-green-300 font-medium mb-4 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Technical Validation Results
              </h4>
              {technicalContent ? (
                renderValidationItems(parseValidationItems(technicalContent))
              ) : (
                <p className="text-slate-400">Technical validation details not found in the report</p>
              )}
            </div>
          </div>
        );
      }

      case 'performance': {
        const performanceContent = extractSection(fullContent, 'Performance') ||
                                  extractSection(fullContent, 'Optimization') ||
                                  extractSection(fullContent, 'Scalability');
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
              <h4 className="text-blue-300 font-medium mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance Review
              </h4>
              {performanceContent ? (
                <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {performanceContent}
                </div>
              ) : (
                <p className="text-slate-400">Performance review details not found in the report</p>
              )}
            </div>
          </div>
        );
      }

      case 'security': {
        const securityContent = extractSection(fullContent, 'Security') ||
                               extractSection(fullContent, 'Audit');
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
              <h4 className="text-orange-300 font-medium mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Security Audit Results
              </h4>
              {securityContent ? (
                renderValidationItems(parseValidationItems(securityContent))
              ) : (
                <p className="text-slate-400">Security audit details not found in the report</p>
              )}
            </div>
          </div>
        );
      }

      case 'recommendations': {
        const recommendationsContent = extractSection(fullContent, 'Recommendation') ||
                                      extractSection(fullContent, 'Next Steps') ||
                                      extractSection(fullContent, 'Action Items');
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
              <h4 className="text-yellow-300 font-medium mb-4 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recommendations & Next Steps
              </h4>
              {recommendationsContent ? (
                <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {recommendationsContent}
                </div>
              ) : (
                <p className="text-slate-400">Recommendations not found in the report</p>
              )}
            </div>
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
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Quality Assurance Report</h3>
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
              onClick={exportReport}
              className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors text-sm text-purple-300"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex space-x-2 mt-4 overflow-x-auto scrollbar-elegant">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = selectedSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
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
      
      <div className="flex-1 overflow-auto scrollbar-elegant p-6">
        {renderSectionContent()}
      </div>
    </div>
  );
};

export default ValidationTab;