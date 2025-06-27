import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resultsService, ResultCategory, ResultTag } from '../../services/resultsService';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CreateResultModalProps {
  onClose: () => void;
  onResultCreated: () => void;
}

export function CreateResultModal({ onClose, onResultCreated }: CreateResultModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    original_query: '',
    result_format: 'json' as 'json' | 'csv' | 'table',
    data: '',
    metadata: {},
    categories: [] as string[],
    tags: [] as string[]
  });

  const [availableCategories, setAvailableCategories] = useState<ResultCategory[]>([]);
  const [availableTags, setAvailableTags] = useState<ResultTag[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadCategories();
      loadTags();
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;
    try {
      const data = await resultsService.getCategories(user.id);
      setAvailableCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    if (!user) return;
    try {
      const data = await resultsService.getTags(user.id);
      setAvailableTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Parse the data based on format
      let parsedData;
      if (formData.result_format === 'json') {
        try {
          parsedData = JSON.parse(formData.data);
        } catch {
          throw new Error('Invalid JSON format');
        }
      } else {
        parsedData = formData.data;
      }

      await resultsService.createResult(user.id, {
        title: formData.title,
        description: formData.description || undefined,
        original_query: formData.original_query || undefined,
        result_format: formData.result_format,
        data: parsedData,
        metadata: formData.metadata,
        categories: formData.categories,
        tags: formData.tags
      });

      onResultCreated();
    } catch (error) {
      console.error('Error creating result:', error);
      setError(error instanceof Error ? error.message : 'Failed to save result');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!user || !newCategory.trim()) return;

    try {
      const category = await resultsService.createCategory(user.id, newCategory.trim());
      setAvailableCategories(prev => [...prev, category]);
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category.name]
      }));
      setNewCategory('');
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleAddTag = async () => {
    if (!user || !newTag.trim()) return;

    try {
      const tag = await resultsService.createTag(user.id, newTag.trim());
      setAvailableTags(prev => [...prev, tag]);
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.name]
      }));
      setNewTag('');
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleCategoryToggle = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName]
    }));
  };

  const handleTagToggle = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-800 shadow-xl rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Save Query Result</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-900/50 border border-red-700 text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter a descriptive title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Original Query
                  </label>
                  <textarea
                    value={formData.original_query}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_query: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    placeholder="SELECT * FROM users WHERE..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Result Format *
                  </label>
                  <select
                    value={formData.result_format}
                    onChange={(e) => setFormData(prev => ({ ...prev, result_format: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="table">Table</option>
                  </select>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Categories
                  </label>
                  <div className="space-y-2">
                    {availableCategories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.name)}
                          onChange={() => handleCategoryToggle(category.name)}
                          className="text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-sm text-slate-300">{category.name}</span>
                      </label>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category"
                        className="flex-1 px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tags
                  </label>
                  <div className="space-y-2">
                    {availableTags.map(tag => (
                      <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tags.includes(tag.name)}
                          onChange={() => handleTagToggle(tag.name)}
                          className="text-green-600 focus:ring-green-500 rounded"
                        />
                        <span className="text-sm text-slate-300">#{tag.name}</span>
                      </label>
                    ))}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="New tag"
                        className="flex-1 px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Data */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Result Data *
              </label>
              <textarea
                required
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                rows={12}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                placeholder={
                  formData.result_format === 'json'
                    ? '{\n  "data": [\n    {"id": 1, "name": "John"},\n    {"id": 2, "name": "Jane"}\n  ]\n}'
                    : formData.result_format === 'csv'
                    ? 'id,name\n1,John\n2,Jane'
                    : 'Paste your result data here...'
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}