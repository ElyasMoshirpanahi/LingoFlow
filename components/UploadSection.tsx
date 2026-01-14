import React, { useState } from 'react';

interface UploadSectionProps {
  onUpload: (text: string) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onUpload }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onUpload(inputText);
    }
  };

  const handleExampleLoad = () => {
    const example = "Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man who had hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time spying on the neighbors.";
    setInputText(example);
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mt-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome to LingoFlow</h2>
        <p className="text-slate-500">Transform any English text into a bilingual Persian audiobook experience.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
            Enter or Paste English Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-64 p-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none text-lg text-slate-700 leading-relaxed"
            placeholder="Once upon a time..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex-1 bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            Generate Bilingual Audiobook
          </button>
          <button
            type="button"
            onClick={handleExampleLoad}
            className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
          >
            Try Example
          </button>
        </div>
      </form>
    </div>
  );
};

// Fixed: Added default export
export default UploadSection;
