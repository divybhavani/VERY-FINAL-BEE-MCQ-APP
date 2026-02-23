
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Cpu, Globe } from 'lucide-react';
import { motion } from 'motion/react';

const MKJDLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-1544-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <main className="relative z-10 container mx-auto px-6 pt-32 pb-20 flex flex-col items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold tracking-[0.3em] text-emerald-400 uppercase mb-8">
            <Globe className="w-3 h-3" /> Global Innovation Hub
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8 uppercase">
            MKJD<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-700">TEAMS</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Engineering the future of academic excellence through high-performance digital ecosystems.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/portal')}
              className="group relative px-8 py-4 bg-emerald-500 text-black font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              <span className="relative flex items-center gap-2">
                ENTER PORTAL <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            
            <div className="flex items-center gap-8 text-slate-500">
              <div className="flex flex-col items-center">
                <Shield className="w-5 h-5 mb-1" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Secure</span>
              </div>
              <div className="flex flex-col items-center">
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Fast</span>
              </div>
              <div className="flex flex-col items-center">
                <Cpu className="w-5 h-5 mb-1" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Smart</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Credit */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.4em]">
            © 2026 MKJD TEAMS • ALL RIGHTS RESERVED
          </p>
        </div>
      </main>
    </div>
  );
};

export default MKJDLandingPage;
