
import React from 'react';
import { Definition } from '../types';

interface VocabularyModalProps {
  definition: Definition | null;
  loading: boolean;
  onClose: () => void;
}

const VocabularyModal: React.FC<VocabularyModalProps> = ({ definition, loading, onClose }) => {
  if (!definition && !loading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="cyber-card w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300 border-sky-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-1 drop-shadow-sm">
                {loading ? 'ANALYZING...' : definition?.word}
              </h3>
              <p className="text-sky-400 font-bold text-[10px] uppercase tracking-[0.2em] mono">Neural Lexicon Expansion</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-900 rounded-2xl text-slate-500 hover:text-sky-400 transition-colors border border-slate-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-2 border-sky-500/10 border-t-sky-500 rounded-full animate-spin shadow-[0_0_20px_rgba(14,165,233,0.2)]"></div>
              <p className="text-slate-500 font-bold mono text-xs uppercase tracking-widest">Querying Cloud Neural Net...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mono flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-slate-800"></span>
                  Vector Definition
                </h4>
                <p className="text-slate-300 text-xl leading-relaxed bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50">
                  {definition?.definition}
                </p>
              </div>

              {definition?.example && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mono flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-slate-800"></span>
                    Usage Trace
                  </h4>
                  <p className="text-sky-300/80 italic text-lg leading-relaxed pl-6 border-l-2 border-sky-500/30">
                    "{definition.example}"
                  </p>
                </div>
              )}
              
              <button 
                onClick={onClose}
                className="w-full cyber-bg-blue text-white font-black py-5 rounded-2xl hover:brightness-110 transition-all mt-6 uppercase tracking-widest italic text-sm"
              >
                Resynchronize Context
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyModal;
