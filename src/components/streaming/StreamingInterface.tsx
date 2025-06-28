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
  Loader2
} from 'lucide-react';
import { streamingService, StreamingTask, StreamChunk } from '../../services/streamingService';

interface StreamingInterfaceProps {
  prompt: string;
  dbType: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function StreamingInterface({ 
  prompt, 
  dbType, 
  onComplete, 
  onError, 
  className = '' 
}: StreamingInterfaceProps) {
  const [tasks, setTasks] = useState<StreamingTask[]>([]);
  const [activeTask, setActiveTask] = useState<StreamingTask | null>(null);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [streamingSpeed, setStreamingSpeed] = useState(40);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [taskContent, setTaskContent] = useState<Map<string, string>>(new Map());
  const [insights, setInsights] = useState<Array<{ agent: string; message: string; timestamp: Date }>>([]);
  
  const contentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const cursorRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Initialize streaming session
  useEffect(() => {
    const sessionId = `session_${Date.now()}`;
    const predefinedTasks = [
      {
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

    streamingService.initializeSession(sessionId, predefinedTasks);
    
    return () => {
      streamingService.destroy();
    };
  }, []);

  // Event listeners for streaming service
  useEffect(() => {
    const handleSessionInitialized = (data: { tasks: StreamingTask[] }) => {
      setTasks(data.tasks);
    };

    const handleTaskStarted = (data: { taskId: string; task: StreamingTask }) => {
      setActiveTask(data.task);
      setTasks(prev => prev.map(task => 
        task.id === data.taskId ? data.task : task
      ));
      
      // Add insight message
      setInsights(prev => [...prev, {
        agent: data.task.agent,
        message: `Starting ${data.task.title.toLowerCase()}...`,
        timestamp: new Date()
      }]);
    };

    const handleTaskProgress = (data: { taskId: string; progress: number; reasoning?: string }) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId 
          ? { ...task, progress: data.progress }
          : task
      ));
      
      if (data.reasoning) {
        const task = tasks.find(t => t.id === data.taskId);
        if (task) {
          setInsights(prev => [...prev, {
            agent: task.agent,
            message: data.reasoning!,
            timestamp: new Date()
          }]);
        }
      }
    };

    const handleCharacterStreamed = (data: { taskId: string; character: string; rendered: string }) => {
      setTaskContent(prev => {
        const newMap = new Map(prev);
        newMap.set(data.taskId, data.rendered);
        return newMap;
      });
      
      // Update cursor position
      const cursorRef = cursorRefs.current.get(data.taskId);
      if (cursorRef) {
        cursorRef.style.display = 'inline';
      }
    };

    const handleTaskCompleted = (data: { taskId: string; task: StreamingTask }) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId ? data.task : task
      ));
      
      // Hide cursor for completed task
      const cursorRef = cursorRefs.current.get(data.taskId);
      if (cursorRef) {
        cursorRef.style.display = 'none';
      }
      
      setInsights(prev => [...prev, {
        agent: data.task.agent,
        message: `${data.task.title} completed successfully!`,
        timestamp: new Date()
      }]);
    };

    const handleSessionCompleted = () => {
      setActiveTask(null);
      setTotalProgress(100);
      setIsPlaying(false);
      
      setInsights(prev => [...prev, {
        agent: 'DB.Coach',
        message: '✅ Database design complete! All components generated successfully.',
        timestamp: new Date()
      }]);

      onComplete?.(Array.from(taskContent.entries()));
    };

    const handleStreamingPaused = () => {
      setIsPlaying(false);
    };

    const handleStreamingResumed = () => {
      setIsPlaying(true);
    };

    // Subscribe to events
    streamingService.on('session_initialized', handleSessionInitialized);
    streamingService.on('task_started', handleTaskStarted);
    streamingService.on('task_progress', handleTaskProgress);
    streamingService.on('character_streamed', handleCharacterStreamed);
    streamingService.on('task_completed', handleTaskCompleted);
    streamingService.on('session_completed', handleSessionCompleted);
    streamingService.on('streaming_paused', handleStreamingPaused);
    streamingService.on('streaming_resumed', handleStreamingResumed);

    return () => {
      streamingService.removeAllListeners();
    };
  }, [tasks, taskContent, onComplete]);

  // Update progress and time estimates
  useEffect(() => {
    const interval = setInterval(() => {
      const status = streamingService.getSessionStatus();
      setTotalProgress(status.totalProgress);
      setEstimatedTimeRemaining(status.estimatedTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      streamingService.pauseStreaming();
    } else {
      streamingService.resumeStreaming();
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    streamingService.pauseStreaming();
    onComplete?.(Array.from(taskContent.entries()));
  }, [taskContent, onComplete]);

  const handleSpeedChange = useCallback((speed: number) => {
    setStreamingSpeed(speed);
    streamingService.setStreamingSpeed(speed);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          <div className="text-sm text-slate-400">
            ETA: {formatTime(estimatedTimeRemaining)}
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
        {/* Task Sidebar */}
        <div className="w-80 border-r border-slate-700/50 bg-slate-800/20 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Agent Tasks</h3>
          
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div 
                key={task.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  task.status === 'active' 
                    ? 'bg-slate-700/50 border-yellow-500/50' 
                    : task.status === 'completed'
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-slate-800/30 border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(task.status)}
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getAgentColor(task.agent)} flex items-center justify-center`}>
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-slate-400">{task.agent}</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                
                {/* Subtasks */}
                {task.status === 'active' && (
                  <div className="space-y-1 mt-3">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          subtask.status === 'completed' ? 'bg-green-400' :
                          subtask.status === 'active' ? 'bg-yellow-400 animate-pulse' :
                          'bg-slate-600'
                        }`} />
                        <span className={`${
                          subtask.status === 'completed' ? 'text-green-300' :
                          subtask.status === 'active' ? 'text-yellow-300' :
                          'text-slate-400'
                        }`}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Live Content Stream */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {tasks.map((task) => {
                const content = taskContent.get(task.id) || '';
                
                return (
                  <div key={task.id} className={`transition-opacity duration-300 ${
                    task.status === 'pending' ? 'opacity-40' : 'opacity-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAgentColor(task.agent)} flex items-center justify-center`}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{task.title}</h3>
                        <span className="text-sm text-slate-400">{task.agent}</span>
                      </div>
                      {task.status === 'active' && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />}
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
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
                            className="inline-block w-2 h-5 bg-purple-400 animate-pulse ml-1"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="border-t border-slate-700/50 bg-slate-800/30 p-4 max-h-48 overflow-y-auto">
            <h4 className="text-sm font-medium text-slate-300 mb-3">AI Agent Insights</h4>
            <div className="space-y-2">
              {insights.slice(-5).map((insight, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-300">{insight.agent}</span>
                      <span className="text-xs text-slate-500">
                        {insight.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="border-t border-slate-700/50 bg-slate-800/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center w-10 h-10 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                >
                  <Square className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => onComplete?.(Array.from(taskContent.entries()))}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Draft
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
  );
}