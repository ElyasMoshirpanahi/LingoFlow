
import React, { useEffect, useRef } from 'react';
import { Chapter, PlaybackState } from '../types';

interface BookReaderProps {
  chapter: Chapter | null;
  currentIndex: number;
  playbackState: PlaybackState;
  onSelectSentence: (idx: number) => void;
}

const BookReader: React.FC<BookReaderProps> = ({ chapter, currentIndex, playbackState, onSelectSentence }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentIndex]);

  if (!chapter) return null;

  return (
    <div className="space-y-6 pb-12" ref={scrollRef}>
      {chapter.sentences.map((sentence, idx) => {
        const isActive = currentIndex === idx;
        const isEnPlaying = isActive && playbackState === PlaybackState.PLAYING_EN;
        const isFaPlaying = isActive && playbackState === PlaybackState.PLAYING_FA;

        return (
          <div 
            key={sentence.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSelectSentence(idx)}
            className={`group transition-all duration-300 p-6 rounded-2xl cursor-pointer border ${
              isActive 
                ? 'bg-white border-blue-200 shadow-xl scale-[1.02]' 
                : 'bg-transparent border-transparent hover:bg-slate-100/50'
            }`}
          >
            <div className="space-y-4">
              {/* English Text */}
              <p className={`text-xl md:text-2xl leading-relaxed transition-colors duration-300 ${
                isEnPlaying 
                  ? 'bg-yellow-200 text-slate-900 px-2 -mx-2 rounded' 
                  : isActive ? 'text-slate-900 font-medium' : 'text-slate-600'
              }`}>
                {sentence.enText}
              </p>

              {/* Persian Translation - Show when active or on hover */}
              <div className={`transition-all duration-500 overflow-hidden ${
                isActive ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}>
                <div className={`p-4 rounded-xl border-r-4 persian-text text-xl md:text-2xl leading-loose transition-all duration-300 ${
                  isFaPlaying 
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-950' 
                    : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}>
                  {sentence.faText}
                </div>
              </div>
            </div>

            {/* Status indicator for active sentence */}
            {isActive && (
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {isEnPlaying ? 'English Audio' : isFaPlaying ? 'Persian Audio' : 'Ready'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BookReader;
