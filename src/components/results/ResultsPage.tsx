import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resultsService, UserResult, SearchResultsParams } from '../../services/resultsService';
import { ResultsList } from './ResultsList';
import { ResultsSearch } from './ResultsSearch';
import { CreateResultModal } from './CreateResultModal';
import { ResultDetailsModal } from './ResultDetailsModal';
import { CategoryTagManager } from './CategoryTagManager';
import ProtectedRoute from '../auth/ProtectedRoute';
import { 
  PlusIcon, 
  FolderIcon, 
  TagIcon,
  DocumentArrowDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export function ResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchResultsParams>({});
  const [selectedResult, setSelectedResult] = useState<UserResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCategoryTagModal, setShowCategoryTagModal] = useState(false);
  const [storageStats, setStorageStats] = useState({ totalBytes: 0, totalResults: 0 });

  useEffect(() => {
    if (user) {
      loadResults();
      loadStorageStats();
    }
  }, [user, searchParams]);

  const loadResults = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await resultsService.getResults(user.id, searchParams);
      setResults(data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    if (!user) return;
    
    try {
      const stats = await resultsService.getStorageUsage(user.id);
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const handleResultCreated = () => {
    setShowCreateModal(false);
    loadResults();
    loadStorageStats();
  };

  const handleResultUpdated = () => {
    setShowDetailsModal(false);
    loadResults();
  };

  const handleResultDeleted = () => {
    setShowDetailsModal(false);
    loadResults();
    loadStorageStats();
  };

  const handleResultSelect = (result: UserResult) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  const handleSearch = (params: SearchResultsParams) => {
    setSearchParams(params);
  };

  const handleExportAll = async () => {
    if (!user) return;
    
    try {
      const blob = await resultsService.exportResults(user.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting results:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/30 to-slate-900/20 pointer-events-none" />
        
        <div className="relative z-10 container max-w-7xl mx-auto py-10 px-4 md:px-8">
          {/* Header */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Query Results
                </h1>
                <p className="text-slate-300 mt-2">
                  Manage and organize your saved database query results
                </p>
              </div>
              
              {/* Storage Stats */}
              <div className="mt-4 md:mt-0 flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>{storageStats.totalResults} results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>{formatBytes(storageStats.totalBytes)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mb-6 p-4 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Save Result</span>
                </button>
                
                <button
                  onClick={() => setShowCategoryTagModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/50"
                >
                  <FolderIcon className="h-4 w-4" />
                  <span>Categories</span>
                </button>
                
                <button
                  onClick={() => setShowCategoryTagModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors border border-slate-600/50"
                >
                  <TagIcon className="h-4 w-4" />
                  <span>Tags</span>
                </button>
              </div>
              
              <button
                onClick={handleExportAll}
                disabled={results.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600/80 hover:bg-green-600 disabled:bg-slate-700/50 disabled:text-slate-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Export All</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <ResultsSearch onSearch={handleSearch} />
          </div>

          {/* Results List */}
          <ResultsList
            results={results}
            loading={loading}
            onResultSelect={handleResultSelect}
            onResultUpdated={loadResults}
          />

          {/* Modals */}
          {showCreateModal && (
            <CreateResultModal
              onClose={() => setShowCreateModal(false)}
              onResultCreated={handleResultCreated}
            />
          )}

          {showDetailsModal && selectedResult && (
            <ResultDetailsModal
              result={selectedResult}
              onClose={() => setShowDetailsModal(false)}
              onResultUpdated={handleResultUpdated}
              onResultDeleted={handleResultDeleted}
            />
          )}

          {showCategoryTagModal && (
            <CategoryTagManager
              onClose={() => setShowCategoryTagModal(false)}
              onUpdated={loadResults}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}