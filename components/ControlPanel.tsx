import React from 'react';
import { PlaybackState } from '../types';

interface ControlPanelProps {
  playbackState: PlaybackState;
  currentIndex: number;
  totalSentences: number;
  playbackSpeed: number;
  title: string;
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
  title,
  onPlayPause, 
  onNext, 
  onPrev,
  onSpeedChange
}) => {
  const isPlaying = playbackState === PlaybackState.PLAYING_EN || playbackState === PlaybackState.PLAYING_FA;
  const progress = totalSentences > 0 ? ((currentIndex + 1) / totalSentences) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 sm:h-28 bg-black border-t border-white/5 px-4 z-50 flex items-center glass-panel">
      <div className="max-w-[1920px] mx-auto w-full grid grid-cols-2 sm:grid-cols-3 items-center">
        
        {/* Track Info */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-spotify-grey rounded-md flex-shrink-0 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-xs">{title}</h4>
            <p className="text-[10px] text-spotify-active font-medium uppercase tracking-widest line-clamp-1">Chapter 01 &bull; Active Node</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center justify-center gap-2 sm:col-span-1">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="p-1 text-spotify-active hover:text-white disabled:opacity-30 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <button 
              onClick={onPlayPause}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button 
              onClick={onNext}
              disabled={currentIndex === totalSentences - 1}
              className="p-1 text-spotify-active hover:text-white disabled:opacity-30 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
              </svg>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 w-full max-w-md">
            <span className="text-[10px] text-spotify-active font-mono tabular-nums">{String(currentIndex + 1).padStart(2, '0')}</span>
            <div className="flex-1 h-1 bg-spotify-grey rounded-full overflow-hidden relative group cursor-pointer">
              <div 
                className="h-full bg-sky-500 group-hover:bg-sky-400 transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-spotify-active font-mono tabular-nums">{String(totalSentences).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="hidden sm:flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-spotify-active" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.25" 
              value={playbackSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-[10px] font-bold text-sky-400 w-6">{playbackSpeed}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;