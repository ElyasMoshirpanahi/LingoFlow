import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlaybackState, Sentence, Chapter, Book, Definition } from './types';
import { processText, generateTTS, getWordDefinition } from './services/gemini';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import BookReader from './components/BookReader';
import UploadSection from './components/UploadSection';
import VocabularyModal from './components/VocabularyModal';

type ViewState = 'UPLOAD' | 'LIBRARY' | 'READER';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('UPLOAD');
  const [library, setLibrary] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [defLoading, setDefLoading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const preloadQueueRef = useRef<Set<number>>(new Set());

  // Persistence: Load Library
  useEffect(() => {
    const saved = localStorage.getItem('lingoflow_vault_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLibrary(parsed);
        if (parsed.length > 0) setView('LIBRARY');
      } catch (e) {
        console.error("Vault decryption error", e);
      }
    }
  }, []);

  // Persistence: Save Library
  useEffect(() => {
    if (library.length > 0) {
      localStorage.setItem('lingoflow_vault_v2', JSON.stringify(library));
    }
  }, [library]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleFileUpload = async (text: string, sourceLang: string, targetLang: string, title?: string) => {
    setPlaybackState(PlaybackState.PROCESSING);
    setLoadingProgress(10);
    setView('READER');
    
    try {
      const processed = await processText(text, sourceLang, targetLang);
      setLoadingProgress(100);
      
      const sentences: Sentence[] = processed.map((item, index) => ({
        id: index,
        enText: item.en,
        faText: item.fa
      }));

      const newBook: Book = {
        id: Date.now().toString(),
        title: title || (text.slice(0, 30).trim() + "..."),
        sourceLang,
        targetLang,
        createdAt: Date.now(),
        chapters: [{ id: '1', title: 'Chapter 1', sentences }]
      };

      setLibrary(prev => [newBook, ...prev]);
      setActiveBook(newBook);
      setCurrentIndex(0);
      setPlaybackState(PlaybackState.IDLE);
    } catch (error) {
      console.error(error);
      setPlaybackState(PlaybackState.IDLE);
      setView('UPLOAD');
      alert("Neural Processing Fault. Check API connection.");
    }
  };

  const stopPlayback = useCallback(() => {
    if (activeSourceRef.current) {
      activeSourceRef.current.onended = null;
      activeSourceRef.current.stop();
      activeSourceRef.current = null;
    }
  }, []);

  const playAudio = useCallback(async (buffer: AudioBuffer, onEnd: () => void) => {
    initAudioContext();
    const ctx = audioContextRef.current!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackSpeed;
    source.connect(ctx.destination);
    source.onended = onEnd;
    source.start(0);
    activeSourceRef.current = source;
  }, [playbackSpeed]);

  const preloadSentence = useCallback(async (index: number) => {
    if (!activeBook || index >= activeBook.chapters[currentChapterIdx].sentences.length || preloadQueueRef.current.has(index)) {
      return;
    }

    const sentences = activeBook.chapters[currentChapterIdx].sentences;
    const sentence = sentences[index];
    if (sentence.enAudio && sentence.faAudio) return;

    preloadQueueRef.current.add(index);
    initAudioContext();
    const ctx = audioContextRef.current!;

    try {
      if (!sentence.enAudio) {
        sentence.enAudio = await generateTTS(sentence.enText, activeBook.sourceLang, ctx) || undefined;
      }
      if (!sentence.faAudio) {
        sentence.faAudio = await generateTTS(sentence.faText, activeBook.targetLang, ctx) || undefined;
      }
    } catch (e) {
      console.warn("Neural Buffer Miss", index);
    } finally {
      preloadQueueRef.current.delete(index);
    }
  }, [activeBook, currentChapterIdx]);

  const playSentence = useCallback(async (index: number, isTranslation: boolean = false) => {
    if (!activeBook || index >= activeBook.chapters[currentChapterIdx].sentences.length) {
      setPlaybackState(PlaybackState.IDLE);
      return;
    }

    const sentences = activeBook.chapters[currentChapterIdx].sentences;
    const sentence = sentences[index];
    initAudioContext();
    const ctx = audioContextRef.current!;

    // Pre-warm the next 2 vectors
    preloadSentence(index + 1);
    preloadSentence(index + 2);

    try {
      if (!isTranslation) {
        setPlaybackState(PlaybackState.PLAYING_EN);
        let enBuffer = sentence.enAudio;
        if (!enBuffer) {
          enBuffer = await generateTTS(sentence.enText, activeBook.sourceLang, ctx) || undefined;
          sentence.enAudio = enBuffer;
        }
        if (enBuffer) {
          await playAudio(enBuffer, () => playSentence(index, true));
        } else {
          playSentence(index, true); // Fallback if audio fails
        }
      } else {
        setPlaybackState(PlaybackState.PLAYING_FA);
        let faBuffer = sentence.faAudio;
        if (!faBuffer) {
          faBuffer = await generateTTS(sentence.faText, activeBook.targetLang, ctx) || undefined;
          sentence.faAudio = faBuffer;
        }
        if (faBuffer) {
          await playAudio(faBuffer, () => {
            const nextIdx = index + 1;
            setCurrentIndex(nextIdx);
            playSentence(nextIdx, false);
          });
        } else {
          const nextIdx = index + 1;
          setCurrentIndex(nextIdx);
          playSentence(nextIdx, false);
        }
      }
    } catch (error) {
      console.error(error);
      setPlaybackState(PlaybackState.IDLE);
    }
  }, [activeBook, currentChapterIdx, playAudio, preloadSentence]);

  const handlePlayToggle = useCallback(() => {
    if (playbackState === PlaybackState.IDLE || playbackState === PlaybackState.PAUSED) {
      playSentence(currentIndex);
    } else {
      stopPlayback();
      setPlaybackState(PlaybackState.PAUSED);
    }
  }, [playbackState, currentIndex, playSentence, stopPlayback]);

  const handleNext = useCallback(() => {
    stopPlayback();
    const total = activeBook?.chapters[currentChapterIdx].sentences.length || 1;
    const nextIdx = Math.min(currentIndex + 1, total - 1);
    setCurrentIndex(nextIdx);
    if (playbackState !== PlaybackState.IDLE && playbackState !== PlaybackState.PAUSED) {
      playSentence(nextIdx);
    }
  }, [currentIndex, activeBook, currentChapterIdx, playbackState, playSentence, stopPlayback]);

  const handlePrev = useCallback(() => {
    stopPlayback();
    const prevIdx = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prevIdx);
    if (playbackState !== PlaybackState.IDLE && playbackState !== PlaybackState.PAUSED) {
      playSentence(prevIdx);
    }
  }, [currentIndex, playbackState, playSentence, stopPlayback]);

  const handleWordClick = async (word: string, context: string) => {
    if (!activeBook) return;
    stopPlayback();
    setPlaybackState(PlaybackState.PAUSED);
    setDefLoading(true);
    setDefinition(null);
    try {
      const def = await getWordDefinition(word, context, activeBook.targetLang);
      setDefinition(def);
    } catch (e) {
      alert("Neural Lookup Error.");
    } finally {
      setDefLoading(false);
    }
  };

  // Global Keyboard Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'READER' || definition || defLoading) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, handlePlayToggle, handleNext, handlePrev, definition, defLoading]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden font-sans text-slate-100 selection:bg-sky-500/30">
      <Header currentView={view} setView={setView} />
      
      <main className="flex-1 overflow-hidden relative">
        {view === 'UPLOAD' && (
          <div className="h-full overflow-y-auto flex flex-col items-center p-8 scroll-smooth">
            <UploadSection onUpload={handleFileUpload} />
          </div>
        )}

        {view === 'LIBRARY' && (
          <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto w-full">
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"></span>
              Neural Repository
            </h3>
            {library.length === 0 ? (
              <div className="cyber-card p-16 rounded-3xl text-center border-dashed border-slate-800">
                <p className="text-slate-500 mono uppercase tracking-widest text-xs">No active datasets found</p>
                <button 
                  onClick={() => setView('UPLOAD')}
                  className="mt-6 text-sky-400 font-bold hover:text-white transition-colors text-sm uppercase mono"
                                  >
                                    Initiate_Inbound_Transfer &rarr;
                                  </button>              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 pb-20">
                {library.map(book => (
                  <div 
                    key={book.id}
                    onClick={() => { setActiveBook(book); setView('READER'); setCurrentIndex(0); }}
                    className="cyber-card p-8 rounded-3xl group cursor-pointer hover:border-sky-500/40 hover:bg-slate-900/50 transition-all flex justify-between items-center"
                  >
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors uppercase italic tracking-tight">{book.title}</h4>
                      <div className="flex gap-4 mt-2">
                         <span className="text-[10px] text-slate-500 font-black mono uppercase tracking-widest">
                          {book.sourceLang} → {book.targetLang}
                        </span>
                        <span className="text-[10px] text-sky-500/60 font-black mono uppercase tracking-widest">
                          {book.chapters[0].sentences.length} Lexical_Vectors
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-700 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-inner">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'READER' && (
          <div className="h-full flex flex-col">
            {playbackState === PlaybackState.PROCESSING && (
              <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12">
                <div className="w-48 h-48 relative flex items-center justify-center mb-8">
                  <div className="absolute inset-0 border-2 border-sky-500/10 rounded-full"></div>
                  <div className="absolute inset-0 border-t-2 border-sky-500 rounded-full animate-spin"></div>
                  <div className="text-center">
                    <span className="text-3xl font-black text-white italic tracking-tighter">{loadingProgress}%</span>
                    <p className="text-[9px] text-sky-400 mono font-bold uppercase tracking-widest mt-1">Ingesting</p>
                  </div>
                </div>
                <p className="text-slate-500 mono uppercase tracking-widest text-[10px] animate-pulse">Synchronizing neural linguistic pathways...</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              <BookReader 
                chapter={activeBook?.chapters[currentChapterIdx] || null} 
                currentIndex={currentIndex} 
                playbackState={playbackState} 
                onSelectSentence={(idx) => { stopPlayback(); setCurrentIndex(idx); }}
                onWordClick={handleWordClick}
              />
            </div>
            
            <ControlPanel 
              playbackState={playbackState}
              currentIndex={currentIndex}
              totalSentences={activeBook?.chapters[currentChapterIdx].sentences.length || 0}
              playbackSpeed={playbackSpeed}
              onPlayPause={handlePlayToggle}
              onNext={handleNext}
              onPrev={handlePrev}
              onSpeedChange={setPlaybackSpeed}
            />
          </div>
        )}
      </main>

      <VocabularyModal 
        definition={definition}
        loading={defLoading}
        onClose={() => setDefinition(null)}
      />

      {activeBook && view === 'READER' && (
        <button 
          onClick={() => { stopPlayback(); setView('LIBRARY'); setPlaybackState(PlaybackState.IDLE); }}
          className="fixed top-24 left-8 z-30 p-3 cyber-card rounded-xl text-slate-500 hover:text-sky-400 transition-all border border-slate-800"
          title="Exit to Vault"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default App;