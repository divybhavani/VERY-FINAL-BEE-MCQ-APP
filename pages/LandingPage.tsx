
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Subject } from '../types';
import { Zap, Cpu, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { THEMES } from '../constants';

const LandingPage: React.FC = () => {
  const { setSelectedSubject } = useApp();
  const navigate = useNavigate();

  const handleSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-yellow-400/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-purple-900/10 blur-[150px]" />

      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5" /> Back to MKJD
      </button>

      <div className="relative z-10 w-full max-w-6xl text-center mb-16">
        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 uppercase">
          MKJD ACADEMIC PORTAL
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Choose your specialization to access the next generation of academic intelligence.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
        {/* Electrical Card */}
        <button 
          onClick={() => handleSelect(Subject.ELECTRICAL)}
          className="group relative h-[400px] overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/40 p-1 transition-all hover:scale-[1.02] hover:border-yellow-500/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full w-full rounded-[36px] bg-slate-950 p-10 flex flex-col items-center justify-between text-center border border-white/5">
            <div className="p-6 rounded-3xl bg-blue-600/10 group-hover:bg-yellow-400/10 transition-colors border border-white/5">
              <Zap className="w-16 h-16 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3 text-white">Electrical Module</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Master power generation, transmission, and high-voltage systems with industrial-grade tools.
              </p>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-yellow-400 font-bold group-hover:bg-yellow-400 group-hover:text-black transition-all">
              ENTER SYSTEM <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* Electronics Card */}
        <button 
          onClick={() => handleSelect(Subject.ELECTRONICS)}
          className="group relative h-[400px] overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/40 p-1 transition-all hover:scale-[1.02] hover:border-cyan-500/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full w-full rounded-[36px] bg-slate-950 p-10 flex flex-col items-center justify-between text-center border border-white/5">
            <div className="p-6 rounded-3xl bg-green-600/10 group-hover:bg-cyan-400/10 transition-colors border border-white/5">
              <Cpu className="w-16 h-16 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3 text-white">Electronics Module</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Explore micro-circuitry, digital logic, and semiconductor physics through a futuristic lens.
              </p>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-cyan-400 font-bold group-hover:bg-cyan-400 group-hover:text-black transition-all">
              ENTER SYSTEM <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 text-slate-500 text-xs font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> SECURE ACADEMIC GATEWAY v3.1.0
        </div>
        <div className="tracking-[0.2em] opacity-50 uppercase">Copyright by MKJD TEAMS</div>
      </div>
    </div>
  );
};

export default LandingPage;
