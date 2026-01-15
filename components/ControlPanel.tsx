import React from 'react';
import { PlaybackState } from '../types';

interface ControlPanelProps {
  playbackState: PlaybackState;
  currentIndex: number;
  totalSentences: number;
  playbackSpeed: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSpeedChange: (speed: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  playbackState, 
  currentIndex, 
  totalSentences,
  playbackSpeed,
  onPlayPause, 
  onNext, 
  onPrev,
  onSpeedChange
}) => {
  const isPlaying = playbackState === PlaybackState.PLAYING_EN || playbackState === PlaybackState.PLAYING_FA;
  const progress = totalSentences > 0 ? ((currentIndex + 1) / totalSentences) * 100 : 0;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40">
      <div className="cyber-card rounded-[2rem] p-6 flex flex-col gap-5 border-t border-slate-700/50 shadow-2xl">
        <div className="relative w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="cyber-bg-blue h-full transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/30 to-transparent"></div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white italic tracking-tighter tabular-nums">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-600 font-black mono uppercase">/ {String(totalSentences).padStart(2, '0')}</span>
            </div>
            <p className="text-[10px] text-slate-500 mono font-bold uppercase tracking-widest mt-0.5">Vector_Index</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="p-4 text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 rounded-2xl transition-all disabled:opacity-10 group"
            >
              <svg style={{ width: '24px', height: '24px' }} className="transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button 
              onClick={onPlayPause}
              className="relative p-6 cyber-bg-blue text-white rounded-3xl group shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              <div className="absolute inset-0 rounded-3xl border border-white/20 animate-pulse"></div>
              {isPlaying ? (
                <svg style={{ width: '32px', height: '32px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg style={{ width: '32px', height: '32px' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button 
              onClick={onNext}
              disabled={currentIndex === totalSentences - 1}
              className="p-4 text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 rounded-2xl transition-all disabled:opacity-10 group"
            >
              <svg style={{ width: '24px', height: '24px' }} className="transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-end flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mono">BPS_SPEED</span>
              <span className="text-xs font-bold text-sky-400 mono">{playbackSpeed}x</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.25" 
              value={playbackSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-32 h-1 bg-slate-900 rounded-full appearance-none cursor-pointer accent-sky-400 border border-slate-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;