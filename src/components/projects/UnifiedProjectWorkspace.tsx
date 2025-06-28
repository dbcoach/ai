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
import { enhancedDBCoachService, GenerationStep, GenerationProgress } from '../../services/enhancedDBCoachService';

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
    { id: 'design', title: 'Schema Design', status: 'pending', content: '', agent: 'Schema Architect' },
    { id: 'implementation', title: 'Implementation', status: 'pending', content: '', agent: 'Implementation Specialist' },
    { id: 'validation', title: 'Quality Validation', status: 'pending', content: '', agent: 'Quality Assurance' },
    { id: 'visualization', title: 'Data Visualization', status: 'pending', content: '', agent: 'Data Visualization' }
  ]);
  
  // Real AI generation state
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState<GenerationProgress | null>(null);
  
  // Dashboard state
  const [dashboardView, setDashboardView] = useState<'overview' | 'analytics' | 'queries' | 'chat'>('overview');
  const [projectStats, setProjectStats] = useState({
    totalSessions: 0,
    totalQueries: 0,
    successRate: 0,
    avgResponseTime: 0
  });
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Scroll management state
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isDashboardChatAutoScrollEnabled, setIsDashboardChatAutoScrollEnabled] = useState(true);
  
  // Refs for scroll management
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const dashboardChatContainerRef = useRef<HTMLDivElement>(null);
  const dashboardChatEndRef = useRef<HTMLDivElement>(null);

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

    try {
      // Start actual generation using context
      await startGeneration(prompt, dbType, generationMode as any);

      // Start real AI generation using enhancedDBCoachService
      const steps = await enhancedDBCoachService.generateDatabaseDesign(
        prompt,
        dbType,
        (progress: GenerationProgress) => {
          setCurrentProgress(progress);
          
          // Update tab status based on progress
          setTabs(prev => prev.map(tab => {
            if (tab.id === progress.step || (progress.step === 'design' && tab.id === 'design')) {
              return { ...tab, status: progress.isComplete ? 'completed' : 'active' };
            }
            return tab;
          }));

          // Set active tab to current step
          if (progress.step === 'design') {
            setActiveTab('design');
          } else {
            setActiveTab(progress.step);
          }

          // Add AI reasoning message
          const reasoningMessage: AIMessage = {
            id: `${progress.agent}_${Date.now()}_${Math.random()}`,
            agent: progress.agent,
            content: progress.reasoning,
            timestamp: new Date(),
            type: 'reasoning'
          };
          setMessages(prev => [...prev, reasoningMessage]);
        }
      );

      // Store the generated steps
      setGenerationSteps(steps);

      // Update tabs with actual content from AI generation
      setTabs(prev => prev.map(tab => {
        const correspondingStep = steps.find(step => 
          step.type === tab.id || (step.type === 'design' && tab.id === 'design')
        );
        if (correspondingStep) {
          return {
            ...tab,
            content: correspondingStep.content,
            status: 'completed'
          };
        }
        return tab;
      }));

      // Generate visualization content (this can be enhanced later)
      const visualizationTab = tabs.find(tab => tab.id === 'visualization');
      if (visualizationTab) {
        setTabs(prev => prev.map(tab => 
          tab.id === 'visualization' 
            ? { ...tab, content: generateVisualizationContent(steps), status: 'completed' }
            : tab
        ));
      }

      // Auto-save if enabled
      if (autoSaveEnabled) {
        await autoSaveCompleteProject();
      }

      // Final completion message
      const completionMessage: AIMessage = {
        id: `completion_${Date.now()}`,
        agent: 'DB.Coach',
        content: '✅ Database design complete! All components generated successfully with real AI analysis.',
        timestamp: new Date(),
        type: 'result'
      };
      setMessages(prev => [...prev, completionMessage]);

      // Transition mode to show completed generation results
      setMode(prev => ({ 
        ...prev, 
        isLiveGeneration: false,
        type: project ? 'hybrid' : 'generation'
      }));

      // Add helpful completion message
      setTimeout(() => {
        const viewResultsMessage: AIMessage = {
          id: `view_results_${Date.now()}`,
          agent: 'System',
          content: '🎉 Real AI generation complete! Your database design is now available in the results panel with comprehensive analysis, schema design, implementation, and quality validation.',
          timestamp: new Date(),
          type: 'system'
        };
        setMessages(prev => [...prev, viewResultsMessage]);
      }, 1000);

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

  // Helper function to generate visualization content
  const generateVisualizationContent = (steps: GenerationStep[]): string => {
    const analysisStep = steps.find(step => step.type === 'analysis');
    const designStep = steps.find(step => step.type === 'design');
    
    if (!analysisStep || !designStep) {
      return 'Visualization data not available';
    }

    return `# Database Visualization & Diagrams

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    %% Auto-generated based on schema design
    %% This would be enhanced with actual schema parsing
    
    USER {
        int id PK
        string email
        string name
        datetime created_at
    }
    
    %% Additional entities would be parsed from design step
    %% and rendered as interactive diagrams
\`\`\`

## Schema Statistics
- **Complexity Level**: ${JSON.parse(analysisStep.content)?.complexity || 'Medium'}
- **Estimated Tables**: 5-15 (based on requirements)
- **Relationship Density**: Medium
- **Recommended Indexes**: Auto-detected from schema

## Interactive Features
- Zoom and pan controls
- Table relationship highlighting
- Field type indicators
- Performance impact visualization

*Note: Enhanced visualization with interactive ER diagrams and schema metrics will be implemented in the next iteration.*`;
  };

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
    // Enable auto-scroll when user sends a message
    setIsAutoScrollEnabled(true);

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

  // Scroll helper function to programmatically scroll to bottom
  const scrollToBottom = () => {
    setIsAutoScrollEnabled(true);
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dashboard chat scroll function
  const scrollDashboardChatToBottom = () => {
    setIsDashboardChatAutoScrollEnabled(true);
    if (dashboardChatEndRef.current) {
      dashboardChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Auto-scroll effects with intelligent scroll management
  useEffect(() => {
    if (messagesEndRef.current && isAutoScrollEnabled) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAutoScrollEnabled]);

  // Auto-scroll for dashboard chat
  useEffect(() => {
    if (dashboardView === 'chat' && dashboardChatEndRef.current && isDashboardChatAutoScrollEnabled) {
      dashboardChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isDashboardChatAutoScrollEnabled, dashboardView]);

  // Track scroll events for intelligent auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // User is scrolling up (disable auto-scroll)
      if (scrollTop < lastScrollTop) {
        setIsUserScrolling(true);
        setIsAutoScrollEnabled(false);
      }
      
      // User has scrolled near bottom (re-enable auto-scroll)
      if (scrollHeight - scrollTop - clientHeight < 10) {
        setIsAutoScrollEnabled(true);
        setIsUserScrolling(false);
      }
      
      setLastScrollTop(scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);

  useEffect(() => {
    if (chatEndRef.current && isAutoScrollEnabled) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAutoScrollEnabled]);

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
            <div className="w-[30%] min-w-[350px] max-w-[500px] lg:w-[30%] md:w-[35%] sm:w-[40%] border-r border-slate-700/50 bg-slate-800/20 flex flex-col"
                 style={{ height: 'calc(100vh - 80px)' }}>
              
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
                /* Agent Stream Content - Fixed Height Chat Container */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 relative bg-slate-900/20 rounded-lg m-2 border border-slate-700/30 min-h-0">
                    {/* Chat Header */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-slate-700/50 p-2 z-20 rounded-t-lg">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <MessageSquare className="w-3 h-3 text-purple-400" />
                        <span>Live Chat Stream</span>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse ml-auto" />
                      </div>
                    </div>
                    
                    {/* Fade overlay at top */}
                    <div className="absolute top-8 left-0 right-0 h-4 bg-gradient-to-b from-slate-900/50 to-transparent z-10 pointer-events-none"></div>
                    
                    {/* Scrollable content with constrained height */}
                    <div 
                      ref={messagesContainerRef}
                      className="absolute inset-0 pt-12 pb-2 overflow-y-auto scrollbar-elegant scroll-smooth"
                      onScroll={() => {
                        if (!messagesContainerRef.current) return;
                        
                        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
                        // Check if scrolled to bottom
                        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
                        
                        if (isAtBottom && !isAutoScrollEnabled) {
                          setIsAutoScrollEnabled(true);
                        }
                      }}
                    >
                    <div className="px-4 space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-1 duration-300">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAgentColor(message.agent)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
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
                            <div className={`rounded-lg p-3 transition-all duration-200 hover:scale-[1.01] ${
                              message.agent === 'User' 
                                ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200 shadow-purple-500/10'
                                : message.type === 'system'
                                ? 'bg-green-600/20 border border-green-500/30 text-green-200 shadow-green-500/10'
                                : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 shadow-slate-800/10'
                            } shadow-lg`}>
                              <p className="leading-relaxed">{message.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isGenerating && (
                        <div className="flex items-start gap-3 animate-in slide-in-from-bottom-1 duration-300">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center shadow-lg">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">AI Agents</span>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 border border-yellow-500/30 shadow-lg">
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
                    
                    {/* Fade overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-900/50 to-transparent z-10 pointer-events-none rounded-b-lg"></div>
                    
                    {/* Scroll indicator when not at bottom */}
                    {!isAutoScrollEnabled && (
                      <button
                        className="absolute bottom-4 right-4 z-20 p-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-full shadow-lg animate-bounce transition-all duration-200"
                        onClick={scrollToBottom}
                        aria-label="Scroll to bottom"
                      >
                        <ArrowLeft className="w-4 h-4 transform rotate-90" />
                      </button>
                    )}
                  </div>
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
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
                        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-purple-400" />
                          AI Assistant Chat
                        </h4>
                        
                        {/* Chat messages container with elegant scroll */}
                        <div className="relative">
                          {/* Fade overlay at top */}
                          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-slate-900/30 to-transparent z-10 pointer-events-none rounded-t-lg"></div>
                          
                          {/* Scrollable chat container */}
                          <div 
                            ref={dashboardChatContainerRef}
                            className="h-64 overflow-y-auto scrollbar-elegant scroll-smooth bg-slate-900/30 rounded-lg p-3 mb-4"
                            onScroll={() => {
                              if (!dashboardChatContainerRef.current) return;
                              
                              const { scrollTop, scrollHeight, clientHeight } = dashboardChatContainerRef.current;
                              // Check if scrolled to bottom
                              const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
                              
                              if (isAtBottom && !isDashboardChatAutoScrollEnabled) {
                                setIsDashboardChatAutoScrollEnabled(true);
                              } else if (!isAtBottom && isDashboardChatAutoScrollEnabled) {
                                setIsDashboardChatAutoScrollEnabled(false);
                              }
                            }}
                          >
                            <div className="space-y-3">
                              {messages.filter(m => m.type === 'user_chat' || m.type === 'reasoning').map((message) => (
                                <div key={message.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-1 duration-300">
                                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getAgentColor(message.agent)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                    {message.agent === 'User' ? (
                                      <User className="w-3 h-3 text-white" />
                                    ) : (
                                      <Bot className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-slate-500 font-medium">{message.agent}</span>
                                      <span className="text-xs text-slate-600">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <div className={`rounded-lg p-3 text-sm transition-all duration-200 hover:scale-[1.01] ${
                                      message.agent === 'User' 
                                        ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200 shadow-purple-500/10'
                                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 shadow-slate-800/10'
                                    } shadow-lg`}>
                                      <p className="leading-relaxed">{message.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {messages.filter(m => m.type === 'user_chat' || m.type === 'reasoning').length === 0 && (
                                <div className="text-center py-12">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                                    <MessageSquare className="w-8 h-8 text-purple-400" />
                                  </div>
                                  <p className="text-slate-400 text-sm font-medium mb-2">No conversations yet</p>
                                  <p className="text-slate-500 text-xs">Start chatting with the AI assistant below</p>
                                </div>
                              )}
                              
                              <div ref={dashboardChatEndRef} />
                            </div>
                          </div>
                          
                          {/* Fade overlay at bottom */}
                          <div className="absolute bottom-4 left-0 right-0 h-3 bg-gradient-to-t from-slate-900/30 to-transparent z-10 pointer-events-none rounded-b-lg"></div>
                          
                          {/* Elegant scroll indicator */}
                          {!isDashboardChatAutoScrollEnabled && messages.filter(m => m.type === 'user_chat' || m.type === 'reasoning').length > 0 && (
                            <button
                              className="absolute bottom-6 right-6 z-20 p-2 bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-600 hover:to-blue-600 text-white rounded-full shadow-lg backdrop-blur-sm border border-purple-500/30 animate-bounce transition-all duration-200 hover:scale-110"
                              onClick={scrollDashboardChatToBottom}
                              aria-label="Scroll to bottom"
                            >
                              <ArrowLeft className="w-3 h-3 transform rotate-90" />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/30 rounded-lg p-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          <span>AI assistant ready • Ask questions about your database project</span>
                        </div>
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
            <div className="w-[70%] lg:w-[70%] md:w-[65%] sm:w-[60%] flex flex-col"
                 style={{ height: 'calc(100vh - 80px)' }}>
              {/* Results Canvas Header */}
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-green-600/10 to-blue-600/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {mode.isLiveGeneration || (tabs.some(tab => tab.content)) ? (
                    <>
                      <Database className="w-5 h-5 text-green-400" />
                      Generated Database Design
                      {!isStreaming && !mode.isLiveGeneration && tabs.some(tab => tab.content) && (
                        <span className="ml-2 px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded-full border border-green-500/30">
                          Complete
                        </span>
                      )}
                      {mode.isLiveGeneration && (
                        <div className="ml-auto flex items-center gap-2 text-xs text-slate-300">
                          <span>Results Canvas</span>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      {selectedSession ? `Session: ${selectedSession.session_name}` : 'Project Overview'}
                    </>
                  )}
                </h3>
                <p className="text-sm text-slate-400">
                  {mode.isLiveGeneration ? 'Real-time content generation and streaming results' : 
                   tabs.some(tab => tab.content) ? 'Generated database design ready for review' : 
                   'Interactive database workspace with independent scroll'}
                </p>
              </div>

              {mode.isLiveGeneration || (tabs.some(tab => tab.content)) ? (
                /* Generation Tabs - Show if live generation OR if any tab has content */
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

                  {/* Results Canvas - Independent Scroll Container */}
                  <div className="flex-1 overflow-hidden bg-slate-900/10 m-2 rounded-lg border border-slate-700/30">
                    <div className="h-full overflow-y-auto scrollbar-elegant scroll-smooth">
                      {tabs.map((tab) => (
                        <div
                          key={tab.id}
                          className={`${activeTab === tab.id ? 'block' : 'hidden'} h-full`}
                        >
                          <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 h-full min-h-[calc(100vh-200px)] overflow-hidden m-2">
                            <div className="relative h-full">
                              {tab.content ? (
                                <>
                                  {tab.status === 'active' && isStreaming && (
                                    <div className="absolute top-3 right-3 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-600/50 transition-all duration-300 ease-in-out shadow-lg">
                                      <div className="flex items-center gap-2 text-xs">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-green-300 font-medium transition-all duration-300 ease-in-out">
                                          Generating...
                                        </span>
                                        <span className="text-slate-400 transition-all duration-300 ease-in-out">
                                          AI Processing
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Generation Complete Badge */}
                                  {!isStreaming && !mode.isLiveGeneration && tab.content && (
                                    <div className="absolute top-3 right-3 z-10 bg-green-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-green-600/50 transition-all duration-300 ease-in-out shadow-lg">
                                      <div className="flex items-center gap-2 text-xs">
                                        <CheckCircle className="w-3 h-3 text-green-400" />
                                        <span className="text-green-300 font-medium">Complete</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Content Type Indicator */}
                                  <div className="absolute top-3 left-3 z-10 bg-blue-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-blue-600/50 shadow-lg">
                                    <div className="flex items-center gap-2 text-xs">
                                      {getTabIcon(tab.id)}
                                      <span className="text-blue-300 font-medium">{tab.title}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Scrollable Content Area */}
                                  <div className="h-full overflow-y-auto scrollbar-elegant scroll-smooth">
                                    <div className="p-6 pt-14">
                                      <div className="text-slate-200 whitespace-pre-wrap font-mono text-sm leading-relaxed transition-all duration-300 ease-in-out">
                                        {tab.content}
                                        {tab.status === 'active' && isStreaming && (
                                          <span className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-1 transition-opacity duration-300" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                  <div className="text-center">
                                    {tab.status === 'pending' ? (
                                      <>
                                        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                        <span>Waiting for {tab.agent}...</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                        </div>
                                        <span>Generating {tab.title.toLowerCase()}...</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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