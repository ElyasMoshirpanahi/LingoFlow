import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

interface UploadSectionProps {
  onUpload: (text: string, sourceLang: string, targetLang: string, title?: string) => void;
}

const LANGUAGES = ['English', 'Persian', 'Spanish', 'French', 'German'];

const UploadSection: React.FC<UploadSectionProps> = ({ onUpload }) => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Persian');
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onUpload(inputText, sourceLang, targetLang);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  const handleFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
    
    setIsExtracting(true);
    try {
      if (fileName.endsWith('.pdf')) {
        const text = await extractTextFromPDF(file);
        if (text) {
          onUpload(text, sourceLang, targetLang, cleanTitle);
        } else {
          alert('Could not extract text from this PDF.');
        }
      } else if (
        fileName.endsWith('.txt') || 
        fileName.endsWith('.md') || 
        fileName.endsWith('.json')
      ) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          onUpload(text, sourceLang, targetLang, cleanTitle);
        };
        reader.readAsText(file);
      } else {
        alert('Format not supported.');
      }
    } catch (error) {
      alert('Neural extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-spotify-light p-8 rounded-2xl shadow-2xl border border-white/5">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center shadow-2xl shadow-sky-500/20 mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 italic tracking-tighter uppercase">Ingest Neural Data</h2>
          <p className="text-spotify-active text-xs font-bold uppercase tracking-[0.2em]">Map New Lexical Vectors</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-spotify-active uppercase tracking-widest pl-1">Primary Lexicon</label>
              <select 
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full bg-spotify-grey p-3 rounded-lg text-sm font-bold border-none outline-none appearance-none cursor-pointer hover:brightness-110 transition-all"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-spotify-active uppercase tracking-widest pl-1">Target Synapse</label>
              <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-spotify-grey p-3 rounded-lg text-sm font-bold border-none outline-none appearance-none cursor-pointer hover:brightness-110 transition-all"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-12 transition-all text-center cursor-pointer group ${
              isDragging ? 'border-sky-500 bg-sky-500/5' : 'border-white/10 hover:border-white/20'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isExtracting && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden" 
              accept=".pdf,.txt,.md,.json"
            />
            <p className="text-white font-bold text-sm group-hover:text-sky-400 transition-colors">
              {isExtracting ? 'PARSING DATA...' : 'Upload PDF or Text'}
            </p>
            <p className="text-spotify-active text-[10px] mt-2 font-medium">Drag and drop files here</p>
          </div>

          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 bg-spotify-grey p-4 rounded-xl text-white text-sm outline-none resize-none placeholder:text-spotify-active transition-all focus:ring-1 focus:ring-sky-500/50"
              placeholder="Paste raw text for immediate processing..."
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isExtracting}
            className="w-full bg-white text-black font-black py-4 rounded-full text-sm uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 shadow-xl"
          >
            Initialize Connection
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadSection;