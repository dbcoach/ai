import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  User,
  Bot,
  Loader2,
  Save,
  Database
} from 'lucide-react';
import { StreamingErrorBoundary } from './StreamingErrorBoundary';
import { conversationStorage, ConversationTitleGenerator, SavedConversation } from '../../services/conversationStorage';
import { useAuth } from '../../contexts/AuthContext';

interface StreamingTask {
  id: string;
  title: string;
  agent: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number;
  estimatedTime: number;
  startTime?: Date;
  endTime?: Date;
  subtasks: StreamingSubtask[];
}

interface StreamingSubtask {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number;
}

interface EnhancedStreamingInterfaceProps {
  prompt: string;
  dbType: string;
  onComplete?: (conversationId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  mode?: string; // 'dbcoach' | 'standard'
}

export function EnhancedStreamingInterface({ 
  prompt, 
  dbType, 
  onComplete, 
  onError, 
  className = '',
  mode = 'dbcoach'
}: EnhancedStreamingInterfaceProps) {
  const { user } = useAuth();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [tasks, setTasks] = useState<StreamingTask[]>([]);
  const [activeTask, setActiveTask] = useState<StreamingTask | null>(null);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [streamingSpeed, setStreamingSpeed] = useState(40);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [taskContent, setTaskContent] = useState<Map<string, string>>(new Map());
  const [insights, setInsights] = useState<Array<{ agent: string; message: string; timestamp: Date }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'none' | 'saving' | 'saved' | 'error'>('none');
  const [startTime] = useState(() => new Date());
  
  const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const cursorRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const insightsEndRef = useRef<HTMLDivElement>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize streaming session and capture
  useEffect(() => {
    initializeStreamingSession();
    
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const initializeStreamingSession = async () => {
    try {
      // Add initial insight
      setInsights([{
        agent: 'DB.Coach',
        message: `Starting ${mode} database generation for: ${prompt}`,
        timestamp: new Date()
      }]);

      // Initialize predefined tasks
      const predefinedTasks = [
        {
          id: 'requirements_analysis',
          title: 'Requirements Analysis',
          agent: 'Requirements Analyst',
          status: 'pending' as const,
          progress: 0,
          estimatedTime: 15,
          subtasks: [
            { id: 'analyze_domain', title: 'Analyzing domain context', status: 'pending' as const, progress: 0 },
            { id: 'extract_requirements', title: 'Extracting requirements', status: 'pending' as const, progress: 0 },
            { id: 'classify_complexity', title: 'Classifying complexity', status: 'pending' as const, progress: 0 }
          ]
        },
        {
          id: 'schema_design',
          title: 'Schema Design',
          agent: 'Schema Architect',
          status: 'pending' as const,
          progress: 0,
          estimatedTime: 25,
          subtasks: [
            { id: 'design_entities', title: 'Designing core entities', status: 'pending' as const, progress: 0 },
            { id: 'map_relationships', title: 'Mapping relationships', status: 'pending' as const, progress: 0 },
            { id: 'optimize_structure', title: 'Optimizing structure', status: 'pending' as const, progress: 0 }
          ]
        },
        {
          id: 'implementation_package',
          title: 'Implementation Package',
          agent: 'Implementation Specialist',
          status: 'pending' as const,
          progress: 0,
          estimatedTime: 20,
          subtasks: [
            { id: 'generate_sql', title: 'Generating SQL scripts', status: 'pending' as const, progress: 0 },
            { id: 'create_samples', title: 'Creating sample data', status: 'pending' as const, progress: 0 },
            { id: 'setup_apis', title: 'Setting up API examples', status: 'pending' as const, progress: 0 }
          ]
        },
        {
          id: 'quality_assurance',
          title: 'Quality Assurance',
          agent: 'Quality Assurance',
          status: 'pending' as const,
          progress: 0,
          estimatedTime: 10,
          subtasks: [
            { id: 'validate_design', title: 'Validating design', status: 'pending' as const, progress: 0 },
            { id: 'performance_review', title: 'Performance review', status: 'pending' as const, progress: 0 },
            { id: 'security_audit', title: 'Security audit', status: 'pending' as const, progress: 0 }
          ]
        }
      ];

      setTasks(predefinedTasks);

      // Start streaming simulation
      startStreamingSimulation(predefinedTasks);
      
    } catch (error) {
      console.error('Failed to initialize streaming session:', error);
      onError?.('Failed to initialize streaming session');
    }
  };

  const startStreamingSimulation = (tasks: StreamingTask[]) => {
    let currentTaskIndex = 0;

    const processNextTask = async () => {
      if (currentTaskIndex >= tasks.length) {
        await completeStreaming();
        return;
      }

      const task = tasks[currentTaskIndex];
      
      // Start task
      task.status = 'active';
      setActiveTask(task);
      setTasks([...tasks]);

      // Add insight about starting task
      setInsights(prev => [...prev, {
        agent: task.agent,
        message: `Starting ${task.title.toLowerCase()}...`,
        timestamp: new Date()
      }]);

      // Generate content for this task
      const content = generateTaskContent(task, prompt, dbType);
      
      // Stream content character by character
      let contentIndex = 0;
      const streamContent = async () => {
        if (contentIndex < content.length && isPlaying) {
          const charsToAdd = Math.max(1, Math.floor(streamingSpeed / 60));
          const newChars = content.substring(contentIndex, contentIndex + charsToAdd);
          contentIndex += charsToAdd;

          setTaskContent(prev => {
            const newMap = new Map(prev);
            const currentContent = newMap.get(task.id) || '';
            const updatedContent = currentContent + newChars;
            newMap.set(task.id, updatedContent);
            return newMap;
          });

          // Update progress
          const progress = Math.min(100, (contentIndex / content.length) * 100);
          task.progress = progress;
          setTasks([...tasks]);

          if (contentIndex < content.length) {
            setTimeout(streamContent, 1000 / 60); // 60 FPS
          } else {
            // Task completed
            task.status = 'completed';
            task.progress = 100;
            setTasks([...tasks]);

            // Add completion insight
            setInsights(prev => [...prev, {
              agent: task.agent,
              message: `${task.title} completed successfully!`,
              timestamp: new Date()
            }]);

            currentTaskIndex++;
            setTimeout(() => processNextTask(), 1000);
          }
        } else if (!isPlaying) {
          // Paused, check again later
          setTimeout(streamContent, 100);
        }
      };

      streamContent();
    };

    processNextTask();
  };

  const completeStreaming = async () => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');

      // Create conversation data for localStorage
      const endTime = new Date();
      const title = ConversationTitleGenerator.generate(prompt, dbType);
      
      const conversation: SavedConversation = {
        id: sessionId,
        prompt,
        dbType,
        title,
        generatedContent: Object.fromEntries(taskContent.entries()),
        insights: insights.map(insight => ({
          agent: insight.agent,
          message: insight.message,
          timestamp: insight.timestamp.toISOString()
        })),
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          agent: task.agent,
          status: 'completed' as const,
          progress: task.progress
        })),
        createdAt: startTime.toISOString(),
        updatedAt: endTime.toISOString(),
        status: 'completed',
        userId: user?.id,
        metadata: {
          duration: endTime.getTime() - startTime.getTime(),
          totalChunks: Array.from(taskContent.values()).join('').length,
          totalInsights: insights.length,
          mode
        }
      };

