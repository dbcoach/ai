import React, { useState } from 'react';
import { Code, Download, Eye, ChevronRight, ChevronDown } from 'lucide-react';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: any;
  response: any;
}

const APIEndpointsTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('get-users');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['request', 'response']));

  const endpoints: Endpoint[] = [
    {
      id: 'get-users',
      method: 'GET',
      path: '/api/users',
      description: 'Get all users',
      response: {
        data: [
          {
            id: 1,
            email: 'john@example.com',
            username: 'johnsmith',
            first_name: 'John',
            last_name: 'Smith'
          }
        ],
        meta: {
          total: 25,
          page: 1,
          limit: 10
        }
      }
    },
    {
      id: 'create-user',
      method: 'POST',
      path: '/api/users',
      description: 'Create a new user',
      requestBody: {
        email: 'jane@example.com',
        username: 'janedoe',
        password: 'securepassword',
        first_name: 'Jane',
        last_name: 'Doe'
      },
      response: {
        data: {
          id: 26,
          email: 'jane@example.com',
          username: 'janedoe',
          first_name: 'Jane',
          last_name: 'Doe',
          created_at: '2024-01-21T10:30:00Z'
        }
      }
    },
    {
      id: 'get-posts',
      method: 'GET',
      path: '/api/posts',
      description: 'Get all posts',
      response: {
        data: [
          {
            id: 1,
            title: 'Getting Started with React',
            slug: 'getting-started-react',
            excerpt: 'Learn the basics of React development',
            status: 'published',
            author: {
              id: 1,
              username: 'johnsmith'
            }
          }
        ]
      }
    },
    {
      id: 'create-post',
      method: 'POST',
      path: '/api/posts',
      description: 'Create a new post',
      requestBody: {
        title: 'New Blog Post',
        content: 'This is the content of the new blog post...',
        excerpt: 'Short description of the post',
        category_id: 1,
        status: 'draft'
      },
      response: {
        data: {
          id: 4,
          title: 'New Blog Post',
          slug: 'new-blog-post',
          status: 'draft',
          created_at: '2024-01-21T15:30:00Z'
        }
      }
    },
    {
      id: 'delete-post',
      method: 'DELETE',
      path: '/api/posts/{id}',
      description: 'Delete a post',
      response: {
        message: 'Post deleted successfully'
      }
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PUT': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const selectedEndpointData = endpoints.find(e => e.id === selectedEndpoint);

  return (
    <div className="h-full flex bg-slate-900/50">
      {/* Endpoints Sidebar */}
      <div className="w-1/3 border-r border-slate-700/50 bg-slate-800/20">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="font-medium text-white">API Endpoints</h3>
          <p className="text-sm text-slate-400 mt-1">RESTful API for your database</p>
        </div>
        <div className="overflow-y-auto">
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.id}
              onClick={() => setSelectedEndpoint(endpoint.id)}
              className={`w-full p-4 text-left border-b border-slate-700/30 transition-all ${
                selectedEndpoint === endpoint.id
                  ? 'bg-purple-600/20 border-l-4 border-l-purple-500'
                  : 'hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-mono truncate ${
                    selectedEndpoint === endpoint.id ? 'text-purple-300' : 'text-slate-300'
                  }`}>
                    {endpoint.path}
                  </p>
                  <p className={`text-xs mt-1 ${
                    selectedEndpoint === endpoint.id ? 'text-purple-400' : 'text-slate-500'
                  }`}>
                    {endpoint.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Endpoint Details */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded font-medium text-sm border ${getMethodColor(selectedEndpointData?.method || 'GET')}`}>
                {selectedEndpointData?.method}
              </span>
              <code className="text-lg font-mono text-white">{selectedEndpointData?.path}</code>
            </div>
            <button className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-200">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export OpenAPI</span>
            </button>
          </div>
          <p className="text-slate-400 mt-2">{selectedEndpointData?.description}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Request Body */}
          {selectedEndpointData?.requestBody && (
            <div className="bg-slate-800/30 rounded-lg border border-slate-700/50">
              <button
                onClick={() => toggleSection('request')}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <h4 className="font-medium text-white">Request Body</h4>
                {expandedSections.has('request') ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('request') && (
                <div className="border-t border-slate-700/50">
                  <div className="flex">
                    <div className="bg-slate-800/50 border-r border-slate-700/50 p-4 text-slate-500 text-sm font-mono select-none">
                      {JSON.stringify(selectedEndpointData.requestBody, null, 2).split('\n').map((_, index) => (
                        <div key={index} className="leading-6">
                          {index + 1}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm leading-6 overflow-x-auto">
                      <pre className="text-slate-200">
                        <code>{JSON.stringify(selectedEndpointData.requestBody, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Response */}
          <div className="bg-slate-800/30 rounded-lg border border-slate-700/50">
            <button
              onClick={() => toggleSection('response')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h4 className="font-medium text-white">Response</h4>
              {expandedSections.has('response') ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </button>
            {expandedSections.has('response') && (
              <div className="border-t border-slate-700/50">
                <div className="flex">
                  <div className="bg-slate-800/50 border-r border-slate-700/50 p-4 text-slate-500 text-sm font-mono select-none">
                    {JSON.stringify(selectedEndpointData?.response || {}, null, 2).split('\n').map((_, index) => (
                      <div key={index} className="leading-6">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-4 font-mono text-sm leading-6 overflow-x-auto">
                    <pre className="text-slate-200">
                      <code>{JSON.stringify(selectedEndpointData?.response || {}, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIEndpointsTab;