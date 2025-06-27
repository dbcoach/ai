import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resultsService, SearchResultsParams, ResultCategory, ResultTag } from '../../services/resultsService';
import { 
  Search,
  Filter,
  X,
  Star,
  FileText,
  Table,
  Code
} from 'lucide-react';

interface ResultsSearchProps {
  onSearch: (params: SearchResultsParams) => void;
}

export function ResultsSearch({ onSearch }: ResultsSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<ResultCategory[]>([]);
  const [tags, setTags] = useState<ResultTag[]>([]);
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      loadCategories();
      loadTags();
    }
  }, [user]);

  useEffect(() => {
    const params: SearchResultsParams = {
      query: query.trim() || undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      result_format: selectedFormat || undefined,
      is_favorite: showFavorites || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      limit: 50
    };

    onSearch(params);
  }, [query, selectedCategories, selectedTags, selectedFormat, showFavorites, sortBy, sortOrder, onSearch]);

  const loadCategories = async () => {
    if (!user) return;
    try {
      const data = await resultsService.getCategories(user.id);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    if (!user) return;
    try {
      const data = await resultsService.getTags(user.id);
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedFormat('');
    setShowFavorites(false);
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = query || selectedCategories.length > 0 || selectedTags.length > 0 || selectedFormat || showFavorites;

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: Code },
    { value: 'csv', label: 'CSV', icon: FileText },
    { value: 'table', label: 'Table', icon: Table }
  ];

  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500" />
        </div>
        <input
          type="text"
          placeholder="Search results by title, description, or query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
            hasActiveFilters ? 'text-purple-400' : 'text-slate-500'
          } hover:text-purple-300 transition-colors`}
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedCategories.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <span
                key={categoryId}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm"
              >
                {category.name}
                <button
                  onClick={() => handleCategoryToggle(categoryId)}
                  className="hover:text-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}

          {selectedTags.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag ? (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-600/20 text-green-300 text-sm"
              >
                #{tag.name}
                <button
                  onClick={() => handleTagToggle(tagId)}
                  className="hover:text-green-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}

          {selectedFormat && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 text-sm">
              {selectedFormat.toUpperCase()}
              <button
                onClick={() => setSelectedFormat('')}
                className="hover:text-purple-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {showFavorites && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-600/20 text-yellow-300 text-sm">
              <Star className="h-3 w-3" />
              Favorites
              <button
                onClick={() => setShowFavorites(false)}
                className="hover:text-yellow-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-slate-300 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expanded filters */}
      {showFilters && (
        <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Format filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
              <div className="space-y-2">
                {formatOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={selectedFormat === option.value}
                      onChange={(e) => setSelectedFormat(e.target.checked ? option.value : '')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <option.icon className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Categories</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm text-slate-300">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagToggle(tag.id)}
                      className="text-green-600 focus:ring-green-500 rounded"
                    />
                    <span className="text-sm text-slate-300">#{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort and other filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="created_at">Created Date</option>
                  <option value="updated_at">Updated Date</option>
                  <option value="title">Title</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavorites}
                  onChange={(e) => setShowFavorites(e.target.checked)}
                  className="text-yellow-600 focus:ring-yellow-500 rounded"
                />
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-slate-300">Favorites only</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}