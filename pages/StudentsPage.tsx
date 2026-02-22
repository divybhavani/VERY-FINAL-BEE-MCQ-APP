
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { Search, UserCircle, Mail, MapPin, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { User, Role, Division, Result } from '../types';

const StudentsPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [students, setStudents] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState('');
  const [filterDiv, setFilterDiv] = useState<Division | 'ALL'>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject) {
        try {
          const [allUsers, allResults] = await Promise.all([
            supabaseService.getUsers(selectedSubject),
            supabaseService.getResults(selectedSubject)
          ]);
          setStudents(allUsers.filter(u => u.role === Role.STUDENT));
          setResults(allResults);
        } catch (error) {
          console.error("Error fetching students data:", error);
        }
      }
    };
    fetchData();
  }, [selectedSubject]);

  if (!selectedSubject || !currentUser || currentUser.role !== Role.ADMIN) return null;
  const theme = THEMES[selectedSubject];

  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.includes(search);
    const matchesDiv = filterDiv === 'ALL' || s.division === filterDiv;
    return matchesSearch && matchesDiv;
  });

  const getStats = (div: Division | 'ALL') => {
    const relevantResults = div === 'ALL' ? results : results.filter(r => r.division === div);
    if (relevantResults.length === 0) return { high: 0, low: 0 };
    const scores = relevantResults.map(r => r.score);
    return {
      high: Math.max(...scores),
      low: Math.min(...scores)
    };
  };

  const overallStats = getStats('ALL');
  const currentDivStats = filterDiv !== 'ALL' ? getStats(filterDiv) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Student Directory</h2>
          <p className="text-slate-400 text-sm">Managing registered learners for the {selectedSubject.toLowerCase()} track.</p>
        </div>
        
        <div className="flex bg-slate-900/40 border border-slate-800 p-1 rounded-2xl overflow-hidden shrink-0">
          {['ALL', ...Object.values(Division)].map(d => (
            <button
              key={d}
              onClick={() => setFilterDiv(d as any)}
              className={`px-6 py-3 text-xs font-bold rounded-xl transition-all ${filterDiv === d ? `bg-white/10 ${theme.accent}` : 'text-slate-500 hover:text-white'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
            <Award className="w-4 h-4" /> Overall Highest
          </div>
          <p className="text-3xl font-black text-white">{overallStats.high}</p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-[10px] font-mono uppercase tracking-widest">
            <TrendingDown className="w-4 h-4" /> Overall Lowest
          </div>
          <p className="text-3xl font-black text-white">{overallStats.low}</p>
        </div>
        {filterDiv !== 'ALL' && currentDivStats && (
          <>
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" /> {filterDiv} Highest
              </div>
              <p className="text-3xl font-black text-white">{currentDivStats.high}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-orange-400 text-[10px] font-mono uppercase tracking-widest">
                <TrendingDown className="w-4 h-4" /> {filterDiv} Lowest
              </div>
              <p className="text-3xl font-black text-white">{currentDivStats.low}</p>
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Lookup student by database index..."
          className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:border-slate-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(student => (
          <div key={student.id} className="p-6 rounded-[32px] bg-slate-900/40 border border-white/5 hover:border-slate-700 transition-all flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-full bg-slate-800 mb-4 flex items-center justify-center text-2xl font-bold text-white border-4 border-black group-hover:border-slate-700`}>
              {student.name[0]}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{student.name}</h3>
            <div className="flex gap-2 mb-4">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-black border border-white/5 ${theme.accent}`}>ROLL: {student.rollNumber}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black border border-white/5 text-slate-400">DIV: {student.division}</span>
            </div>
            <div className="w-full pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Mail className="w-3 h-3" /> student-{student.id.slice(0, 4)}@spark.edu
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3 h-3" /> Campus A, Lab {student.division === 'MAC' ? '04' : '02'}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-600 font-mono text-sm italic">
            NO STUDENT RECORDS MATCHING THE QUERY
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;
