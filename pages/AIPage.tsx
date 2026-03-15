import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { Sparkles, Send, Terminal } from 'lucide-react';
import { askGemini } from '../services/geminiService';

const AIPage: React.FC = () => {
  const { selectedSubject } = useApp();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  if (!selectedSubject) return null;
  const theme = THEMES[selectedSubject];

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsLoadingAi(true);
    const res = await askGemini(aiPrompt, selectedSubject);
    setAiResponse(res || '');
    setIsLoadingAi(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <div className={`rounded-[32px] border ${theme.border} bg-slate-900/40 p-8 flex flex-col flex-1 min-h-0`}>
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <Sparkles className={`w-6 h-6 ${theme.accent}`} />
          <h2 className="text-xl font-bold text-white">AI Subject Co-Pilot</h2>
        </div>
        
        <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-6 mb-4 overflow-y-auto custom-scrollbar">
          {aiResponse ? (
            <div className="prose prose-invert prose-sm text-slate-300 max-w-none">
              {aiResponse}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
              <Terminal className="w-10 h-10 opacity-20" />
              <p className="text-sm font-mono uppercase tracking-widest opacity-40">Ready for terminal query...</p>
            </div>
          )}
        </div>

        <form onSubmit={handleAskAi} className="relative shrink-0">
          <input 
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={`Ask anything about ${selectedSubject.toLowerCase()} principles...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 pr-16 text-sm text-white focus:outline-none focus:border-slate-600"
          />
          <button 
            disabled={isLoadingAi}
            className={`absolute right-2 top-2 bottom-2 w-12 rounded-xl flex items-center justify-center transition-all ${isLoadingAi ? 'bg-slate-800 text-slate-500' : theme.button}`}
          >
            {isLoadingAi ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIPage;
