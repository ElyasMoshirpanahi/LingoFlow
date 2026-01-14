
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlaybackState, Sentence, Chapter } from './types';
import { processText, generateTTS } from './services/gemini';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import BookReader from './components/BookReader';
import UploadSection from './components/UploadSection';

const App: React.FC = () => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleFileUpload = async (text: string) => {
    setPlaybackState(PlaybackState.PROCESSING);
    setLoadingProgress(10);
    
    try {
      const processed = await processText(text);
      setLoadingProgress(50);
      
      const sentences: Sentence[] = processed.map((item, index) => ({
        id: index,
        enText: item.en,
        faText: item.fa
      }));

      setChapter({ title: "Imported Document", sentences });
      setCurrentIndex(0);
      setPlaybackState(PlaybackState.IDLE);
      setLoadingProgress(100);
    } catch (error) {
      console.error(error);
      setPlaybackState(PlaybackState.IDLE);
      alert("Error processing text. Please try again.");
    }
  };

  const stopPlayback = () => {
    if (activeSourceRef.current) {
      activeSourceRef.current.stop();
      activeSourceRef.current = null;
    }
  };

  const playAudio = useCallback(async (buffer: AudioBuffer, onEnd: () => void) => {
    initAudioContext();
    const ctx = audioContextRef.current!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = onEnd;
    source.start(0);
    activeSourceRef.current = source;
  }, []);

  const playSentence = useCallback(async (index: number, startWithFA: boolean = false) => {
    if (!chapter || index >= chapter.sentences.length) {
      setPlaybackState(PlaybackState.IDLE);
      return;
    }

    const sentence = chapter.sentences[index];
    initAudioContext();
    const ctx = audioContextRef.current!;

    try {
      if (!startWithFA) {
        setPlaybackState(PlaybackState.PLAYING_EN);
        let enBuffer = sentence.enAudio;
        if (!enBuffer) {
          enBuffer = await generateTTS(sentence.enText, 'en', ctx) || undefined;
          sentence.enAudio = enBuffer;
        }
        if (enBuffer) {
          await playAudio(enBuffer, () => playSentence(index, true));
        } else {
          playSentence(index, true); // Skip to FA if audio fails
        }
      } else {
        setPlaybackState(PlaybackState.PLAYING_FA);
        let faBuffer = sentence.faAudio;
        if (!faBuffer) {
          faBuffer = await generateTTS(sentence.faText, 'fa', ctx) || undefined;
          sentence.faAudio = faBuffer;
        }
        if (faBuffer) {
          await playAudio(faBuffer, () => {
            setCurrentIndex(prev => prev + 1);
            playSentence(index + 1, false);
          });
        } else {
          setCurrentIndex(prev => prev + 1);
          playSentence(index + 1, false);
        }
      }
    } catch (error) {
      console.error(error);
      setPlaybackState(PlaybackState.IDLE);
    }
  }, [chapter, playAudio]);

  const handlePlayToggle = () => {
    if (playbackState === PlaybackState.IDLE || playbackState === PlaybackState.PAUSED) {
      playSentence(currentIndex);
    } else {
      stopPlayback();
      setPlaybackState(PlaybackState.PAUSED);
    }
  };

  const handleNext = () => {
    stopPlayback();
    const nextIdx = Math.min(currentIndex + 1, (chapter?.sentences.length || 1) - 1);
    setCurrentIndex(nextIdx);
    if (playbackState !== PlaybackState.IDLE && playbackState !== PlaybackState.PAUSED) {
      playSentence(nextIdx);
    }
  };

  const handlePrev = () => {
    stopPlayback();
    const prevIdx = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prevIdx);
    if (playbackState !== PlaybackState.IDLE && playbackState !== PlaybackState.PAUSED) {
      playSentence(prevIdx);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-hidden relative flex flex-col items-center">
        {!chapter && playbackState !== PlaybackState.PROCESSING ? (
          <UploadSection onUpload={handleFileUpload} />
        ) : (
          <div className="w-full max-w-4xl h-full flex flex-col p-4 md:p-8">
            {playbackState === PlaybackState.PROCESSING && (
              <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-gray-600 font-medium animate-pulse">
                  {loadingProgress < 50 ? 'Analyzing text and segmenting sentences...' : 'Translating and preparing audiobook...'}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto mb-24 no-scrollbar">
              <BookReader 
                chapter={chapter} 
                currentIndex={currentIndex} 
                playbackState={playbackState} 
                onSelectSentence={(idx) => {
                    stopPlayback();
                    setCurrentIndex(idx);
                }}
              />
            </div>
            
            <ControlPanel 
              playbackState={playbackState}
              currentIndex={currentIndex}
              totalSentences={chapter?.sentences.length || 0}
              onPlayPause={handlePlayToggle}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
