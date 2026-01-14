import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlaybackState, Sentence, Chapter, Book, Definition } from './types.ts';
import { processText, generateTTS, getWordDefinition } from './services/gemini.ts';
import Header from './components/Header.tsx';
import ControlPanel from './components/ControlPanel.tsx';
import BookReader from './components/BookReader.tsx';
import UploadSection from './components/UploadSection.tsx';
import VocabularyModal from './components/VocabularyModal.tsx';

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
  const [isExporting, setIsExporting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const preloadQueueRef = useRef<Set<number>>(new Set());

  // Persistence: Load Library
  useEffect(() => {
    const saved = localStorage.getItem('lingoflow_vault_v3');
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
      localStorage.setItem('lingoflow_vault_v3', JSON.stringify(library));
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
      alert("Neural Processing Fault. Please check your Gemini API key.");
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
    if (!activeBook || index < 0 || index >= activeBook.chapters[currentChapterIdx].sentences.length || preloadQueueRef.current.has(index)) {
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

    // Aggressive preloading
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
          playSentence(index, true); 
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

  const handleNext = useCallback(async () => {
    stopPlayback();
    if (!activeBook) return;
    const total = activeBook.chapters[currentChapterIdx].sentences.length;
    const nextIdx = Math.min(currentIndex + 1, total - 1);
    setCurrentIndex(nextIdx);
    
    // Immediate audio check
    if (playbackState !== PlaybackState.IDLE && playbackState !== PlaybackState.PAUSED) {
      const sentence = activeBook.chapters[currentChapterIdx].sentences[nextIdx];
      if (!sentence.enAudio) {
        setPlaybackState(PlaybackState.PROCESSING);
        await preloadSentence(nextIdx);
      }
      playSentence(nextIdx);
    }
  }, [currentIndex, activeBook, currentChapterIdx, playbackState, playSentence, stopPlayback, preloadSentence]);

  const handlePrev = useCallback(async () => {
    stopPlayback();
    if (!activeBook) return;
    const prevIdx = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prevIdx);
    
    if (playbackState !== PlaybackState.IDLE && playbackState !== PlaybackState.PAUSED) {
      const sentence = activeBook.chapters[currentChapterIdx].sentences[prevIdx];
      if (!sentence.enAudio) {
        setPlaybackState(PlaybackState.PROCESSING);
        await preloadSentence(prevIdx);
      }
      playSentence(prevIdx);
    }
  }, [currentIndex, activeBook, currentChapterIdx, playbackState, playSentence, stopPlayback, preloadSentence]);

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
      alert("Neural Lookup Error. Check API connection.");
    } finally {
      setDefLoading(false);
    }
  };

  const exportBookAudio = async (book: Book) => {
    const confirmExport = window.confirm(`Generate neural audio file for "${book.title}"? This will process all sentences.`);
    if (!confirmExport) return;

    setIsExporting(true);
    initAudioContext();
    const ctx = audioContextRef.current!;
    const allSentences = book.chapters.flatMap(c => c.sentences);
    const audioBuffers: AudioBuffer[] = [];

    try {
      for (let i = 0; i < allSentences.length; i++) {
        const s = allSentences[i];
        const en = s.enAudio || await generateTTS(s.enText, book.sourceLang, ctx);
        const fa = s.faAudio || await generateTTS(s.faText, book.targetLang, ctx);
        if (en) audioBuffers.push(en);
        if (fa) audioBuffers.push(fa);
        setLoadingProgress(Math.round(((i + 1) / allSentences.length) * 100));
      }

      // Concatenate Buffers
      const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
      const mergedBuffer = ctx.createBuffer(1, totalLength, ctx.sampleRate);
      let offset = 0;
      for (const buffer of audioBuffers) {
        mergedBuffer.getChannelData(0).set(buffer.getChannelData(0), offset);
        offset += buffer.length;
      }

      // Export as WAV
      const wavBlob = audioBufferToWav(mergedBuffer);
      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${book.title.replace(/\s+/g, '_')}_Audiobook.wav`;
      link.click();
    } catch (e) {
      alert("Export failed during neural processing.");
    } finally {
      setIsExporting(false);
      setLoadingProgress(0);
    }
  };

  // Helper: Simple WAV conversion
  // Fix: changed variable declarations from const to let where reassignment occurs.
  const audioBufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels = [];
    let i, sample;
    let pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    // write WAVE header
    const writeString = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i)); pos += s.length; };
    
    let p = 0;
    const writeS = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(p + i, s.charCodeAt(i)); p += s.length; };
    writeS("RIFF"); view.setUint32(4, length - 8, true); p = 8;
    writeS("WAVE"); writeS("fmt "); view.setUint32(16, 16, true); p = 20;
    view.setUint16(20, 1, true); view.setUint16(22, numOfChan, true); p = 24;
    view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true); p = 32;
    view.setUint16(32, numOfChan * 2, true); view.setUint16(34, 16, true); p = 36;
    writeS("data"); view.setUint32(40, length - 44, true); p = 44;

    for(i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

    let samplePos = 0;
    while(p < length) {
      for(i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][samplePos]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
        view.setInt16(p, sample, true);
        p += 2;
      }
      samplePos++;
    }

    return new Blob([bufferArray], { type: "audio/wav" });
  };

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
    <div className="flex flex-col h-screen bg-spotify-black overflow-hidden font-sans text-white">
      <Header currentView={view} setView={setView} />
      
      <main className="flex-1 overflow-hidden relative spotify-gradient">
        {view === 'UPLOAD' && (
          <div className="h-full overflow-y-auto flex flex-col items-center p-4 sm:p-8 scroll-smooth">
            <UploadSection onUpload={handleFileUpload} />
          </div>
        )}

        {view === 'LIBRARY' && (
          <div className="h-full overflow-y-auto p-4 sm:p-8 max-w-5xl mx-auto w-full">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">Your Library</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pb-20">
              {library.map(book => (
                <div 
                  key={book.id}
                  className="spotify-card p-4 group cursor-pointer relative"
                  onClick={() => { setActiveBook(book); setView('READER'); setCurrentIndex(0); }}
                >
                  <div className="aspect-square bg-spotify-grey rounded-md mb-4 flex items-center justify-center relative overflow-hidden group">
                    <svg className="w-16 h-16 text-spotify-grey brightness-125" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    <button 
                      onClick={(e) => { e.stopPropagation(); exportBookAudio(book); }}
                      className="absolute bottom-2 right-2 p-3 bg-sky-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all hover:scale-110"
                      title="Export to Audio File"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                  <h4 className="font-bold text-sm line-clamp-1 mb-1">{book.title}</h4>
                  <p className="text-spotify-active text-xs font-medium uppercase tracking-tighter">
                    {book.sourceLang} &bull; {book.chapters[0].sentences.length} Sentences
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'READER' && (
          <div className="h-full flex flex-col">
            {(playbackState === PlaybackState.PROCESSING || isExporting) && (
              <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold mb-2 uppercase tracking-tighter italic">
                  {isExporting ? 'Generating Neural Stream' : 'Calibrating Vector Map'}
                </h3>
                <div className="w-64 h-1 bg-spotify-grey rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div>
                </div>
                <p className="text-spotify-active text-xs font-mono uppercase tracking-[0.2em]">Progress: {loadingProgress}%</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar relative pt-6">
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
              title={activeBook?.title || ""}
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
    </div>
  );
};

export default App;