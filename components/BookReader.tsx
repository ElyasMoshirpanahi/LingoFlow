import React, { useEffect, useRef } from 'react';
import { Chapter, PlaybackState } from '../types';

interface BookReaderProps {
  chapter: Chapter | null;
  currentIndex: number;
  playbackState: PlaybackState;
  onSelectSentence: (idx: number) => void;
  onWordClick: (word: string, context: string) => void;
}

const BookReader: React.FC<BookReaderProps> = ({ 
  chapter, 
  currentIndex, 
  playbackState, 
  onSelectSentence,
  onWordClick 
}) => {
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

  const renderTextWithWordClicks = (text: string, context: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (/\s+/.test(word)) return word;
      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      return (
        <span 
          key={i} 
          onClick={(e) => {
            e.stopPropagation();
            onWordClick(cleanWord, context);
          }}
          className="hover:text-sky-400 hover:bg-sky-400/10 rounded-sm px-0.5 transition-all cursor-help border-b border-transparent hover:border-sky-500/50"
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="space-y-12 pb-48 max-w-4xl mx-auto w-full px-6 pt-12" ref={scrollRef}>
      {chapter.sentences.map((sentence, idx) => {
        const isActive = currentIndex === idx;
        const isEnPlaying = isActive && playbackState === PlaybackState.PLAYING_EN;
        const isFaPlaying = isActive && playbackState === PlaybackState.PLAYING_FA;

        return (
          <div 
            key={sentence.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSelectSentence(idx)}
            className={`group transition-all duration-700 p-10 rounded-[2.5rem] cursor-pointer relative overflow-hidden ${
              isActive 
                ? 'cyber-card border-sky-500/30 shadow-[0_0_50px_rgba(14,165,233,0.1)] scale-[1.02] z-10' 
                : 'opacity-30 grayscale hover:grayscale-0 hover:opacity-60 bg-transparent'
            }`}
          >
            {isActive && (
              <div className="absolute top-0 left-0 w-1 h-full cyber-bg-blue"></div>
            )}
            
            <div className="space-y-8">
              {/* Learning Content */}
              <p className={`text-3xl leading-relaxed transition-all duration-500 font-medium ${
                isEnPlaying 
                  ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]' 
                  : isActive ? 'text-white' : 'text-slate-500'
              }`}>
                {renderTextWithWordClicks(sentence.enText, sentence.enText)}
              </p>

              {/* Translation (Origin) */}
              <div className={`transition-all duration-1000 ease-in-out overflow-hidden ${
                isActive ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className={`p-8 rounded-3xl border border-slate-800/50 persian-text text-3xl leading-[2.2] transition-all duration-500 ${
                  isFaPlaying 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' 
                    : 'bg-slate-900/50 text-slate-400'
                }`}>
                  {sentence.faText}
                </div>
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-4 mt-8">
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isEnPlaying ? 'bg-sky-500 animate-pulse' : 'bg-slate-700'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${isFaPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mono">
                  {isEnPlaying ? 'Processing_Origin' : isFaPlaying ? 'Syncing_Neural_Translation' : 'Standby'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BookReader;