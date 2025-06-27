import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resultsService, UserResult } from '../../services/resultsService';
import { 
  X, 
  Star, 
  Edit,
  Trash2,
  Download,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface ResultDetailsModalProps {
  result: UserResult;
  onClose: () => void;
  onResultUpdated: () => void;
  onResultDeleted: () => void;
}

export function ResultDetailsModal({ 
  result, 
  onClose, 
  onResultUpdated, 
  onResultDeleted 
}: ResultDetailsModalProps) {
  const { user } = useAuth();
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: result.title,
    description: result.description || '',
    is_favorite: result.is_favorite
  });
  const [showRawData, setShowRawData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResultData();
  }, []);

  const loadResultData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await resultsService.getResultData(user.id, result.id);
      setResultData(data);
    } catch (error) {
      console.error('Error loading result data:', error);
      setError('Failed to load result data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await resultsService.updateResult(user.id, result.id, editForm);
      setEditing(false);
      onResultUpdated();
    } catch (error) {
      console.error('Error updating result:', error);
      setError('Failed to update result');
    }
  };

  const handleDelete = async () => {
    if (!user || !confirm('Are you sure you want to delete this result?')) return;

    try {
      await resultsService.deleteResult(user.id, result.id);
      onResultDeleted();
    } catch (error) {
      console.error('Error deleting result:', error);
      setError('Failed to delete result');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return;

    try {
      await resultsService.updateResult(user.id, result.id, {
        is_favorite: !result.is_favorite
      });
      onResultUpdated();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await resultsService.exportResults(user!.id, [result.id]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting result:', error);
    }
  };

  const handleCopyData = async () => {
    try {
      const text = typeof resultData === 'string' ? resultData : JSON.stringify(resultData, null, 2);
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Error copying data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderData = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-400 p-4 rounded-lg bg-red-900/20 border border-red-700">
          {error}
        </div>
      );
    }

    if (!resultData) {
      return (
        <div className="text-slate-400 text-center py-8">
          No data available
        </div>
      );
    }

    if (result.result_format === 'json') {
      if (showRawData) {
        return (
          <pre className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-auto max-h-96 font-mono">
            {JSON.stringify(resultData, null, 2)}
          </pre>
        );
      } else {
        // Try to render a formatted table view for JSON arrays
        if (Array.isArray(resultData) && resultData.length > 0 && typeof resultData[0] === 'object') {
          const keys = Object.keys(resultData[0]);
          return (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {keys.map(key => (
                      <th key={key} className="text-left py-2 px-3 text-slate-300 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultData.slice(0, 50).map((row: any, index: number) => (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                      {keys.map(key => (
                        <td key={key} className="py-2 px-3 text-slate-400">
                          {typeof row[key] === 'object' 
                            ? JSON.stringify(row[key]) 
                            : String(row[key] || '')
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {resultData.length > 50 && (
                <p className="text-slate-500 text-center py-3">
                  Showing first 50 of {resultData.length} rows
                </p>
              )}
            </div>
          );
        } else {
          return (
            <pre className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-auto max-h-96 font-mono">
              {JSON.stringify(resultData, null, 2)}
            </pre>
          );
        }
      }
    } else {
      return (
        <pre className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-auto max-h-96 font-mono whitespace-pre-wrap">
          {resultData}
        </pre>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-800 shadow-xl rounded-2xl border border-slate-700">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              {editing ? (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="text-2xl font-bold bg-transparent text-white border-b border-slate-600 focus:border-purple-500 outline-none w-full"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description..."
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                  />
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_favorite}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_favorite: e.target.checked }))}
                        className="text-yellow-600 focus:ring-yellow-500 rounded"
                      />
                      <span className="text-sm text-slate-300">Favorite</span>
                    </label>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-white truncate">
                      {result.title}
                    </h2>
                    <button
                      onClick={handleToggleFavorite}
                      className="flex-shrink-0 p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Star className={`h-6 w-6 ${result.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`} />
                    </button>
                  </div>
                  {result.description && (
                    <p className="text-slate-400 mb-4">{result.description}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {!editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Export"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-900/30 rounded-xl">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Format</p>
              <p className="text-sm font-medium text-slate-300 uppercase">{result.result_format}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Size</p>
              <p className="text-sm font-medium text-slate-300">{formatBytes(result.data_size_bytes)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Created</p>
              <p className="text-sm font-medium text-slate-300">{formatDate(result.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Storage</p>
              <p className="text-sm font-medium text-slate-300">
                {result.storage_type === 'object_storage' ? 'Cloud' : 'Inline'}
              </p>
            </div>
          </div>

          {/* Original Query */}
          {result.original_query && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Original Query</h3>
              <pre className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-lg overflow-auto font-mono">
                {result.original_query}
              </pre>
            </div>
          )}

          {/* Result Data */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Result Data</h3>
              <div className="flex items-center space-x-2">
                {result.result_format === 'json' && (
                  <button
                    onClick={() => setShowRawData(!showRawData)}
                    className="flex items-center space-x-2 px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm transition-colors"
                  >
                    {showRawData ? (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Table View</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Raw JSON</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleCopyData}
                  className="flex items-center space-x-2 px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
            <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/50">
              {renderData()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}