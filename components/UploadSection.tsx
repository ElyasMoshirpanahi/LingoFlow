import React, { useState, useRef } from 'react';

interface UploadSectionProps {
  onUpload: (text: string, sourceLang: string, targetLang: string, title?: string) => void;
}

const LANGUAGES = ['English', 'Persian', 'Spanish', 'French', 'German'];

const UploadSection: React.FC<UploadSectionProps> = ({ onUpload }) => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Persian');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onUpload(inputText, sourceLang, targetLang);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onUpload(text, sourceLang, targetLang, file.name.replace('.txt', ''));
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .txt file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-2xl cyber-card rounded-3xl p-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-sky-500/10 rounded-2xl mb-4 border border-sky-500/20">
          <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">INGEST CONTENT</h2>
        <p className="text-slate-500 text-sm mono">Select parameters for neural translation & synthesis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mono">Source Lexicon</label>
            <select 
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition-all mono text-xs"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mono">Target Neural Net</label>
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition-all mono text-xs"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${
            isDragging ? 'border-sky-500 bg-sky-500/5' : 'border-slate-800 hover:border-slate-700'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden" 
            accept=".txt"
          />
          <div className="text-center cursor-pointer">
            <p className="text-slate-400 text-sm mb-1 font-bold">Drop text file here or <span className="text-sky-400 underline">browse</span></p>
            <p className="text-[10px] text-slate-600 mono uppercase">Encrypted Local Processing</p>
          </div>
        </div>

        <div className="relative">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mono mb-2">Direct Buffer Input</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-32 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 focus:ring-1 focus:ring-sky-500 outline-none transition-all resize-none text-slate-300 mono text-xs leading-relaxed"
            placeholder="[SYSTEM_WAITING_FOR_DATA]"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-full cyber-bg-blue text-white font-black py-4 px-8 rounded-2xl shadow-lg hover:brightness-110 hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-widest text-sm italic"
        >
          Execute Neural Processing
        </button>
      </form>
    </div>
  );
};

export default UploadSection;