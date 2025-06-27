import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { resultsService, ResultCategory, ResultTag } from '../../services/resultsService';
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon,
  FolderIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface CategoryTagManagerProps {
  onClose: () => void;
  onUpdated: () => void;
}

export function CategoryTagManager({ onClose, onUpdated }: CategoryTagManagerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [categories, setCategories] = useState<ResultCategory[]>([]);
  const [tags, setTags] = useState<ResultTag[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
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
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    }
  };

  const loadTags = async () => {
    if (!user) return;
    try {
      const data = await resultsService.getTags(user.id);
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
      setError('Failed to load tags');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName.trim()) return;

    setLoading(true);
    try {
      const category = await resultsService.createCategory(user.id, newCategoryName.trim());
      setCategories(prev => [...prev, category]);
      setNewCategoryName('');
      onUpdated();
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTagName.trim()) return;

    setLoading(true);
    try {
      const tag = await resultsService.createTag(user.id, newTagName.trim());
      setTags(prev => [...prev, tag]);
      setNewTagName('');
      onUpdated();
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user || !confirm('Are you sure you want to delete this category? This will remove it from all associated results.')) {
      return;
    }

    try {
      await resultsService.deleteResult(user.id, categoryId); // This needs to be implemented in the service
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      onUpdated();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!user || !confirm('Are you sure you want to delete this tag? This will remove it from all associated results.')) {
      return;
    }

    try {
      await resultsService.deleteResult(user.id, tagId); // This needs to be implemented in the service
      setTags(prev => prev.filter(t => t.id !== tagId));
      onUpdated();
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('Failed to delete tag');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-slate-800 shadow-xl rounded-2xl border border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Manage Categories & Tags</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-900/50 border border-red-700 text-red-300">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-slate-900/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'categories'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FolderIcon className="h-4 w-4" />
              <span>Categories</span>
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'tags'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TagIcon className="h-4 w-4" />
              <span>Tags</span>
            </button>
          </div>

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Create new category */}
              <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                <h4 className="text-lg font-semibold text-white mb-3">Create New Category</h4>
                <form onSubmit={handleCreateCategory} className="flex space-x-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Categories list */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">
                  Existing Categories ({categories.length})
                </h4>
                {categories.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <FolderIcon className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                    <p>No categories created yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map(category => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/50"
                      >
                        <div className="flex items-center space-x-3">
                          <FolderIcon className="h-5 w-5 text-blue-400" />
                          <div>
                            <h5 className="font-medium text-white">{category.name}</h5>
                            <p className="text-sm text-slate-400">
                              Created {formatDate(category.created_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="space-y-6">
              {/* Create new tag */}
              <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                <h4 className="text-lg font-semibold text-white mb-3">Create New Tag</h4>
                <form onSubmit={handleCreateTag} className="flex space-x-3">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name"
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Tags list */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">
                  Existing Tags ({tags.length})
                </h4>
                {tags.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <TagIcon className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                    <p>No tags created yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tags.map(tag => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg border border-slate-700/50"
                      >
                        <div className="flex items-center space-x-3">
                          <TagIcon className="h-5 w-5 text-green-400" />
                          <div>
                            <h5 className="font-medium text-white">#{tag.name}</h5>
                            <p className="text-sm text-slate-400">
                              Created {formatDate(tag.created_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Delete tag"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t border-slate-700 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}