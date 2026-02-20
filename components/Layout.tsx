
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-100">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">CP25 instruction</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assistant de création d'instructions</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-10 w-[1px] bg-slate-100 hidden sm:block" />
            <div className="text-right hidden sm:block">
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-100 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          <div>© {new Date().getFullYear()} CP25 instruction</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Propulsé par Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
};
