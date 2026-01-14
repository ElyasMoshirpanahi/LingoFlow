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
          className="hover:text-sky-400 hover:underline decoration-sky-500/50 underline-offset-4 cursor-help transition-all"
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-64 max-w-3xl mx-auto w-full px-4" ref={scrollRef}>
      {chapter.sentences.map((sentence, idx) => {
        const isActive = currentIndex === idx;
        const isEnPlaying = isActive && playbackState === PlaybackState.PLAYING_EN;
        const isFaPlaying = isActive && playbackState === PlaybackState.PLAYING_FA;

        return (
          <div 
            key={sentence.id}
            ref={isActive ? activeRef : null}
            onClick={() => onSelectSentence(idx)}
            className={`group transition-all duration-500 p-6 sm:p-8 rounded-2xl cursor-pointer border border-transparent ${
              isActive 
                ? 'bg-spotify-grey/40 border-sky-500/20 active-pulse' 
                : 'opacity-10 hover:opacity-40 grayscale hover:grayscale-0'
            }`}
          >
            <div className="space-y-4 sm:space-y-6">
              {/* Learning Content */}
              <p className={`text-xl sm:text-2xl leading-relaxed transition-all duration-300 font-semibold ${
                isEnPlaying 
                  ? 'text-sky-400 scale-[1.01] origin-left' 
                  : isActive ? 'text-white' : 'text-spotify-active'
              }`}>
                {renderTextWithWordClicks(sentence.enText, sentence.enText)}
              </p>

              {/* Translation (Origin) */}
              <div className={`transition-all duration-700 ease-in-out overflow-hidden ${
                isActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className={`p-4 sm:p-6 rounded-xl persian-text text-2xl sm:text-3xl leading-[2] transition-all duration-300 ${
                  isFaPlaying 
                    ? 'text-emerald-400 animate-pulse' 
                    : 'text-spotify-active'
                }`}>
                  {sentence.faText}
                </div>
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-3 mt-4">
                <div className="flex gap-1">
                  <span className={`w-1 h-3 rounded-full ${isEnPlaying ? 'bg-sky-500 animate-bounce' : 'bg-spotify-grey'}`}></span>
                  <span className={`w-1 h-4 rounded-full ${isEnPlaying ? 'bg-sky-400 animate-bounce delay-75' : 'bg-spotify-grey'}`}></span>
                  <span className={`w-1 h-2 rounded-full ${isEnPlaying ? 'bg-sky-300 animate-bounce delay-150' : 'bg-spotify-grey'}`}></span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-spotify-active font-mono">
                  {isEnPlaying ? 'SOURCE_PLAYBACK' : isFaPlaying ? 'TRANSLATION_SYNC' : 'READY'}
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