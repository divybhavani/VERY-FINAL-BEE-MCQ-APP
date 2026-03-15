
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { FileText, PenTool, Users, Megaphone, Plus, Trash2, UserX } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Role, Notification } from '../types';

const Dashboard: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ docs: 0, tests: 0, students: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isInitialLoading) {
      timeout = setTimeout(() => setIsTakingLong(true), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isInitialLoading]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject && currentUser) {
        setIsInitialLoading(true);
        try {
          // Fetch data in parallel
          const dataPromise = Promise.all([
            supabaseService.getDocuments(selectedSubject),
            supabaseService.getTests(selectedSubject),
            supabaseService.getNotifications(selectedSubject),
            supabaseService.getUserCount(selectedSubject),
            currentUser.role === Role.ADMIN ? supabaseService.getUsers(selectedSubject) : Promise.resolve([]),
            currentUser.role === Role.ADMIN ? supabaseService.getResults(selectedSubject) : Promise.resolve([])
          ]);

          const [allDocs, fetchedTests, allNotifications, studentCount, fetchedUsers, fetchedResults] = await dataPromise;
          
          setAllTests(fetchedTests);
          if (currentUser.role === Role.ADMIN) {
            setAllUsers(fetchedUsers);
            setAllResults(fetchedResults);
          }

          const filteredDocs = currentUser.role === Role.ADMIN 
            ? allDocs 
            : allDocs.filter(d => d.division === 'ALL' || d.division === currentUser.division);
            
          const filteredTests = currentUser.role === Role.ADMIN 
            ? fetchedTests 
            : fetchedTests.filter(t => t.division === 'ALL' || t.division === currentUser.division);

          const filteredNotifications = currentUser.role === Role.ADMIN
            ? allNotifications
            : allNotifications.filter(n => n.classTarget === 'ALL' || n.classTarget === currentUser.division);

          setStats({
            docs: filteredDocs.length,
            tests: filteredTests.length,
            students: studentCount
          });

          setNotifications(filteredNotifications.sort((a, b) => b.createdAt - a.createdAt));

          // Check for new notifications (last 5 minutes) for toast
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const latest = filteredNotifications.find(n => n.createdAt > fiveMinutesAgo);
          if (latest && currentUser.role !== Role.ADMIN) {
            setActiveToast(latest);
            setTimeout(() => setActiveToast(null), 5000);
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setIsInitialLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedSubject, currentUser]);

  if (!selectedSubject || !currentUser) return null;
  const theme = THEMES[selectedSubject];

  if (isInitialLoading) {
    return (
      <div className="space-y-8 animate-pulse relative">
        {isTakingLong && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-slate-900/90 border border-slate-700 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-sm font-mono text-slate-300">Waking up database... Please wait.</p>
            </div>
          </div>
        )}
        <div className="h-48 rounded-[32px] bg-slate-900/40 border border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-[28px] bg-slate-900/40 border border-white/5" />
          ))}
        </div>
        <div className="grid lg:grid-cols-1 gap-8">
          <div className="h-64 rounded-[32px] bg-slate-900/40 border border-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-[32px] border ${theme.border} bg-slate-900/40 p-8 md:p-12`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${theme.primary} opacity-20 blur-[80px] -translate-y-1/2 translate-x-1/2`} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter mb-2">
              Welcome back, <span className={theme.accent}>{currentUser.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 text-lg">System operational. Here is your current overview.</p>
          </div>
          <div className="flex gap-4">
            <div className={`px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col`}>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Node ID</span>
              <span className="text-white font-mono text-sm">#{currentUser.id.toUpperCase().slice(0, 8)}</span>
            </div>
            <div className={`px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col`}>
              <span className="text-[10px] text-slate-500 font-mono uppercase">Access</span>
              <span className={`font-mono text-sm ${theme.accent}`}>{currentUser.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/documents')}
          className={`p-6 rounded-[28px] bg-slate-900/40 border ${theme.border} flex items-center gap-6 group hover:border-slate-600 transition-colors cursor-pointer`}
        >
          <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${theme.accent}`}>
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">Total Notes</p>
            <p className="text-3xl font-bold text-white">{stats.docs}</p>
          </div>
        </div>
        <div 
          onClick={() => navigate('/tests')}
          className={`p-6 rounded-[28px] bg-slate-900/40 border ${theme.border} flex items-center gap-6 group hover:border-slate-600 transition-colors cursor-pointer`}
        >
          <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${theme.accent}`}>
            <PenTool className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">Active Tests</p>
            <p className="text-3xl font-bold text-white">{stats.tests}</p>
          </div>
        </div>
        <div className={`p-6 rounded-[28px] bg-slate-900/40 border ${theme.border} flex items-center gap-6 group hover:border-slate-600 transition-colors`}>
          <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${theme.accent}`}>
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">System Users</p>
            <p className="text-3xl font-bold text-white">{stats.students}</p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-1 gap-8">
        {/* Latest Announcements */}
        <div className={`rounded-[32px] border ${theme.border} bg-slate-900/40 flex flex-col p-6 overflow-hidden self-start max-h-[350px]`}>
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className={`w-5 h-5 ${theme.accent}`} />
            <h2 className="text-lg font-bold text-white">Latest Comms</h2>
          </div>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {notifications.map(n => (
              <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 ${theme.accent}`}>
                    {n.classTarget === 'ALL' ? 'GENERAL' : n.classTarget}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{n.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                <Megaphone className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-mono uppercase">No active comms</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {activeToast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm p-4 rounded-3xl bg-slate-900 border ${theme.border} shadow-2xl animate-in slide-in-from-bottom-8 duration-500`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${theme.accent}`}>
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{activeToast.title}</p>
              <p className="text-[10px] text-slate-400 truncate">{activeToast.message}</p>
            </div>
            <button onClick={() => setActiveToast(null)} className="text-slate-500 hover:text-white">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
