import React from 'react';
import { UserResult } from '../../services/resultsService';
import { 
  DocumentTextIcon,
  TableCellsIcon,
  CodeBracketIcon,
  StarIcon,
  EyeIcon,
  CalendarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface ResultsListProps {
  results: UserResult[];
  loading: boolean;
  onResultSelect: (result: UserResult) => void;
  onResultUpdated: () => void;
}

export function ResultsList({ results, loading, onResultSelect, onResultUpdated }: ResultsListProps) {
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <CodeBracketIcon className="h-5 w-5 text-blue-400" />;
      case 'csv':
        return <DocumentTextIcon className="h-5 w-5 text-green-400" />;
      case 'table':
        return <TableCellsIcon className="h-5 w-5 text-purple-400" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                <div className="h-3 bg-slate-700 rounded w-1/4"></div>
              </div>
              <div className="h-8 w-8 bg-slate-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50">
        <ArchiveBoxIcon className="h-16 w-16 text-slate-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No results found</h3>
        <p className="text-slate-500">
          Start by saving your first query result or adjust your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <div
          key={result.id}
          className="p-6 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 shadow-xl hover:bg-slate-800/40 transition-all cursor-pointer group"
          onClick={() => onResultSelect(result)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title and favorite */}
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                  {result.title}
                </h3>
                {result.is_favorite ? (
                  <StarSolidIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                ) : (
                  <StarIcon className="h-5 w-5 text-slate-500 flex-shrink-0" />
                )}
              </div>

              {/* Description */}
              {result.description && (
                <p className="text-slate-400 mb-3 line-clamp-2">
                  {result.description}
                </p>
              )}

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  {getFormatIcon(result.result_format)}
                  <span className="uppercase font-medium">
                    {result.result_format}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(result.created_at)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <ArchiveBoxIcon className="h-4 w-4" />
                  <span>{formatBytes(result.data_size_bytes)}</span>
                </div>

                {result.storage_type === 'object_storage' && (
                  <span className="px-2 py-1 rounded-full bg-blue-600/20 text-blue-300 text-xs font-medium">
                    Cloud Storage
                  </span>
                )}
              </div>

              {/* Original query preview */}
              {result.original_query && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Original Query:</p>
                  <code className="text-sm text-slate-300 font-mono line-clamp-2">
                    {result.original_query}
                  </code>
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="ml-4 flex-shrink-0">
              <button className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}