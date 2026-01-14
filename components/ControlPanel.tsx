
import React from 'react';
import { PlaybackState } from '../types';

interface ControlPanelProps {
  playbackState: PlaybackState;
  currentIndex: number;
  totalSentences: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  playbackState, 
  currentIndex, 
  totalSentences,
  onPlayPause, 
  onNext, 
  onPrev 
}) => {
  const isPlaying = playbackState === PlaybackState.PLAYING_EN || playbackState === PlaybackState.PLAYING_FA;
  const progress = totalSentences > 0 ? ((currentIndex + 1) / totalSentences) * 100 : 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-20">
      <div className="bg-white/90 backdrop-blur-md shadow-2xl border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex-1 flex flex-col">
            <span className="text-sm font-bold text-slate-800">
              Sentence {currentIndex + 1} <span className="text-slate-400 font-normal">of {totalSentences}</span>
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
               {isPlaying ? 'Now Playing' : 'Ready to Start'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-30"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button 
              onClick={onPlayPause}
              className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button 
              onClick={onNext}
              disabled={currentIndex === totalSentences - 1}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-30"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 text-right hidden md:block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              LingoFlow Engine v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
