import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { ClipboardList, Users, Search, ArrowLeft, User, Trash2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Test, Result, Division, Role } from '../types';

const TestAttemptsPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [deletingResult, setDeletingResult] = useState<Result | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject && currentUser?.role === Role.ADMIN) {
        try {
          const [testsData, resultsData] = await Promise.all([
            supabaseService.getTests(selectedSubject),
            supabaseService.getResults(selectedSubject)
          ]);
          setTests(testsData);
          setResults(resultsData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [selectedSubject, currentUser]);

  if (!selectedSubject || !currentUser || currentUser.role !== Role.ADMIN) return null;
  const theme = THEMES[selectedSubject];

  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(search.toLowerCase())
  );

  const getAttemptStats = (testId: string) => {
    const testResults = results.filter(r => r.testId === testId);
    
    // Get unique students who attempted
    const uniqueStudents = new Set();
    const stats = {
      total: 0,
      [Division.LIN]: 0,
      [Division.WIN]: 0,
      [Division.MAC]: 0
    };

    testResults.forEach(result => {
      if (!uniqueStudents.has(result.studentId)) {
        uniqueStudents.add(result.studentId);
        stats.total++;
        if (result.division) {
          stats[result.division]++;
        }
      }
    });

    return stats;
  };

  const getAttemptDetails = (testId: string) => {
    const testResults = results.filter(r => r.testId === testId);
    
    // Get unique students who attempted
    const uniqueStudentsMap = new Map<string, Result>();
    
    testResults.forEach(result => {
      // If a student has multiple attempts, we just keep the first one we see for the list
      if (!uniqueStudentsMap.has(result.studentId)) {
        uniqueStudentsMap.set(result.studentId, result);
      }
    });

    const students = Array.from(uniqueStudentsMap.values());
    
    return {
      [Division.LIN]: students.filter(s => s.division === Division.LIN),
      [Division.WIN]: students.filter(s => s.division === Division.WIN),
      [Division.MAC]: students.filter(s => s.division === Division.MAC),
    };
  };

  const handleDeleteResult = async (id: string) => {
    try {
      const success = await supabaseService.deleteResult(id);
      if (success) {
        setDeleteStatus({ message: "Attempt deleted successfully.", type: 'success' });
        setResults(prev => prev.filter(r => r.id !== id));
      } else {
        setDeleteStatus({ message: "Failed to delete attempt.", type: 'error' });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus({ message: "Failed to delete attempt.", type: 'error' });
    }
    setDeletingResult(null);
    setTimeout(() => setDeleteStatus(null), 3000);
  };

  if (selectedTestId) {
    const selectedTest = tests.find(t => t.id === selectedTestId);
    if (!selectedTest) return null;
    
    const details = getAttemptDetails(selectedTestId);
    const stats = getAttemptStats(selectedTestId);

    return (
      <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500">
        <button 
          onClick={() => setSelectedTestId(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-sm font-mono uppercase tracking-widest">Back to Tests</span>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <ClipboardList className={`w-8 h-8 ${theme.accent}`} />
              {selectedTest.title}
            </h1>
            <p className="text-slate-400 mt-1 font-mono text-sm">Detailed student participation</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-lg font-black text-white">{stats.total}</span>
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1 ml-1">Total Attempts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LIN Division */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-lg font-bold text-white tracking-widest">LIN</h3>
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-white font-mono text-sm">{stats[Division.LIN]}</span>
            </div>
            <div className="space-y-3">
              {details[Division.LIN].map(student => (
                <div key={student.studentId} className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{student.studentName}</p>
                    <p className="text-xs text-slate-400 font-mono">Roll: {student.rollNumber}</p>
                  </div>
                  <button 
                    onClick={() => setDeletingResult(student)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20 shrink-0"
                    title="Delete Attempt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {details[Division.LIN].length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                  <p className="text-xs text-slate-500 font-mono">No attempts</p>
                </div>
              )}
            </div>
          </div>

          {/* WIN Division */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-lg font-bold text-white tracking-widest">WIN</h3>
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-white font-mono text-sm">{stats[Division.WIN]}</span>
            </div>
            <div className="space-y-3">
              {details[Division.WIN].map(student => (
                <div key={student.studentId} className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{student.studentName}</p>
                    <p className="text-xs text-slate-400 font-mono">Roll: {student.rollNumber}</p>
                  </div>
                  <button 
                    onClick={() => setDeletingResult(student)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20 shrink-0"
                    title="Delete Attempt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {details[Division.WIN].length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                  <p className="text-xs text-slate-500 font-mono">No attempts</p>
                </div>
              )}
            </div>
          </div>

          {/* MAC Division */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-lg font-bold text-white tracking-widest">MAC</h3>
              <span className="px-3 py-1 rounded-lg bg-slate-800 text-white font-mono text-sm">{stats[Division.MAC]}</span>
            </div>
            <div className="space-y-3">
              {details[Division.MAC].map(student => (
                <div key={student.studentId} className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{student.studentName}</p>
                    <p className="text-xs text-slate-400 font-mono">Roll: {student.rollNumber}</p>
                  </div>
                  <button 
                    onClick={() => setDeletingResult(student)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20 shrink-0"
                    title="Delete Attempt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {details[Division.MAC].length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                  <p className="text-xs text-slate-500 font-mono">No attempts</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {deletingResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
              <h3 className="text-xl font-bold text-white mb-2">Delete Attempt</h3>
              <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete the attempt for "{deletingResult.studentName}"? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingResult(null)}
                  className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => handleDeleteResult(deletingResult.id)}
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
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ClipboardList className={`w-8 h-8 ${theme.accent}`} />
            Test Attempts
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-sm">Monitor student participation across divisions</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-slate-600 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map(test => {
          const stats = getAttemptStats(test.id);
          
          return (
            <div 
              key={test.id} 
              onClick={() => setSelectedTestId(test.id)}
              className={`p-6 rounded-[32px] bg-slate-900/40 border ${theme.border} hover:bg-slate-800/40 transition-all group cursor-pointer`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-white transition-colors">
                  {test.title}
                </h3>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${
                  test.division === 'ALL' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                    : `bg-slate-800 text-slate-300 border-slate-700`
                }`}>
                  {test.division}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-2xl font-black text-white">{stats.total}</span>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-mono mt-1">Total Students</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-xs font-bold text-slate-300 tracking-widest">LIN</span>
                  <span className="text-sm font-mono text-white">{stats[Division.LIN]}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-xs font-bold text-slate-300 tracking-widest">WIN</span>
                  <span className="text-sm font-mono text-white">{stats[Division.WIN]}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-xs font-bold text-slate-300 tracking-widest">MAC</span>
                  <span className="text-sm font-mono text-white">{stats[Division.MAC]}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTests.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px]">
            <p className="text-slate-600 font-mono text-sm">NO TESTS FOUND</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAttemptsPage;
