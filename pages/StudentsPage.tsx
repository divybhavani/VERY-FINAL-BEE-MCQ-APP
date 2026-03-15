
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { Search, UserCircle, Mail, MapPin, TrendingUp, TrendingDown, Award, Filter, Trash2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { User, Role, Division, Result, Test } from '../types';

const StudentsPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [students, setStudents] = useState<User[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [search, setSearch] = useState('');
  const [filterDiv, setFilterDiv] = useState<Division | 'ALL'>('ALL');
  const [selectedTestId, setSelectedTestId] = useState<string | 'ALL'>('ALL');
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject) {
        try {
          const [allUsers, allResults, allTests] = await Promise.all([
            supabaseService.getUsers(selectedSubject),
            supabaseService.getResults(selectedSubject),
            supabaseService.getTests(selectedSubject)
          ]);
          setStudents(allUsers.filter(u => u.role === Role.STUDENT));
          setResults(allResults);
          setTests(allTests);
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
    let relevantResults = div === 'ALL' ? results : results.filter(r => r.division === div);
    
    if (selectedTestId !== 'ALL') {
      relevantResults = relevantResults.filter(r => r.testId === selectedTestId);
    }

    if (relevantResults.length === 0) return { high: 0, low: 0, highNames: 'N/A', lowNames: 'N/A' };
    
    const scores = relevantResults.map(r => r.score);
    const high = Math.max(...scores);
    const low = Math.min(...scores);

    const highScorers = relevantResults.filter(r => r.score === high).map(r => r.studentName);
    const lowScorers = relevantResults.filter(r => r.score === low).map(r => r.studentName);

    // Deduplicate names
    const uniqueHighNames = Array.from(new Set(highScorers)).join(', ');
    const uniqueLowNames = Array.from(new Set(lowScorers)).join(', ');

    return {
      high,
      low,
      highNames: uniqueHighNames || 'N/A',
      lowNames: uniqueLowNames || 'N/A'
    };
  };

  const overallStats = getStats('ALL');
  const currentDivStats = filterDiv !== 'ALL' ? getStats(filterDiv) : null;

  const handleDeleteStudent = async (id: string) => {
    try {
      const success = await supabaseService.deleteUser(id);
      if (success) {
        setDeleteStatus({ message: "Student and their results deleted successfully.", type: 'success' });
        setStudents(prev => prev.filter(s => s.id !== id));
        setResults(prev => prev.filter(r => r.studentId !== id));
      } else {
        setDeleteStatus({ message: "Failed to delete student.", type: 'error' });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus({ message: "Failed to delete student.", type: 'error' });
    }
    setDeletingStudent(null);
    setTimeout(() => setDeleteStatus(null), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Student Directory</h2>
          <p className="text-slate-400 text-sm">Managing registered learners for the {selectedSubject.toLowerCase()} track.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="appearance-none bg-slate-900/40 border border-slate-800 rounded-2xl pl-10 pr-10 py-3 text-sm font-bold text-white focus:outline-none focus:border-slate-600 cursor-pointer"
            >
              <option value="ALL">All Tests</option>
              {tests.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
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
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
            <Award className="w-4 h-4" /> Overall Highest
          </div>
          <p className="text-3xl font-black text-white">{overallStats.high}</p>
          <p className="text-xs text-slate-400 truncate" title={overallStats.highNames}>{overallStats.highNames}</p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-[10px] font-mono uppercase tracking-widest">
            <TrendingDown className="w-4 h-4" /> Overall Lowest
          </div>
          <p className="text-3xl font-black text-white">{overallStats.low}</p>
          <p className="text-xs text-slate-400 truncate" title={overallStats.lowNames}>{overallStats.lowNames}</p>
        </div>
        {filterDiv !== 'ALL' && currentDivStats && (
          <>
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" /> {filterDiv} Highest
              </div>
              <p className="text-3xl font-black text-white">{currentDivStats.high}</p>
              <p className="text-xs text-slate-400 truncate" title={currentDivStats.highNames}>{currentDivStats.highNames}</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-orange-400 text-[10px] font-mono uppercase tracking-widest">
                <TrendingDown className="w-4 h-4" /> {filterDiv} Lowest
              </div>
              <p className="text-3xl font-black text-white">{currentDivStats.low}</p>
              <p className="text-xs text-slate-400 truncate" title={currentDivStats.lowNames}>{currentDivStats.lowNames}</p>
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
          <div key={student.id} className="relative p-6 rounded-[32px] bg-slate-900/40 border border-white/5 hover:border-slate-700 transition-all flex flex-col items-center text-center group">
            <button 
              onClick={() => setDeletingStudent(student)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20 opacity-0 group-hover:opacity-100"
              title="Delete Student"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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

      {deletingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Delete Student</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete "{deletingStudent.name}"? This will also delete all their test attempts and results. This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingStudent(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={() => handleDeleteStudent(deletingStudent.id)}
                className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteStatus && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-bottom-4 ${
          deleteStatus.type === 'success' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
        }`}>
          {deleteStatus.message}
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
