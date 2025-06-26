import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2,
  Calendar,
  Shield,
  Database,
  Cloud,
  Save
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed: Date | null;
  permissions: string[];
}

export function ApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API',
      key: 'db_live_sk_1234567890abcdef',
      createdAt: new Date('2024-01-15'),
      lastUsed: new Date('2024-03-20'),
      permissions: ['read', 'write'],
    }
  ]);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    
    setIsCreating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `db_live_sk_${Math.random().toString(36).substring(2, 15)}`,
        createdAt: new Date(),
        lastUsed: null,
        permissions: ['read', 'write'],
      };
      
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName('');
      setShowCreateDialog(false);
      setSuccessMessage('API key created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDeleteKey = async (id: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setApiKeys(apiKeys.filter(key => key.id !== id));
      setDeleteKey(null);
      setSuccessMessage('API key deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('API key copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  const maskKey = (key: string) => {
    const visible = key.substring(0, 12);
    const masked = '•'.repeat(key.length - 12);
    return visible + masked;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">API Keys</h2>
          <p className="text-slate-300">
            Manage your API keys for external integrations
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create New Key
        </button>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300">
          {successMessage}
        </div>
      )}
      
      {/* Create Key Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Create API Key</h3>
            <p className="text-slate-300 mb-4 text-sm">
              Generate a new API key for your integrations
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="key-name" className="block text-sm font-medium text-slate-300 mb-2">
                  Key Name
                </label>
                <input
                  id="key-name"
                  type="text"
                  placeholder="e.g., Production API"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  A descriptive name to identify this key
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || isCreating}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteKey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete API Key</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this API key? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteKey(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteKey(deleteKey)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div 
            key={apiKey.id}
            className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                {/* Key Name and Badge */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                    <Key className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{apiKey.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {apiKey.createdAt.toLocaleDateString()}
                      </span>
                      {apiKey.lastUsed && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Last used {apiKey.lastUsed.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* API Key Display */}
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 font-mono text-sm text-slate-300">
                    {showKey === apiKey.id ? apiKey.key : maskKey(apiKey.key)}
                  </code>
                  <button
                    onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                    className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    {showKey === apiKey.id ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKey.key)}
                    className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Permissions */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Permissions:</span>
                  {apiKey.permissions.map((permission) => (
                    <span key={permission} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Delete Button */}
              <button
                onClick={() => setDeleteKey(apiKey.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Integration Examples */}
      <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Available Integrations
        </h3>
        <p className="text-slate-300 mb-6">
          Connect DB.Coach with your favorite tools
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'VS Code Extension', icon: Code2, status: 'Available' },
            { name: 'GitHub Actions', icon: Database, status: 'Available' },
            { name: 'Postman Collection', icon: Cloud, status: 'Coming Soon' },
            { name: 'Terraform Provider', icon: Database, status: 'Coming Soon' },
          ].map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-600/50 bg-slate-700/30"
            >
              <div className="flex items-center gap-3">
                <integration.icon className="h-5 w-5 text-slate-400" />
                <span className="font-medium text-white">{integration.name}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                integration.status === 'Available' 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-slate-600/50 text-slate-400'
              }`}>
                {integration.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}