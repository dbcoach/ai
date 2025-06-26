import React, { useState } from 'react';
import { Database, Zap, ArrowRight, Bot, Sparkles } from 'lucide-react';
import { DBCoachMode } from '../context/GenerationContext';

interface LandingPageProps {
  onGenerate: (prompt: string, dbType: string, mode?: DBCoachMode) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [dbType, setDbType] = useState('SQL');
  const [mode, setMode] = useState<DBCoachMode>('dbcoach');
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, dbType, mode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          {[...Array(25)].map((_, i) => (
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

      {/* Brand in top right */}
      <div className="relative z-10 flex justify-end mb-8">
        <div className="flex items-center space-x-2 bg-slate-800/40 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">DB.Coach</span>
        </div>
      </div>

      {/* Main content - centered and filling remaining space */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-4xl mx-auto text-center">
          {/* Main heading */}
          <div className="mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              What data do you want to store?
            </h1>
            <p className="text-lg md:text-xl text-slate-300 font-light opacity-90">
              Design Databases at the Speed of Thought
            </p>
          </div>

          {/* Input form */}
          <div className="max-w-3xl mx-auto">
            <div className="backdrop-blur-xl bg-slate-800/40 border border-purple-500/20 rounded-2xl p-8 shadow-2xl shadow-purple-500/5">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* DBCoach Mode Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-4 text-left">
                    Generation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setMode('dbcoach')}
                      className={`p-5 rounded-xl border transition-all duration-200 ${
                        mode === 'dbcoach'
                          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Bot className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-semibold text-base">DBCoach Pro</div>
                          <div className="text-sm opacity-75">Multi-agent analysis</div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('standard')}
                      className={`p-5 rounded-xl border transition-all duration-200 ${
                        mode === 'standard'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-slate-700/30 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-semibold text-base">Standard</div>
                          <div className="text-sm opacity-75">Quick generation</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Database type selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-4 text-left">
                    Database Type
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {['SQL', 'NoSQL', 'VectorDB'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDbType(type)}
                        className={`p-4 rounded-xl border transition-all duration-200 font-medium ${
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
                  <label className="block text-sm font-medium text-slate-300 mb-4 text-left">
                    Describe Your Database
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your database needs... (e.g., 'A blog platform with users, posts, and comments')"
                    className="w-full h-40 p-5 bg-slate-700/30 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none text-base leading-relaxed"
                    required
                  />
                </div>

                {/* Generate button */}
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={`w-full p-5 bg-gradient-to-r ${
                    mode === 'dbcoach' 
                      ? 'from-purple-600 via-blue-600 to-purple-700 hover:from-purple-500 hover:via-blue-500 hover:to-purple-600' 
                      : 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'
                  } disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-lg ${
                    isHovered && prompt.trim() ? 'shadow-lg shadow-purple-500/25 transform scale-[1.02]' : ''
                  }`}
                >
                  {mode === 'dbcoach' ? <Bot className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                  <span>{mode === 'dbcoach' ? 'Generate with DBCoach Pro' : 'Generate Database Design'}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </form>

              {/* Help text */}
              <div className="mt-8 p-5 bg-slate-700/20 rounded-xl border border-slate-600/30">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    {mode === 'dbcoach' ? <Bot className="w-5 h-5 text-purple-400" /> : <Zap className="w-5 h-5 text-purple-400" />}
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed">
                    {mode === 'dbcoach' ? (
                      <>
                        <p className="font-medium mb-2">🤖 DBCoach Pro Features:</p>
                        <p>Multi-agent analysis • Enterprise validation • Performance optimization • Security audit • Production-ready implementation packages</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium mb-2">💡 Pro tip:</p>
                        <p>Be specific about your use case. Mention entities, relationships, and any special requirements for the best results.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16"></div>
    </div>
  );
};

export default LandingPage;