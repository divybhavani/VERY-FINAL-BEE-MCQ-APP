
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { Search, BarChart3, UserCheck, History, Eye, CheckCircle, Trash2, ArrowLeft, Download } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Result, Division, Role, User } from '../types';

const ScoresPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [results, setResults] = useState<Result[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filterDiv, setFilterDiv] = useState<Division | 'ALL'>('ALL');
  const [viewingResult, setViewingResult] = useState<Result | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [deletingResult, setDeletingResult] = useState<Result | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (selectedSubject) {
        try {
          const [data, usersData] = await Promise.all([
            supabaseService.getResults(selectedSubject),
            supabaseService.getUsers(selectedSubject)
          ]);
          setResults(data);
          setUsers(usersData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchResults();
  }, [selectedSubject]);

  if (!selectedSubject || !currentUser) return null;
  const theme = THEMES[selectedSubject];

  const isAdmin = currentUser.role === Role.ADMIN;

  const filteredResults = results.filter(r => {
    // Student Access Control: Only see their own marks
    if (!isAdmin && r.studentId !== currentUser.id) return false;

    // Admin Filters (Search and Division)
    if (isAdmin) {
      const matchesSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) || r.rollNumber.includes(search);
      const matchesDiv = filterDiv === 'ALL' || r.division === filterDiv;
      return matchesSearch && matchesDiv;
    }
    
    return true; // Student sees all their own records
  });

  const handleDeleteResult = async (id: string) => {
    try {
      const success = await supabaseService.deleteResult(id);
      if (success) {
        setDeleteStatus({ message: "Result deleted successfully.", type: 'success' });
        setResults(prev => prev.filter(r => r.id !== id));
      } else {
        setDeleteStatus({ message: "Failed to delete result.", type: 'error' });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus({ message: "Failed to delete result.", type: 'error' });
    }
    setDeletingResult(null);
    setTimeout(() => setDeleteStatus(null), 3000);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const success = await supabaseService.deleteUser(id);
      if (success) {
        setDeleteStatus({ message: "Student deleted successfully.", type: 'success' });
        setUsers(prev => prev.filter(u => u.id !== id));
        setResults(prev => prev.filter(r => r.studentId !== id));
      } else {
        setDeleteStatus({ message: "Failed to delete student.", type: 'error' });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus({ message: "Failed to delete student.", type: 'error' });
    }
    setDeletingUser(null);
    setTimeout(() => setDeleteStatus(null), 3000);
  };

  const handleExportExcel = () => {
    const headers = ['Roll Number', 'Name', 'Class', 'Test Title', 'Score', 'Total Questions', 'Percentage', 'Status', 'Submission Date', 'Submission Time'];
    
    const csvData = filteredResults.map(res => {
      const perc = Math.round((res.score / res.totalQuestions) * 100);
      const status = perc >= 40 ? 'Qualified' : 'Requires Review';
      const date = new Date(res.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const time = new Date(res.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      return [
        res.rollNumber,
        `"${res.studentName}"`,
        res.division,
        `"${res.testTitle}"`,
        res.score,
        res.totalQuestions,
        `${perc}%`,
        status,
        `"${date}"`,
        `"${time}"`
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedSubject}_Performance_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (viewingResult) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
        <button 
          onClick={() => setViewingResult(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-sm font-mono uppercase tracking-widest">Back to History</span>
        </button>

        <div className={`p-8 md:p-12 rounded-[40px] border ${theme.border} bg-slate-900/40 backdrop-blur-xl mb-8`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${theme.primary} flex items-center justify-center mb-6 md:mx-0 mx-auto shadow-2xl ${theme.glow}`}>
                <BarChart3 className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2">{viewingResult.testTitle}</h2>
              <p className="text-slate-400 uppercase tracking-widest text-xs font-mono">
                {isAdmin ? `Student: ${viewingResult.studentName}` : 'Assessment Performance'}
              </p>
            </div>
            
            <div className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-5xl font-black text-white">{viewingResult.score}</p>
                <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Score</p>
              </div>
              <div className="w-[1px] h-16 bg-slate-800" />
              <div className="text-center">
                <p className="text-5xl font-black text-slate-500">{viewingResult.totalQuestions}</p>
                <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Total</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white px-4">Question Breakdown</h3>
          {viewingResult.attempts?.map((attempt, idx) => (
            <div key={attempt.questionId} className={`p-8 rounded-[32px] bg-slate-900/40 border ${attempt.isCorrect ? 'border-emerald-500/20' : 'border-rose-500/20'} space-y-6`}>
              <div className="flex gap-4">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${attempt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-lg text-white font-medium">{attempt.questionText}</p>
                  {attempt.imageUrl && (
                    <div className="mt-4">
                      <img src={attempt.imageUrl} alt="Question Image" className="max-w-full h-auto rounded-xl border border-white/10 max-h-64 object-contain bg-black/20" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bloom's Level Indicator */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-fit">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cognitive Level:</span>
                <span className={`text-xs font-bold ${theme.accent}`}>{(attempt as any).bloomLevel || (attempt as any).bloom_level || 'N/A'}</span>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(attempt.options).map(([key, value]) => {
                  const isSelected = attempt.selectedAnswer === key;
                  const isCorrect = attempt.correctAnswer === key;
                  
                  let borderColor = 'border-slate-800';
                  let bgColor = 'bg-transparent';
                  let textColor = 'text-slate-400';
                  
                  if (isCorrect) {
                    borderColor = 'border-emerald-500';
                    bgColor = 'bg-emerald-500/10';
                    textColor = 'text-emerald-400';
                  } else if (isSelected && !isCorrect) {
                    borderColor = 'border-rose-500';
                    bgColor = 'bg-rose-500/10';
                    textColor = 'text-rose-400';
                  }

                  return (
                    <div key={key} className={`p-4 rounded-2xl border ${borderColor} ${bgColor} flex items-center gap-3`}>
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${borderColor} ${textColor}`}>{key}</span>
                      <span className={`text-sm ${textColor}`}>{value}</span>
                      {isSelected && (
                        <span className="ml-auto text-[10px] font-mono uppercase opacity-60">Selected</span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className={`px-6 py-3 rounded-xl text-xs font-mono uppercase tracking-widest flex items-center gap-2 ${attempt.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {attempt.isCorrect ? (
                  <><CheckCircle className="w-4 h-4" /> Correct Response</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> {isAdmin ? `Incorrect - Correct Answer was ${attempt.correctAnswer}` : 'Incorrect Response'}</>
                )}
              </div>
            </div>
          ))}
          {(!viewingResult.attempts || viewingResult.attempts.length === 0) && (
            <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-[32px]">
              <p className="text-slate-500 font-mono text-sm">Detailed attempt data not available for this record.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isAdmin ? 'Performance Analytics' : 'My Assessment History'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isAdmin 
              ? 'Aggregate student scores and submission reports.' 
              : `Review your past ${selectedSubject.toLowerCase()} module test results.`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleExportExcel}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${theme.button}`}
          >
            <Download className="w-5 h-5" /> EXPORT TO EXCEL
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between p-1 bg-slate-900/40 border border-slate-800 rounded-2xl w-fit">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'list' ? `bg-white/10 ${theme.accent}` : 'text-slate-500 hover:text-white'}`}
            >
              Result List
            </button>
            <button 
              onClick={() => setViewMode('analytics')}
              className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'analytics' ? `bg-white/10 ${theme.accent}` : 'text-slate-500 hover:text-white'}`}
            >
              Performance Grid
            </button>
          </div>

          {viewMode === 'list' ? (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or roll number..."
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-12 py-4 text-sm text-white focus:outline-none focus:border-slate-600"
                />
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
          ) : (
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <select 
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-slate-600 appearance-none"
                >
                  <option value="">Select a test to analyze performance...</option>
                  {Array.from(new Set(results.map(r => r.testId))).map(id => {
                    const testTitle = results.find(r => r.testId === id)?.testTitle;
                    return <option key={id} value={id}>{testTitle}</option>;
                  })}
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
          )}
        </div>
      )}

      {(!isAdmin || viewMode === 'list') ? (
        <div className={`overflow-x-auto rounded-[32px] border ${theme.border} bg-slate-900/40 backdrop-blur-xl`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                {isAdmin && (
                  <th className="px-8 py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Student Identity
                  </th>
                )}
                {isAdmin && <th className="px-8 py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Roll / Div</th>}
                <th className="px-8 py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Test Title</th>
                <th className="px-8 py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Raw Score</th>
                <th className="px-8 py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Submitted At</th>
                <th className="px-8 py-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredResults.sort((a, b) => b.submittedAt - a.submittedAt).map(res => {
                const perc = Math.round((res.score / res.totalQuestions) * 100);
                const date = new Date(res.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                const time = new Date(res.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <tr key={res.id} className="hover:bg-white/5 transition-colors group">
                    {isAdmin && (
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white`}>
                            {res.studentName[0]}
                          </div>
                          <span className="text-sm font-medium text-white">{res.studentName}</span>
                        </div>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-8 py-5 text-sm font-mono text-slate-400">
                        <span className="text-white">#{res.rollNumber}</span> / {res.division}
                      </td>
                    )}
                    <td className="px-8 py-5 text-sm text-slate-300">
                      {!isAdmin ? (
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white`}>
                            <History className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-sm font-medium text-white">{res.testTitle}</span>
                        </div>
                      ) : (
                        res.testTitle
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${theme.accent}`}>{res.score}</span>
                        <span className="text-xs text-slate-600">/ {res.totalQuestions}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="w-full max-w-[80px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${theme.primary}`} 
                            style={{ width: `${perc}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{perc >= 40 ? 'Qualified' : 'Requires Review'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm text-white">{date}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setViewingResult(res)}
                          className={`p-2 rounded-lg bg-white/5 border border-white/10 ${theme.accent} hover:bg-white/10 transition-all`}
                          title="Review Attempt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => setDeletingResult(res)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                            title="Delete Result"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredResults.length === 0 && (
            <div className="py-20 text-center">
              <UserCheck className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
              <p className="text-slate-600 font-mono text-sm uppercase tracking-widest">
                {isAdmin ? 'Zero Submissions Captured' : 'No recorded assessments found'}
              </p>
            </div>
          )}
        </div>
      ) : isAdmin ? (
        <div className={`overflow-x-auto rounded-[32px] border ${theme.border} bg-slate-900/40 backdrop-blur-xl p-8`}>
          {!selectedTestId ? (
            <div className="py-20 text-center">
              <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
              <p className="text-slate-600 font-mono text-sm uppercase tracking-widest">Select a test above to view detailed performance grid</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Performance Matrix</h3>
                  <p className="text-slate-500 text-xs font-mono uppercase">Individual student selections per question</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-rose-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Incorrect</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-900 z-10">Student Name</th>
                      <th className="px-4 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Roll</th>
                      {results.find(r => r.testId === selectedTestId)?.attempts.map((_, i) => (
                        <th key={i} className="px-4 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Q{i+1}</th>
                      ))}
                      <th className="px-4 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results
                      .filter(r => r.testId === selectedTestId && (filterDiv === 'ALL' || r.division === filterDiv))
                      .sort((a, b) => a.studentName.localeCompare(b.studentName))
                      .map(res => (
                        <tr key={res.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 text-sm font-medium text-white sticky left-0 bg-slate-900 z-10 border-r border-slate-800">{res.studentName}</td>
                          <td className="px-4 py-4 text-xs font-mono text-slate-400">#{res.rollNumber}</td>
                          {res.attempts.map((att, i) => (
                            <td key={i} className="px-2 py-4 text-center">
                              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border ${att.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                {att.selectedAnswer || '-'}
                              </div>
                            </td>
                          ))}
                          <td className="px-4 py-4 text-center">
                            <span className={`text-sm font-bold ${theme.accent}`}>{res.score}/{res.totalQuestions}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Weaker Students & Not Attempted Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Weaker Students Section */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-rose-400" />
                    Weaker Students (Score &lt; 40%)
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {(() => {
                      const testResults = results.filter(r => r.testId === selectedTestId && (filterDiv === 'ALL' || r.division === filterDiv));
                      const weakerStudents = testResults.filter(r => (r.score / r.totalQuestions) < 0.4).sort((a, b) => a.score - b.score);
                      
                      if (weakerStudents.length === 0) {
                        return <p className="text-sm text-slate-500 font-mono">No weaker students found.</p>;
                      }

                      return weakerStudents.map(res => (
                        <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                          <div>
                            <p className="text-sm font-medium text-white">{res.studentName}</p>
                            <p className="text-xs text-slate-400 font-mono">#{res.rollNumber} • {res.division}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-rose-400">{res.score}/{res.totalQuestions}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-mono">{Math.round((res.score / res.totalQuestions) * 100)}%</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Not Attempted Section */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-slate-400" />
                    Test Not Attempted
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {(() => {
                      const testResults = results.filter(r => r.testId === selectedTestId && (filterDiv === 'ALL' || r.division === filterDiv));
                      const attemptedStudentIds = new Set(testResults.map(r => r.studentId));
                      const notAttemptedStudents = users.filter(u => 
                        u.role === Role.STUDENT && 
                        (filterDiv === 'ALL' || u.division === filterDiv) && 
                        !attemptedStudentIds.has(u.id)
                      ).sort((a, b) => a.name.localeCompare(b.name));

                      if (notAttemptedStudents.length === 0) {
                        return <p className="text-sm text-slate-500 font-mono">All students have attempted this test.</p>;
                      }

                      return notAttemptedStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                          <div>
                            <p className="text-sm font-medium text-white">{student.name}</p>
                            <p className="text-xs text-slate-400 font-mono">#{student.rollNumber || 'N/A'} • {student.division}</p>
                          </div>
                          <button 
                            onClick={() => setDeletingUser(student)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {deletingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Delete Student</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete the student "{deletingUser.name}"? This will remove their account and all their results. This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={() => handleDeleteUser(deletingUser.id)}
                className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Delete Result</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete the result for "{deletingResult.studentName}" on "{deletingResult.testTitle}"? This action cannot be undone.</p>
            
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
};

export default ScoresPage;
