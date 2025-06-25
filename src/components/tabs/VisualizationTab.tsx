import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download, Maximize, RotateCcw } from 'lucide-react';

interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: Array<{
    name: string;
    type: string;
    isPrimary?: boolean;
    isForeign?: boolean;
    references?: string;
  }>;
}

const VisualizationTab: React.FC = () => {
  const [zoom, setZoom] = useState(100);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const tables: Table[] = [
    {
      id: 'users',
      name: 'users',
      x: 100,
      y: 100,
      columns: [
        { name: 'id', type: 'SERIAL', isPrimary: true },
        { name: 'email', type: 'VARCHAR(255)' },
        { name: 'username', type: 'VARCHAR(50)' },
        { name: 'password_hash', type: 'VARCHAR(255)' },
        { name: 'first_name', type: 'VARCHAR(100)' },
        { name: 'last_name', type: 'VARCHAR(100)' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ]
    },
    {
      id: 'categories',
      name: 'categories',
      x: 500,
      y: 100,
      columns: [
        { name: 'id', type: 'SERIAL', isPrimary: true },
        { name: 'name', type: 'VARCHAR(100)' },
        { name: 'slug', type: 'VARCHAR(100)' },
        { name: 'description', type: 'TEXT' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ]
    },
    {
      id: 'posts',
      name: 'posts',
      x: 300,
      y: 300,
      columns: [
        { name: 'id', type: 'SERIAL', isPrimary: true },
        { name: 'title', type: 'VARCHAR(255)' },
        { name: 'slug', type: 'VARCHAR(255)' },
        { name: 'content', type: 'TEXT' },
        { name: 'status', type: 'VARCHAR(20)' },
        { name: 'author_id', type: 'INTEGER', isForeign: true, references: 'users.id' },
        { name: 'category_id', type: 'INTEGER', isForeign: true, references: 'categories.id' },
        { name: 'published_at', type: 'TIMESTAMP' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ]
    },
    {
      id: 'comments',
      name: 'comments',
      x: 100,
      y: 500,
      columns: [
        { name: 'id', type: 'SERIAL', isPrimary: true },
        { name: 'content', type: 'TEXT' },
        { name: 'author_id', type: 'INTEGER', isForeign: true, references: 'users.id' },
        { name: 'post_id', type: 'INTEGER', isForeign: true, references: 'posts.id' },
        { name: 'parent_id', type: 'INTEGER', isForeign: true, references: 'comments.id' },
        { name: 'status', type: 'VARCHAR(20)' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ]
    },
    {
      id: 'tags',
      name: 'tags',
      x: 600,
      y: 400,
      columns: [
        { name: 'id', type: 'SERIAL', isPrimary: true },
        { name: 'name', type: 'VARCHAR(50)' },
        { name: 'slug', type: 'VARCHAR(50)' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ]
    }
  ];

  const relationships = [
    { from: 'posts', to: 'users', fromColumn: 'author_id', toColumn: 'id' },
    { from: 'posts', to: 'categories', fromColumn: 'category_id', toColumn: 'id' },
    { from: 'comments', to: 'users', fromColumn: 'author_id', toColumn: 'id' },
    { from: 'comments', to: 'posts', fromColumn: 'post_id', toColumn: 'id' },
    { from: 'comments', to: 'comments', fromColumn: 'parent_id', toColumn: 'id' },
  ];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const resetZoom = () => setZoom(100);

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/20">
        <div>
          <h3 className="font-medium text-white">Entity Relationship Diagram</h3>
          <p className="text-sm text-slate-400 mt-1">Visual representation of your database schema</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-slate-600/50 rounded text-slate-300 hover:text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-slate-300 min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-slate-600/50 rounded text-slate-300 hover:text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 hover:bg-slate-600/50 rounded text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all duration-200">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export SVG</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-auto bg-slate-900/70">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {relationships.map((rel, index) => {
            const fromTable = tables.find(t => t.id === rel.from);
            const toTable = tables.find(t => t.id === rel.to);
            
            if (!fromTable || !toTable) return null;
            
            const startX = fromTable.x + 150;
            const startY = fromTable.y + 40 + (fromTable.columns.findIndex(col => col.name === rel.fromColumn) * 28);
            const endX = toTable.x;
            const endY = toTable.y + 40 + (toTable.columns.findIndex(col => col.name === rel.toColumn) * 28);
            
            return (
              <g key={index}>
                <path
                  d={`M ${startX} ${startY} L ${endX} ${endY}`}
                  stroke="#8B5CF6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
                <circle
                  cx={endX}
                  cy={endY}
                  r="4"
                  fill="#8B5CF6"
                  opacity="0.8"
                />
              </g>
            );
          })}
        </svg>

        {/* Tables */}
        <div 
          className="relative"
          style={{ 
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${100 / (zoom / 100)}%`,
            height: `${100 / (zoom / 100)}%`
          }}
        >
          {tables.map((table) => (
            <div
              key={table.id}
              className={`absolute bg-slate-800/90 backdrop-blur-sm border-2 rounded-lg shadow-xl transition-all duration-200 ${
                selectedTable === table.id
                  ? 'border-purple-400 shadow-purple-400/25'
                  : 'border-slate-600/50 hover:border-slate-500/70'
              }`}
              style={{
                left: table.x,
                top: table.y,
                width: 300,
              }}
              onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
            >
              {/* Table header */}
              <div className="bg-purple-600/20 border-b border-purple-500/30 p-3 rounded-t-lg">
                <h4 className="font-mono font-semibold text-purple-300 flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  {table.name}
                </h4>
              </div>
              
              {/* Columns */}
              <div className="p-0">
                {table.columns.map((column, index) => (
                  <div
                    key={column.name}
                    className={`flex items-center justify-between p-2 border-b border-slate-700/30 last:border-b-0 ${
                      index % 2 === 0 ? 'bg-slate-700/20' : 'bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {column.isPrimary && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Primary Key" />
                      )}
                      {column.isForeign && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full" title="Foreign Key" />
                      )}
                      <span className="font-mono text-sm text-slate-200">{column.name}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-400">{column.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mini-map */}
        <div className="absolute bottom-4 left-4 w-48 h-32 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 rounded-lg p-2">
          <div className="text-xs text-slate-400 mb-2">Mini Map</div>
          <div className="relative w-full h-full bg-slate-900/50 rounded overflow-hidden">
            {tables.map((table) => (
              <div
                key={`mini-${table.id}`}
                className="absolute bg-purple-500/60 rounded"
                style={{
                  left: `${(table.x / 800) * 100}%`,
                  top: `${(table.y / 600) * 100}%`,
                  width: '8px',
                  height: '6px',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationTab;