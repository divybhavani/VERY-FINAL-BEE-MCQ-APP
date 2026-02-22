
import React from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { UserCircle, ShieldCheck, Database, Server } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { currentUser, selectedSubject } = useApp();

  if (!currentUser || !selectedSubject) return null;
  const theme = THEMES[selectedSubject];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className={`relative p-12 rounded-[40px] border ${theme.border} bg-slate-900/40 overflow-hidden`}>
        <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-r ${theme.primary} opacity-20 blur-3xl`} />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className={`w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center text-5xl font-bold text-white border-4 border-black shadow-2xl`}>
              {currentUser.name[0]}
            </div>
            <div className={`absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-br ${theme.primary} flex items-center justify-center border-4 border-black`}>
              {currentUser.role === 'ADMIN' ? <ShieldCheck className="w-5 h-5 text-black" /> : <UserCircle className="w-5 h-5 text-black" />}
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2">{currentUser.name}</h2>
          <div className="flex gap-3 mb-8">
            <span className={`px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest ${theme.accent}`}>
              {currentUser.role}
            </span>
            <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {selectedSubject} TRACK
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-4">
              <h3 className="text-xs font-mono text-slate-500 uppercase flex items-center gap-2">
                <Database className="w-4 h-4" /> Identification Metadata
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">UUID:</span>
                  <span className="text-sm text-white font-mono">{currentUser.id}</span>
                </div>
                {currentUser.role === 'STUDENT' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Roll:</span>
                      <span className="text-sm text-white font-mono">{currentUser.rollNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Div:</span>
                      <span className="text-sm text-white font-mono">{currentUser.division}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Year:</span>
                  <span className="text-sm text-white font-mono">{currentUser.year}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-4">
              <h3 className="text-xs font-mono text-slate-500 uppercase flex items-center gap-2">
                <Server className="w-4 h-4" /> System Permissions
              </h3>
              <div className="space-y-2">
                {currentUser.role === 'ADMIN' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Full DB Management
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Result Export Authorization
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Admin Module v3.1
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Read-only Doc Access
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Active Test Participation
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Personal Score Tracking
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button className={`w-full py-4 mt-8 rounded-2xl font-bold uppercase text-sm tracking-widest ${theme.button}`}>
            Update Security Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
