import React from 'react';

interface HeaderProps {
  currentView: 'UPLOAD' | 'LIBRARY' | 'READER';
  setView: (view: 'UPLOAD' | 'LIBRARY' | 'READER') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  return (
    <header className="bg-spotify-black px-4 sm:px-6 py-4 flex items-center justify-between z-40">
      <div className="flex items-center gap-3 sm:gap-4 cursor-pointer" onClick={() => setView('LIBRARY')}>
        <div className="bg-sky-500 p-2 rounded-full shadow-lg shadow-sky-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tighter uppercase italic leading-none">Lingo<span className="text-sky-400">Flow</span></h1>
          <p className="hidden sm:block text-[9px] text-spotify-active font-bold uppercase tracking-[0.2em] mt-1">Premium Reader</p>
        </div>
      </div>
      
      <nav className="flex items-center gap-2">
        <button 
          onClick={() => setView('UPLOAD')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${currentView === 'UPLOAD' ? 'bg-white text-black' : 'text-spotify-active hover:text-white'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden xs:inline">INGEST</span>
        </button>
        <button 
          onClick={() => setView('LIBRARY')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${currentView === 'LIBRARY' ? 'bg-white text-black' : 'text-spotify-active hover:text-white'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="hidden xs:inline">COLLECTION</span>
        </button>
      </nav>
    </header>
  );
};

export default Header;