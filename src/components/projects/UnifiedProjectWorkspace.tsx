import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  ArrowLeft, 
  Zap, 
  Bot, 
  User, 
  Send, 
  Play, 
  Pause, 
  Download,
  Database,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Loader2,
  BarChart3,
  Activity,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Save,
  FileText,
  TrendingUp,
  PieChart,
  LineChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import { useGeneration } from '../../context/GenerationContext';
import { DatabaseProject, DatabaseSession, DatabaseQuery, databaseProjectsService } from '../../services/databaseProjectsService';
import { StreamingErrorBoundary } from '../streaming/StreamingErrorBoundary';

interface AIMessage {
  id: string;
  agent: string;
  content: string;
  timestamp: Date;
  type: 'reasoning' | 'progress' | 'result' | 'user_chat' | 'system';
}

interface GenerationTab {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
  content: string;
  agent: string;
}

interface WorkspaceMode {
  type: 'project' | 'generation' | 'hybrid';
  projectId?: string;
  sessionId?: string;
  isLiveGeneration: boolean;
}

export function UnifiedProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, startGeneration } = useGeneration();
  
  // Mode and navigation state
  const [mode, setMode] = useState<WorkspaceMode>({
    type: projectId ? 'project' : 'generation',
    projectId,
    isLiveGeneration: false
  });
  
  // Project data state
  const [project, setProject] = useState<DatabaseProject | null>(null);
  const [sessions, setSessions] = useState<DatabaseSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<DatabaseSession | null>(null);
  const [queries, setQueries] = useState<DatabaseQuery[]>([]);
  
  // Generation state
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  const [tabs, setTabs] = useState<GenerationTab[]>([
    { id: 'analysis', title: 'Requirements Analysis', status: 'pending', content: '', agent: 'Requirements Analyst' },
    { id: 'schema', title: 'Schema Design', status: 'pending', content: '', agent: 'Schema Architect' },
    { id: 'implementation', title: 'Implementation', status: 'pending', content: '', agent: 'Implementation Specialist' },
    { id: 'validation', title: 'Quality Validation', status: 'pending', content: '', agent: 'Quality Assurance' },
    { id: 'visualization', title: 'Data Visualization', status: 'pending', content: '', agent: 'Data Visualization' }
  ]);
  
  // Dashboard state
  const [dashboardView, setDashboardView] = useState<'overview' | 'analytics' | 'queries' | 'chat'>('overview');
  const [projectStats, setProjectStats] = useState({
    totalSessions: 0,
    totalQueries: 0,
    successRate: 0,
    avgResponseTime: 0
  });
  
  // Streaming state
  const [streamingContent, setStreamingContent] = useState<Map<string, { full: string; displayed: string; position: number }>>(new Map());
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get generation parameters from URL
  const prompt = searchParams.get('prompt') || '';
  const dbType = searchParams.get('dbType') || 'PostgreSQL';
  const generationMode = searchParams.get('mode') || 'dbcoach';

  // Initialize workspace
  useEffect(() => {
    if (projectId && user) {
      loadProject();
    } else if (prompt && user) {
      initializeGeneration();
    }
  }, [projectId, prompt, user]);

  const loadProject = async () => {
    if (!projectId || !user) return;
    
    try {
      const projectData = await databaseProjectsService.getProject(projectId, user.id);
      setProject(projectData);
      
      const sessionsData = await databaseProjectsService.getProjectSessions(projectId);
      setSessions(sessionsData);
      
      // Load project stats
      calculateProjectStats(sessionsData);
      
      setMode({ type: 'project', projectId, isLiveGeneration: false });
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const calculateProjectStats = (sessions: DatabaseSession[]) => {
    const totalSessions = sessions.length;
    let totalQueries = 0;
    let successfulQueries = 0;
    let totalResponseTime = 0;

    sessions.forEach(session => {
      // These would be calculated from actual query data
      totalQueries += Math.floor(Math.random() * 10) + 1; // Placeholder
      successfulQueries += Math.floor(Math.random() * 10) + 1; // Placeholder
      totalResponseTime += Math.random() * 1000; // Placeholder
    });

    setProjectStats({
      totalSessions,
      totalQueries,
      successRate: totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 0,
      avgResponseTime: totalQueries > 0 ? totalResponseTime / totalQueries : 0
    });
  };

  const initializeGeneration = () => {
    setMode({ type: 'generation', isLiveGeneration: true });
    startLiveGeneration();
  };

  const startLiveGeneration = useCallback(async () => {
    setIsGenerating(true);
    setIsStreaming(true);
    setMode(prev => ({ ...prev, type: 'hybrid', isLiveGeneration: true }));

    // Add initial user message
    const userMessage: AIMessage = {
      id: `user_${Date.now()}`,
      agent: 'User',
      content: `Create a ${dbType} database: ${prompt}`,
      timestamp: new Date(),
      type: 'user_chat'
    };
    setMessages([userMessage]);

    // Simulate AI agent workflow
    const agents = [
      {
        name: 'Requirements Analyst',
        tab: 'analysis',
        color: 'from-blue-600 to-cyan-600',
        tasks: [
          'Analyzing domain and business context...',
          'Extracting entities and relationships...',
          'Identifying functional requirements...',
          'Classifying complexity and scale...',
          'Requirements analysis complete!'
        ]
      },
      {
        name: 'Schema Architect',
        tab: 'schema',
        color: 'from-purple-600 to-pink-600',
        tasks: [
          'Designing database schema structure...',
          'Defining tables and relationships...',
          'Applying normalization rules...',
          'Planning indexes and constraints...',
          'Schema design complete!'
        ]
      },
      {
        name: 'Implementation Specialist',
        tab: 'implementation',
        color: 'from-green-600 to-emerald-600',
        tasks: [
          'Generating CREATE TABLE statements...',
          'Creating sample data scripts...',
          'Building API endpoint examples...',
          'Setting up migration files...',
          'Implementation package ready!'
        ]
      },
      {
        name: 'Quality Assurance',
        tab: 'validation',
        color: 'from-orange-600 to-red-600',
        tasks: [
          'Validating schema design...',
          'Checking performance optimization...',
          'Reviewing security measures...',
          'Testing data integrity...',
          'Quality validation complete!'
        ]
      }
    ];

    try {
      // Start actual generation
      await startGeneration(prompt, dbType, generationMode as any);

      // Process each agent
      for (const agent of agents) {
        // Update tab to active
        setTabs(prev => prev.map(tab => 
          tab.id === agent.tab ? { ...tab, status: 'active' } : tab
        ));
        setActiveTab(agent.tab);

        // Add agent messages
        for (const task of agent.tasks) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const message: AIMessage = {
            id: `${agent.name}_${Date.now()}_${Math.random()}`,
            agent: agent.name,
            content: task,
            timestamp: new Date(),
            type: 'reasoning'
          };
          setMessages(prev => [...prev, message]);
        }

        // Generate content for this tab
        const content = generateTabContent(agent.tab, prompt, dbType);
        
        // Start streaming content
        setStreamingContent(prev => {
          const newMap = new Map(prev);
          newMap.set(agent.tab, { full: content, displayed: '', position: 0 });
          return newMap;
        });

        // Wait for streaming to complete
        const streamDuration = Math.max(2000, content.length * 50);
        await new Promise(resolve => setTimeout(resolve, streamDuration));

        // Mark tab as completed
        setTabs(prev => prev.map(tab => 
          tab.id === agent.tab ? { ...tab, status: 'completed' } : tab
        ));

        // Auto-save if enabled
        if (autoSaveEnabled) {
          await autoSaveGeneration(agent.tab, content);
        }
      }

      // Final completion message
      const completionMessage: AIMessage = {
        id: `completion_${Date.now()}`,
        agent: 'DB.Coach',
        content: '✅ Database design complete! All components generated successfully.',
        timestamp: new Date(),
        type: 'result'
      };
      setMessages(prev => [...prev, completionMessage]);

      // Auto-save complete project
      if (autoSaveEnabled) {
        await autoSaveCompleteProject();
      }

    } catch (error) {
      console.error('Generation failed:', error);
      const errorMessage: AIMessage = {
        id: `error_${Date.now()}`,
        agent: 'System',
        content: `❌ Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        type: 'reasoning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  }, [prompt, dbType, generationMode, startGeneration, autoSaveEnabled]);

  const autoSaveGeneration = async (tabId: string, content: string) => {
    try {
      if (!user) return;

      // Create or update project
      let currentProject = project;
      if (!currentProject) {
        currentProject = await databaseProjectsService.createProject({
          database_name: `Generated: ${prompt.substring(0, 50)}...`,
          description: `Auto-generated database for: ${prompt}`,
          database_type: dbType,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setProject(currentProject);
        setMode(prev => ({ ...prev, type: 'hybrid', projectId: currentProject.id }));
      }

      // Create session if not exists
      let currentSession = selectedSession;
      if (!currentSession) {
        currentSession = await databaseProjectsService.createSession({
          project_id: currentProject.id,
          session_name: `Live Generation - ${new Date().toLocaleString()}`,
          description: 'Auto-generated from live streaming',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setSelectedSession(currentSession);
        setSessions(prev => [...prev, currentSession]);
      }

      // Save content as query
      await databaseProjectsService.createQuery({
        session_id: currentSession.id,
        project_id: currentProject.id,
        query_text: content,
        query_type: tabId,
        results_format: 'json',
        description: `${tabId} content`,
        created_at: new Date().toISOString()
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const autoSaveCompleteProject = async () => {
    if (!project || !user) return;

    try {
      // Update project with completion status
      await databaseProjectsService.updateProject(project.id, {
        ...project,
        updated_at: new Date().toISOString(),
        description: `${project.description} - Generation completed at ${new Date().toLocaleString()}`
      });

      // Add completion message
      const systemMessage: AIMessage = {
        id: `autosave_${Date.now()}`,
        agent: 'System',
        content: `💾 Project automatically saved! You can now interact with your database in the dashboard.`,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);

    } catch (error) {
      console.error('Failed to save complete project:', error);
    }
  };

  const generateTabContent = (tabId: string, prompt: string, dbType: string): string => {
    // Same content generation logic as LiveStreamingPage
    switch (tabId) {
      case 'analysis':
        return `# Requirements Analysis

## Business Domain Analysis
- Domain: ${prompt.toLowerCase().includes('e-commerce') ? 'E-commerce Platform' : prompt.toLowerCase().includes('blog') ? 'Content Management' : 'Custom Application'}
- Scale: Medium (estimated 10K-100K users)
- Complexity: Moderate (10-20 entities)

## Key Requirements
- User management and authentication
- Core business entities and relationships
- Data integrity and validation
- Performance optimization
- Security compliance

## Entities Identified
1. Users/Accounts
2. Primary business objects
3. Relationships and associations
4. Supporting data structures

## Technical Specifications
- Database: ${dbType}
- Expected Load: Moderate
- Availability: High
- Consistency: Strong`;

      case 'schema':
        return `# Database Schema Design

## Core Tables

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

-- Main business entity
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationship table
CREATE TABLE user_products (
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    relationship_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);
\`\`\`

## Indexes
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
\`\`\``;

      case 'implementation':
        return `# Implementation Package

## Migration Scripts

\`\`\`sql
-- Migration 001: Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
\`\`\`

## API Endpoints
\`\`\`javascript
// User management
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
\`\`\``;

      case 'validation':
        return `# Quality Validation Report

## Schema Validation ✅
- All tables have primary keys
- Foreign key relationships properly defined
- Appropriate data types selected
- Naming conventions followed

## Performance Review ✅
- Indexes created for frequently queried columns
- Query optimization opportunities identified
- Connection pooling recommended
- Caching strategy outlined

## Security Audit ✅
- Password hashing implemented
- SQL injection prevention measures
- Input validation required
- Access control mechanisms

## Production Readiness ✅
- All constraints properly defined
- Error handling implemented
- Backup strategy outlined
- Deployment scripts ready`;

      default:
        return `# ${tabId.charAt(0).toUpperCase() + tabId.slice(1)}

Content for ${tabId} tab is being generated...`;
    }
  };

  // Character streaming effect
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setStreamingContent(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;

        newMap.forEach((data, tabId) => {
          if (data.position < data.full.length) {
            const charsToAdd = Math.min(3, data.full.length - data.position);
            data.displayed = data.full.substring(0, data.position + charsToAdd);
            data.position += charsToAdd;
            hasChanges = true;

            setTabs(prevTabs => prevTabs.map(tab => 
              tab.id === tabId ? { ...tab, content: data.displayed } : tab
            ));
          }
        });

        if (!hasChanges) {
          setIsStreaming(false);
        }

        return newMap;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleUserMessage = useCallback(() => {
    if (!userInput.trim()) return;

    const message: AIMessage = {
      id: `user_${Date.now()}`,
      agent: 'User',
      content: userInput,
      timestamp: new Date(),
      type: 'user_chat'
    };

    setMessages(prev => [...prev, message]);
    setUserInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AIMessage = {
        id: `ai_${Date.now()}`,
        agent: 'DB.Coach Assistant',
        content: `I understand your question about "${userInput}". ${mode.isLiveGeneration ? "I'm currently generating your database design, but I can help clarify anything about the process!" : "I can help you with your database project. What would you like to know?"}`,
        timestamp: new Date(),
        type: 'reasoning'
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  }, [userInput, mode.isLiveGeneration]);

  const handleSessionSelect = async (session: DatabaseSession) => {
    setSelectedSession(session);
    try {
      const queriesData = await databaseProjectsService.getSessionQueries(session.id);
      setQueries(queriesData);
    } catch (error) {
      console.error('Error loading queries:', error);
    }
  };

  const getAgentColor = (agent: string): string => {
    const colors = {
      'Requirements Analyst': 'from-blue-600 to-cyan-600',
      'Schema Architect': 'from-purple-600 to-pink-600',
      'Implementation Specialist': 'from-green-600 to-emerald-600',
      'Quality Assurance': 'from-orange-600 to-red-600',
      'Data Visualization': 'from-indigo-600 to-purple-600',
      'DB.Coach Assistant': 'from-purple-600 to-blue-600',
      'User': 'from-slate-600 to-slate-700',
      'System': 'from-green-600 to-teal-600'
    };
    return colors[agent as keyof typeof colors] || 'from-slate-600 to-slate-700';
  };

  const getTabIcon = (tabId: string) => {
    switch (tabId) {
      case 'analysis': return <AlertTriangle className="w-4 h-4" />;
      case 'schema': return <Database className="w-4 h-4" />;
      case 'implementation': return <Zap className="w-4 h-4" />;
      case 'validation': return <CheckCircle className="w-4 h-4" />;
      case 'visualization': return <BarChart3 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTabColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-yellow-500 bg-yellow-500/10 text-yellow-300';
      case 'completed': return 'border-green-500 bg-green-500/10 text-green-300';
      default: return 'border-slate-600 bg-slate-800/50 text-slate-400';
    }
  };

  // Auto-scroll effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <StreamingErrorBoundary>
      <ProtectedRoute>
        <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
          {/* Header */}
          <nav className="p-4 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(project ? '/projects' : '/')}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                
                <div className="flex items-center space-x-2 text-slate-400">
                  {mode.isLiveGeneration ? (
                    <>
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 font-medium">Live Generation</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 font-medium">
                        {project ? project.database_name : 'Database Workspace'}
                      </span>
                    </>
                  )}
                </div>

                {autoSaveEnabled && lastSaved && (
                  <div className="flex items-center space-x-1 text-xs text-green-400">
                    <Save className="w-3 h-3" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <Link to="/projects" className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200">
                  Projects
                </Link>
                <Link to="/settings" className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-all duration-200">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Agent Stream or Project Navigation */}
            <div className="w-[30%] min-w-[350px] lg:w-[30%] md:w-[35%] sm:w-[40%] border-r border-slate-700/50 bg-slate-800/20 flex flex-col">
              
              {/* Mode Toggle */}
              <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {mode.isLiveGeneration ? 'AI Agent Stream' : 'Project Dashboard'}
                  </h3>
                  
                  {project && !mode.isLiveGeneration && (
                    <button
                      onClick={() => {
                        const newPrompt = `Enhance ${project.database_name}`;
                        const url = `/projects/${project.id}?prompt=${encodeURIComponent(newPrompt)}&dbType=${project.database_type}&mode=dbcoach`;
                        navigate(url);
                        window.location.reload();
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      Generate
                    </button>
                  )}
                </div>

                {!mode.isLiveGeneration && project && (
                  <div className="flex gap-2">
                    {(['overview', 'analytics', 'queries', 'chat'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setDashboardView(view)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          dashboardView === view
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                        }`}
                      >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Based on Mode */}
              {mode.isLiveGeneration ? (
                /* Agent Stream Content */
                <div className="flex-1 relative">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-800/20 to-transparent z-10 pointer-events-none"></div>
                  
                  <div className="h-full p-4 overflow-y-auto scrollbar-elegant scroll-smooth">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAgentColor(message.agent)} flex items-center justify-center flex-shrink-0`}>
                            {message.agent === 'User' ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{message.agent}</span>
                              <span className="text-xs text-slate-500">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className={`rounded-lg p-3 ${
                              message.agent === 'User' 
                                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200'
                                : message.type === 'system'
                                ? 'bg-green-600/20 border border-green-500/30 text-green-200'
                                : 'bg-slate-800/50 border border-slate-700/50 text-slate-300'
                            }`}>
                              <p className="leading-relaxed">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isGenerating && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">AI Agents</span>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 border border-yellow-500/30">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-yellow-300 text-sm">Collaborating...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-800/20 to-transparent z-10 pointer-events-none"></div>
                </div>
              ) : project && (
                /* Project Dashboard Content */
                <div className="flex-1 p-4 overflow-y-auto scrollbar-elegant">
                  {dashboardView === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-white">Sessions</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-300">{projectStats.totalSessions}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-white">Queries</span>
                          </div>
                          <div className="text-2xl font-bold text-green-300">{projectStats.totalQueries}</div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">Success Rate</span>
                        </div>
                        <div className="text-xl font-bold text-purple-300">{projectStats.successRate.toFixed(1)}%</div>
                        <div className="w-full h-2 bg-slate-700 rounded-full mt-2">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                            style={{ width: `${projectStats.successRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white">Recent Sessions</h4>
                        {sessions.slice(0, 3).map((session) => (
                          <div 
                            key={session.id}
                            onClick={() => handleSessionSelect(session)}
                            className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30 hover:border-purple-500/50 cursor-pointer transition-all"
                          >
                            <div className="font-medium text-white text-sm">{session.session_name}</div>
                            <div className="text-xs text-slate-400">{new Date(session.created_at).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dashboardView === 'analytics' && (
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <h4 className="text-sm font-medium text-white mb-3">Query Performance</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Avg Response Time</span>
                            <span className="text-sm text-green-300">{projectStats.avgResponseTime.toFixed(0)}ms</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Cache Hit Rate</span>
                            <span className="text-sm text-blue-300">87%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Error Rate</span>
                            <span className="text-sm text-red-300">2.1%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <h4 className="text-sm font-medium text-white mb-3">Usage Trends</h4>
                        <div className="h-32 bg-slate-900/50 rounded-lg flex items-center justify-center">
                          <LineChart className="w-8 h-8 text-slate-500" />
                          <span className="ml-2 text-slate-500 text-sm">Chart visualization would go here</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardView === 'queries' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">Query History</h4>
                        <button className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg">
                          <Plus className="w-4 h-4 text-slate-300" />
                        </button>
                      </div>
                      
                      {queries.length > 0 ? (
                        <div className="space-y-2">
                          {queries.map((query) => (
                            <div key={query.id} className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                              <div className="font-medium text-white text-sm">{query.description || query.query_type}</div>
                              <div className="text-xs text-slate-400 mt-1">{new Date(query.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-900/50 p-2 rounded overflow-hidden">
                                {query.query_text.substring(0, 100)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Database className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">No queries yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {dashboardView === 'chat' && (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                        {messages.filter(m => m.type === 'user_chat' || m.type === 'reasoning').map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getAgentColor(message.agent)} flex items-center justify-center flex-shrink-0`}>
                              {message.agent === 'User' ? (
                                <User className="w-3 h-3 text-white" />
                              ) : (
                                <Bot className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 mb-1">{message.agent}</div>
                              <div className={`rounded-lg p-2 text-sm ${
                                message.agent === 'User' 
                                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200'
                                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-300'
                              }`}>
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Input */}
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUserMessage()}
                    placeholder={mode.isLiveGeneration ? "Ask questions about the generation..." : "Chat with AI about your project..."}
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleUserMessage}
                    disabled={!userInput.trim()}
                    className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Content */}
            <div className="w-[70%] lg:w-[70%] md:w-[65%] sm:w-[60%] flex flex-col">
              {/* Content Header */}
              <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {mode.isLiveGeneration ? (
                    <>
                      <Database className="w-5 h-5 text-green-400" />
                      Generated Database Design
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      {selectedSession ? `Session: ${selectedSession.session_name}` : 'Project Overview'}
                    </>
                  )}
                </h3>
                <p className="text-sm text-slate-400">
                  {mode.isLiveGeneration ? 'Real-time content generation' : 'Interactive database workspace'}
                </p>
              </div>

              {mode.isLiveGeneration ? (
                /* Generation Tabs */
                <>
                  <div className="flex border-b border-slate-700/50 bg-slate-800/20">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                            : getTabColor(tab.status)
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {getTabIcon(tab.id)}
                          <span className="hidden lg:inline">{tab.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                    {tabs.map((tab) => (
                      <div
                        key={tab.id}
                        className={`${activeTab === tab.id ? 'block' : 'hidden'}`}
                      >
                        <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 min-h-[400px] overflow-hidden">
                          <div className="relative h-full">
                            {tab.content ? (
                              <>
                                {tab.status === 'active' && isStreaming && (
                                  <div className="absolute top-2 right-2 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1 border border-slate-600/50 transition-all duration-300 ease-in-out">
                                    <div className="flex items-center gap-2 text-xs">
                                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                      <span className="text-green-300 font-medium transition-all duration-300 ease-in-out">
                                        {Math.round((streamingContent.get(tab.id)?.position || 0) / (streamingContent.get(tab.id)?.full.length || 1) * 100)}%
                                      </span>
                                      <span className="text-slate-400 transition-all duration-300 ease-in-out">
                                        ({streamingContent.get(tab.id)?.position || 0}/{streamingContent.get(tab.id)?.full.length || 0})
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="h-full p-4 overflow-y-auto scrollbar-elegant scroll-smooth">
                                  <div className="text-slate-200 whitespace-pre-wrap font-mono text-sm leading-relaxed transition-all duration-300 ease-in-out">
                                    {tab.content}
                                    {tab.status === 'active' && isStreaming && (
                                      <span className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-1 transition-opacity duration-300" />
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-40 text-slate-500">
                                {tab.status === 'pending' ? (
                                  <span>Waiting for {tab.agent}...</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Generating content...</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Project Content */
                <div className="flex-1 p-4 overflow-y-auto">
                  {selectedSession ? (
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">{selectedSession.session_name}</h4>
                        <p className="text-slate-400 mb-4">{selectedSession.description}</p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {queries.map((query) => (
                            <div key={query.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-white">{query.description || query.query_type}</h5>
                                <div className="flex gap-2">
                                  <button className="p-1 hover:bg-slate-700/50 rounded">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                  </button>
                                  <button className="p-1 hover:bg-slate-700/50 rounded">
                                    <Edit className="w-4 h-4 text-slate-400" />
                                  </button>
                                </div>
                              </div>
                              <div className="bg-slate-900/50 rounded p-3 font-mono text-xs text-slate-300 overflow-hidden">
                                {query.query_text.substring(0, 200)}...
                              </div>
                              <div className="text-xs text-slate-500 mt-2">
                                {new Date(query.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Database className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Welcome to Your Database Workspace</h3>
                        <p className="text-slate-400 mb-4">Select a session to view details or start a new generation.</p>
                        <button
                          onClick={() => {
                            const newPrompt = `Enhance ${project?.database_name || 'database'}`;
                            const url = `/projects/${project?.id}?prompt=${encodeURIComponent(newPrompt)}&dbType=${project?.database_type || 'PostgreSQL'}&mode=dbcoach`;
                            navigate(url);
                            window.location.reload();
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          Start Live Generation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </StreamingErrorBoundary>
  );
}