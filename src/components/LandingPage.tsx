import React, { useState } from 'react';
import { Database, Zap, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGenerate: (prompt: string, dbType: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [dbType, setDbType] = useState('SQL');
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, dbType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full opacity-20"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10"></div>

      <div className="w-full max-w-2xl mx-auto relative z-10">
        {/* Logo and tagline */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-purple-500/20 rounded-2xl backdrop-blur-sm border border-purple-500/30">
              <Database className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white ml-4 tracking-tight">
              DB.Coach
            </h1>
          </div>
          <p className="text-xl text-slate-300 font-light">
            Design Databases at the Speed of Thought
          </p>
        </div>

        {/* Main input card */}
        <div className="backdrop-blur-xl bg-slate-800/40 border border-purple-500/20 rounded-2xl p-8 shadow-2xl shadow-purple-500/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Database type selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Database Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['SQL', 'NoSQL', 'VectorDB'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDbType(type)}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      dbType === type
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Main textarea */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Describe Your Database
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your database needs... (e.g., 'A blog platform with users, posts, and comments')"
                className="w-full h-32 p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none"
                required
              />
            </div>

            {/* Generate button */}
            <button
              type="submit"
              disabled={!prompt.trim()}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`w-full p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                isHovered && prompt.trim() ? 'shadow-lg shadow-purple-500/25 transform scale-[1.02]' : ''
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Generate Database Design</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-purple-500/20 rounded">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-sm text-slate-300">
                <p className="font-medium mb-1">💡 Pro tip:</p>
                <p>Be specific about your use case. Mention entities, relationships, and any special requirements for the best results.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;