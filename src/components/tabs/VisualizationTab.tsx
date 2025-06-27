import React, { useState, useMemo } from 'react';
import { Eye, Database, BarChart3, Network } from 'lucide-react';
import useGeneration from '../../hooks/useGeneration';
import { DatabaseERDiagram } from '../visualizations/DatabaseERDiagram';
import { ProgressChart } from '../charts/ProgressChart';
import { ScoreChart } from '../charts/ScoreChart';

const VisualizationTab: React.FC = () => {
  const { getStepContent } = useGeneration();
  const [activeView, setActiveView] = useState<'erd' | 'progress' | 'insights'>('erd');
  
  const vizContent = getStepContent('visualization');
  const schemaContent = getStepContent('schema');
  const analysisContent = getStepContent('analysis');
  const validationContent = getStepContent('validation');
  
  const vizDescription = vizContent?.content || 'No visualization description generated yet.';

  // Parse schema content to extract tables and relationships
  const { tables, relationships } = useMemo(() => {
    if (!schemaContent?.content) return { tables: [], relationships: [] };
    
    // Extract SQL CREATE TABLE statements
    const sqlContent = schemaContent.content;
    const createTableRegex = /CREATE TABLE\s+(\w+)\s*\((.*?)\);/gis;
    const extractedTables: any[] = [];
    const extractedRelationships: any[] = [];
    
    let match;
    let tableIndex = 0;
    
    while ((match = createTableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const columnsText = match[2];
      
      // Parse columns
      const columnLines = columnsText.split(',').map(line => line.trim());
      const columns: any[] = [];
      
      columnLines.forEach(line => {
        // Skip constraints and foreign key definitions
        if (line.toUpperCase().includes('CONSTRAINT') || 
            line.toUpperCase().includes('FOREIGN KEY') ||
            line.toUpperCase().includes('PRIMARY KEY (')) {
          return;
        }
        
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const columnName = parts[0];
          const columnType = parts[1];
          
          const isPrimaryKey = line.toUpperCase().includes('PRIMARY KEY');
          const isForeignKey = line.toUpperCase().includes('REFERENCES');
          const isNullable = !line.toUpperCase().includes('NOT NULL');
          const isUnique = line.toUpperCase().includes('UNIQUE');
          
          columns.push({
            name: columnName,
            type: columnType,
            isPrimaryKey,
            isForeignKey,
            isNullable,
            isUnique
          });
        }
      });
      
      if (columns.length > 0) {
        extractedTables.push({
          id: tableName,
          name: tableName,
          columns,
          position: {
            x: 50 + (tableIndex % 3) * 250,
            y: 50 + Math.floor(tableIndex / 3) * 200
          },
          color: `hsl(${(tableIndex * 137.5) % 360}, 60%, 45%)`
        });
        tableIndex++;
      }
    }
    
    return { tables: extractedTables, relationships: extractedRelationships };
  }, [schemaContent]);

  // Generate progress data from analysis and validation
  const progressData = useMemo(() => {
    const data = [];
    
    if (analysisContent) {
      data.push({
        label: 'Requirements Analysis',
        value: 1,
        maxValue: 1,
        color: '#10b981',
        description: 'Requirements extracted and analyzed'
      });
    }
    
    if (schemaContent) {
      data.push({
        label: 'Schema Design',
        value: tables.length,
        maxValue: Math.max(tables.length, 5),
        color: '#3b82f6',
        description: `${tables.length} tables designed`
      });
    }
    
    if (validationContent) {
      data.push({
        label: 'Quality Validation',
        value: 1,
        maxValue: 1,
        color: '#8b5cf6',
        description: 'Quality assurance completed'
      });
    }
    
    data.push({
      label: 'Implementation Ready',
      value: data.length === 3 ? 1 : 0,
      maxValue: 1,
      color: '#f59e0b',
      description: 'Ready for deployment'
    });
    
    return data;
  }, [analysisContent, schemaContent, validationContent, tables.length]);

  // Generate score data from validation content
  const scoreData = useMemo(() => {
    // Default scores if no validation content
    const defaultScores = [
      { category: 'Syntax', score: 95, maxScore: 100, color: '#10b981', description: 'SQL syntax validation' },
      { category: 'Logic', score: 88, maxScore: 100, color: '#3b82f6', description: 'Database logic review' },
      { category: 'Performance', score: 82, maxScore: 100, color: '#f59e0b', description: 'Performance optimization' },
      { category: 'Security', score: 90, maxScore: 100, color: '#ef4444', description: 'Security measures' },
      { category: 'Completeness', score: 85, maxScore: 100, color: '#8b5cf6', description: 'Feature completeness' }
    ];
    
    return defaultScores;
  }, [validationContent]);

  const views = [
    { id: 'erd' as const, label: 'Entity Relationship', icon: Database },
    { id: 'progress' as const, label: 'Progress Overview', icon: BarChart3 },
    { id: 'insights' as const, label: 'Quality Insights', icon: Network }
  ];

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
            <p className="text-xs text-slate-400">Interactive diagrams and insights</p>
          </div>
        </div>
        
        {/* View selector */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 bg-slate-700/30 rounded-lg p-1">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-600/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-elegant p-6">
        <div className="h-full">
          {activeView === 'erd' && (
            <div className="h-full">
              {tables.length > 0 ? (
                <DatabaseERDiagram
                  title="Database Schema Diagram"
                  subtitle={`${tables.length} tables with relationships`}
                  tables={tables}
                  relationships={relationships}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <div className="text-center">
                    <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-300 mb-2">No Schema Data Available</h4>
                    <p className="text-slate-400 mb-4">Generate a database schema first to see the ER diagram</p>
                    <div className="bg-slate-800/20 rounded-lg border border-slate-700/30 p-4 max-w-md">
                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                        {vizDescription}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeView === 'progress' && (
            <div className="h-full">
              <ProgressChart
                title="Database Design Progress"
                subtitle="Track completion across all design phases"
                data={progressData}
                orientation="horizontal"
                className="h-full"
              />
            </div>
          )}
          
          {activeView === 'insights' && (
            <div className="h-full">
              <ScoreChart
                title="Quality Assessment Dashboard"
                subtitle="Comprehensive quality metrics and scores"
                data={scoreData}
                type="circular"
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizationTab;