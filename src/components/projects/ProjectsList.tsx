import React from 'react';
import { DatabaseProject } from '../../services/databaseProjectsService';
import { 
  Database,
  Calendar,
  Clock,
  FolderOpen,
  MousePointer
} from 'lucide-react';

interface ProjectsListProps {
  projects: DatabaseProject[];
  loading: boolean;
  onProjectSelect: (project: DatabaseProject) => void;
  searchTerm: string;
}

export function ProjectsList({ projects, loading, onProjectSelect, searchTerm }: ProjectsListProps) {
  const getDbTypeIcon = (type: string) => {
    return <Database className="h-5 w-5 text-blue-400" />;
  };

  const getDbTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'PostgreSQL': 'bg-blue-600/20 text-blue-300',
      'MySQL': 'bg-orange-600/20 text-orange-300',
      'MongoDB': 'bg-green-600/20 text-green-300',
      'SQLite': 'bg-gray-600/20 text-gray-300',
      'SQL': 'bg-purple-600/20 text-purple-300',
      'NoSQL': 'bg-red-600/20 text-red-300',
    };
    return colors[type] || 'bg-slate-600/20 text-slate-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 animate-pulse"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-5 bg-slate-700 rounded"></div>
                <div className="h-4 w-16 bg-slate-700 rounded-full"></div>
              </div>
              <div className="h-6 bg-slate-700 rounded w-2/3"></div>
              <div className="h-4 bg-slate-700 rounded w-full"></div>
              <div className="h-4 bg-slate-700 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50">
        {searchTerm ? (
          <>
            <FolderOpen className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No projects found</h3>
            <p className="text-slate-500">
              Try adjusting your search terms or create a new project.
            </p>
          </>
        ) : (
          <>
            <Database className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No projects yet</h3>
            <p className="text-slate-500 mb-6">
              Create your first database project to get started with organizing your work.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
              <MousePointer className="h-4 w-4" />
              <span>Click "New Project" to begin</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onProjectSelect(project)}
          className="group p-6 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 shadow-xl hover:bg-slate-800/40 hover:border-slate-600/50 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getDbTypeIcon(project.database_type)}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDbTypeColor(project.database_type)}`}>
                {project.database_type}
              </span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MousePointer className="h-4 w-4 text-slate-500" />
            </div>
          </div>

          {/* Project Name */}
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
            {project.database_name}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>{formatDate(project.last_accessed)}</span>
            </div>
          </div>

          {/* Hover indicator */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-2 text-xs text-purple-400">
              <span>Click to view sessions and history</span>
              <MousePointer className="h-3 w-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}