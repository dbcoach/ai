import React, { ReactNode } from 'react';
import { SettingsNav } from './SettingsNav';
import ProtectedRoute from '../auth/ProtectedRoute';

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Mesh gradient overlay - matching main app aesthetic */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/30 to-slate-900/20 pointer-events-none" />
        
        <div className="relative z-10 container max-w-7xl mx-auto py-10 px-4 md:px-8">
          {/* Page Header with glassmorphism */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-slate-300 mt-2">
              Manage your account and preferences
            </p>
          </div>
          
          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <aside className="md:col-span-1">
              <div className="rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 shadow-xl p-4">
                <SettingsNav />
              </div>
            </aside>
            
            {/* Main Content Area */}
            <main className="md:col-span-3">
              <div className="rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 shadow-xl p-6 md:p-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}