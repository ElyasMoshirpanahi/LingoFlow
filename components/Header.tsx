import React from 'react';

interface HeaderProps {
  currentView: 'UPLOAD' | 'LIBRARY' | 'READER';
  setView: (view: 'UPLOAD' | 'LIBRARY' | 'READER') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <div 
          className="cyber-bg-blue p-2 rounded-lg cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setView('UPLOAD')}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">Lingo<span className="cyber-accent-blue">Flow</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mono">Corporate Neural Reader</p>
        </div>
      </div>
      
      <nav className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        <button 
          onClick={() => setView('UPLOAD')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentView === 'UPLOAD' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          PROCESS
        </button>
        <button 
          onClick={() => setView('LIBRARY')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentView === 'LIBRARY' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
          LIBRARY
        </button>
      </nav>
    </header>
  );
};

export default Header;