      // Save to localStorage
      console.log('🔵 About to save conversation:', conversation);
      await conversationStorage.saveConversation(conversation);
      console.log('✅ Conversation saved successfully!');

      setSaveStatus('saved');
      setTotalProgress(100);
      setIsPlaying(false);

      // Add final insight
      setInsights(prev => [...prev, {
        agent: 'DB.Coach',
        message: '✅ Database design complete! All components generated and saved successfully.',
        timestamp: new Date()
      }]);

      console.log(`Saved conversation: ${title}`);
      onComplete?.(sessionId);
    } catch (error) {
      console.error('Error completing streaming:', error);
      setSaveStatus('error');
      onError?.('Failed to save streaming results');
    } finally {
      setIsSaving(false);
    }
  };

  const generateTaskContent = (task: StreamingTask, prompt: string, dbType: string): string => {
    switch (task.id) {
      case 'requirements_analysis':
        return `# Requirements Analysis Report

## Domain Analysis
Based on the prompt: "${prompt}"

### Identified Entities:
- Primary entities detected from domain analysis
- Secondary supporting entities
- Junction/relationship entities

### Functional Requirements:
- Data storage requirements
- Query performance needs
- Scalability considerations
- Integration requirements

### Non-Functional Requirements:
- Performance targets: < 100ms query response
- Concurrency: Support 1000+ concurrent users
- Data consistency: ACID compliance required
- Security: Role-based access control

### Complexity Assessment:
- Schema complexity: Moderate to High
- Relationship complexity: High
- Query complexity: Moderate
- Estimated development time: 2-3 weeks`;

      case 'schema_design':
        return `# Database Schema Design

## Entity Relationship Diagram

### Core Tables:

\`\`\`sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Primary business entity
CREATE TABLE main_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### Relationships:
- One-to-Many: Users → Entities
- Many-to-Many: Entities ↔ Categories
- Self-referencing: Hierarchical structures

### Indexes:
- Primary keys: Clustered indexes
- Foreign keys: Non-clustered indexes
- Search fields: Composite indexes
- Unique constraints: Email, username`;

      case 'implementation_package':
        return `# Implementation Package

## SQL Scripts

### Database Creation:
\`\`\`sql
-- Database setup
CREATE DATABASE ${prompt.split(' ').slice(0,2).join('_').toLowerCase()}_db;
USE ${prompt.split(' ').slice(0,2).join('_').toLowerCase()}_db;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\`\`\`

### Sample Data:
\`\`\`sql
-- Insert sample users
INSERT INTO users (username, email, password_hash) VALUES
('admin', 'admin@example.com', 'hashed_password_1'),
('user1', 'user1@example.com', 'hashed_password_2'),
('user2', 'user2@example.com', 'hashed_password_3');

-- Insert sample entities
INSERT INTO main_entities (name, description, user_id) VALUES
('Sample Entity 1', 'Description for entity 1', 1),
('Sample Entity 2', 'Description for entity 2', 2);
\`\`\`

### API Examples:
\`\`\`javascript
// REST API endpoints
const api = {
  getUsers: () => fetch('/api/users'),
  createUser: (data) => fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getEntities: () => fetch('/api/entities'),
  createEntity: (data) => fetch('/api/entities', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
\`\`\``;

      case 'quality_assurance':
        return `# Quality Assurance Report

## Design Validation ✅
- Schema normalization: 3NF compliance verified
- Foreign key constraints: All relationships validated
- Data types: Appropriate selection confirmed
- Naming conventions: Consistent throughout

## Performance Analysis 📊
- Query optimization: Indexes properly placed
- Expected query time: < 50ms for most operations
- Scalability: Designed for 10x growth
- Connection pooling: Recommended configuration

## Security Audit 🔒
- SQL injection prevention: Parameterized queries
- Data encryption: Sensitive fields protected
- Access control: Role-based permissions
- Audit logging: All changes tracked

## Recommendations:
1. Implement regular backups (daily)
2. Monitor query performance metrics
3. Set up replication for high availability
4. Regular security updates and patches

## Deployment Checklist:
- [ ] Database server configuration
- [ ] Security hardening
- [ ] Backup strategy implementation
- [ ] Monitoring setup
- [ ] Performance baseline establishment`;

      default:
        return `Generated content for ${task.title}...`;
    }
  };

  const getContentType = (taskTitle: string): 'text' | 'code' | 'schema' | 'query' => {
    if (taskTitle.toLowerCase().includes('schema') || taskTitle.toLowerCase().includes('design')) {
      return 'schema';
    }
    if (taskTitle.toLowerCase().includes('sql') || taskTitle.toLowerCase().includes('implementation')) {
      return 'code';
    }
    if (taskTitle.toLowerCase().includes('query')) {
      return 'query';
    }
    return 'text';
  };

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    completeStreaming();
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setStreamingSpeed(speed);
  }, []);

  const getStatusIcon = (status: StreamingTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'active': return <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAgentColor = (agent: string): string => {
    const colors = {
      'Requirements Analyst': 'from-blue-600 to-cyan-600',
      'Schema Architect': 'from-purple-600 to-pink-600',
      'Implementation Specialist': 'from-green-600 to-emerald-600',
      'Quality Assurance': 'from-orange-600 to-red-600'
    };
    return colors[agent as keyof typeof colors] || 'from-slate-600 to-slate-700';
  };

  return (
    <StreamingErrorBoundary>
      <div className={`h-full bg-slate-900/20 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                DB.Coach Live Generation
              </h2>
              <p className="text-slate-400 text-sm">
                Creating {dbType} database: "{prompt.substring(0, 50)}..."
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-yellow-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Saved</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Save Error</span>
                </div>
              )}
            </div>
            
            <div className="text-sm text-slate-400">
              ETA: {Math.floor(estimatedTimeRemaining / 60)}:{(estimatedTimeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <span className="text-sm text-slate-300 font-mono">
              {Math.round(totalProgress)}%
            </span>
          </div>
        </div>

        <div className="flex h-full">
          {/* Left Side: AI Agent Reasoning Stream */}
          <div className="w-1/2 border-r border-slate-700/50 bg-slate-800/20 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                AI Agent Reasoning
              </h3>
              <p className="text-sm text-slate-400 mt-1">Watch agents think and make decisions</p>
            </div>
            
            {/* Task Progress Overview */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/10">
              <div className="grid grid-cols-2 gap-3">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      task.status === 'active' 
                        ? 'bg-yellow-500/10 border-yellow-500/30' 
                        : task.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-slate-700/30 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(task.status)}
                      <span className="text-sm font-medium text-white truncate">{task.title}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live AI Reasoning Stream */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAgentColor(insight.agent)} flex items-center justify-center flex-shrink-0`}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{insight.agent}</span>
                        <span className="text-xs text-slate-500">
                          {insight.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <p className="text-slate-300 leading-relaxed">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator for active agent */}
                {activeTask && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAgentColor(activeTask.agent)} flex items-center justify-center flex-shrink-0`}>
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{activeTask.agent}</span>
                        <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-yellow-500/30">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-yellow-300 text-sm">Generating...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={insightsEndRef} />
              </div>
            </div>
          </div>

          {/* Right Side: Generated Results */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-green-400" />
                Generated Database Design
              </h3>
              <p className="text-sm text-slate-400 mt-1">Real-time content generation</p>
            </div>

            {/* Live Content Generation */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                {tasks.map((task) => {
                  const content = taskContent.get(task.id) || '';
                  
                  return (
                    <div key={task.id} className={`transition-all duration-300 ${
                      task.status === 'pending' ? 'opacity-30' : 'opacity-100'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getAgentColor(task.agent)} flex items-center justify-center`}>
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <h4 className="font-semibold text-white">{task.title}</h4>
                        {task.status === 'active' && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs text-green-400">Generating...</span>
                          </div>
                        )}
                        {task.status === 'completed' && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400">Complete</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 min-h-[100px]">
                        {content ? (
                          <div 
                            ref={(el) => {
                              if (el) contentRefs.current.set(task.id, el);
                            }}
                            className="text-slate-200 whitespace-pre-wrap font-mono text-sm leading-relaxed"
                          >
                            {content}
                            {task.status === 'active' && (
                              <span 
                                ref={(el) => {
                                  if (el) cursorRefs.current.set(task.id, el);
                                }}
                                className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-1"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-20 text-slate-500">
                            {task.status === 'pending' ? (
                              <span className="text-sm">Waiting for {task.agent}...</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Preparing content...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="border-t border-slate-700/50 bg-slate-800/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayPause}
                    disabled={isSaving}
                    className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={handleStop}
                    disabled={isSaving}
                    className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleStop()}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save & Complete
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-300">Speed:</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={streamingSpeed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    className="w-24 accent-purple-500"
                  />
                  <span className="text-sm text-slate-400 font-mono w-8">
                    {(streamingSpeed / 40).toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StreamingErrorBoundary>
  );
}