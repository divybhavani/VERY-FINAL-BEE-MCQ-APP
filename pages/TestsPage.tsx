
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { PenTool, Plus, CheckCircle, FileSpreadsheet, Trash2, Clock } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Test, Role, Question, Result, Division } from '../types';
import { deterministicShuffle } from '../utils/shuffle';

const TestsPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showScore, setShowScore] = useState<Result | null>(null);
  const [deletingItem, setDeletingItem] = useState<Test | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Creation form
  const [testTitle, setTestTitle] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [testDivision, setTestDivision] = useState<Division | 'ALL'>('ALL');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [shuffleEnabled, setShuffleEnabled] = useState<boolean>(false);
  const [shuffleOptionsEnabled, setShuffleOptionsEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject) {
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
  }, [selectedSubject]);

  useEffect(() => {
    if (activeTest && activeTest.timeLimit) {
      setTimeLeft(activeTest.timeLimit * 60);
    } else {
      setTimeLeft(null);
    }
  }, [activeTest]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && activeTest) {
      submitTest();
    }
  }, [timeLeft]);

  if (!selectedSubject || !currentUser) return null;
  const theme = THEMES[selectedSubject];

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      if (!testTitle) {
        setTestTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle) return alert("Enter test title");
    if (!excelFile) return alert("Please select an Excel file to import questions");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Use the requested sheet_to_json approach for cleaner mapping
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];

        if (jsonData.length === 0) {
          alert("Excel file is empty or missing data rows.");
          return;
        }

        const baseTestId = Math.random().toString(36).substr(2, 9);
        let testId = baseTestId;
        if (shuffleEnabled) testId += '_S';
        if (shuffleOptionsEnabled) testId += '_O';
        const questions: Question[] = [];

        // Helper to find value by case-insensitive header match
        const getRowValue = (row: any, possibleHeaders: string[]) => {
          const keys = Object.keys(row);
          const normalizedPossible = possibleHeaders.map(h => h.toLowerCase().trim());
          
          for (const key of keys) {
            const normalizedKey = key.toLowerCase().trim();
            if (normalizedPossible.includes(normalizedKey)) {
              return String(row[key] || '').trim();
            }
          }
          return '';
        };

        jsonData.forEach((row) => {
          const qText = getRowValue(row, ['Question', 'Q', 'Question Text']);
          if (!qText) return;

          const imageUrl = getRowValue(row, ['Image URL', 'Image', 'Image Link']);

          questions.push({
            id: Math.random().toString(36).substr(2, 9),
            testId,
            question: qText,
            image_url: imageUrl ? imageUrl : undefined,
            option_a: getRowValue(row, ['Option A', 'A', 'Choice A']),
            option_b: getRowValue(row, ['Option B', 'B', 'Choice B']),
            option_c: getRowValue(row, ['Option C', 'C', 'Choice C']),
            option_d: getRowValue(row, ['Option D', 'D', 'Choice D']),
            correct_answer: getRowValue(row, ['Correct Answer', 'Answer', 'Correct']).toUpperCase() as 'A' | 'B' | 'C' | 'D',
            bloom_level: getRowValue(row, ["Bloom's Level", "Bloom's Le", "Blooms Level", "Bloom Level", "Level"]) || 'N/A'
          });
        });

        if (questions.length === 0) {
          alert("No valid questions found. Please check your Excel headers: Question, Image URL, Option A, Option B, Option C, Option D, Correct Answer, Bloom's Le");
          return;
        }

        const newTest: Test = {
          id: testId,
          title: testTitle,
          subject: selectedSubject,
          division: testDivision,
          createdBy: currentUser.name,
          questions: questions,
          timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
          createdAt: Date.now()
        };

        await supabaseService.addTest(newTest);

        // Create notification
        await supabaseService.addNotification({
          id: Math.random().toString(36).substr(2, 9),
          title: 'New Test Available',
          message: `"${testTitle}" is now open for assessment.`,
          subject: selectedSubject,
          classTarget: testDivision,
          createdAt: Date.now()
        });

        const updatedTests = await supabaseService.getTests(selectedSubject);
        setTests(updatedTests);
        setTestTitle('');
        setExcelFile(null);
        setShuffleEnabled(false);
        setShuffleOptionsEnabled(false);
        setIsCreating(false);
        alert(`Successfully imported ${questions.length} questions.`);
      } catch (error) {
        console.error("Error parsing Excel:", error);
        alert("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.");
      }
    };
    reader.readAsBinaryString(excelFile);
  };

  const submitTest = async () => {
    if (!activeTest) return;

    // Check if all questions are answered, but bypass if time is up
    const unansweredCount = activeTest.questions.filter(q => !answers[q.id]).length;
    if (unansweredCount > 0 && timeLeft !== 0) {
      alert(`Please answer all questions before submitting. You have ${unansweredCount} unanswered question(s) remaining.`);
      return;
    }

    let score = 0;
    const attempts = activeTest.questions.map(q => {
      const selected = answers[q.id] || '';
      const isCorrect = selected === q.correct_answer;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        questionText: q.question,
        imageUrl: q.image_url,
        selectedAnswer: selected,
        correctAnswer: q.correct_answer,
        isCorrect,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d
        }
      };
    });

    const result: Result = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: currentUser.id,
      studentName: currentUser.name,
      rollNumber: currentUser.rollNumber || '000',
      division: currentUser.division || 'LIN' as any,
      testId: activeTest.id,
      testTitle: activeTest.title,
      subject: selectedSubject,
      score,
      totalQuestions: activeTest.questions.length,
      attempts,
      submittedAt: Date.now()
    };

    try {
      await supabaseService.addResult(result);
      setShowScore(result);
      setActiveTest(null);
      setAnswers({});
      setResults(prev => [result, ...prev]);
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test results.");
    }
  };

  const handleDelete = async (id: string, division?: Division | 'ALL') => {
    try {
      const success = await supabaseService.deleteTest(id, division);
      if (success) {
        setDeleteStatus({ message: "Item deleted successfully.", type: 'success' });
        setTests(prev => {
          if (!division || division === 'ALL') {
            return prev.filter(t => t.id !== id);
          }
          return prev.filter(t => !(t.id === id && t.division === division));
        });
      } else {
        setDeleteStatus({ message: "No record found for selected class.", type: 'error' });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteStatus({ message: "Failed to delete item.", type: 'error' });
    }
    setDeletingItem(null);
    setTimeout(() => setDeleteStatus(null), 3000);
  };

  const filteredTests = tests.filter(t => {
    return currentUser.role === Role.ADMIN || t.division === 'ALL' || t.division === currentUser.division;
  });

  const startTest = (test: Test) => {
    let questions = [...test.questions];
    
    const isShuffleEnabled = test.id.includes('_S');
    
    // Apply deterministic shuffle if enabled and user is a student
    if (isShuffleEnabled && currentUser.role === Role.STUDENT) {
      const seedString = `${currentUser.id}*${test.id}`;
      questions = deterministicShuffle(questions, seedString);
    }

    setActiveTest({ ...test, questions });
  };

  if (showScore) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
        <div className={`p-8 md:p-12 rounded-[40px] border ${theme.border} bg-slate-900/40 backdrop-blur-xl mb-8`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${theme.primary} flex items-center justify-center mb-6 md:mx-0 mx-auto shadow-2xl ${theme.glow}`}>
                <CheckCircle className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Assessment Complete</h2>
              <p className="text-slate-400 uppercase tracking-widest text-xs font-mono">{showScore.testTitle}</p>
            </div>
            
            <div className="flex items-center gap-12">
              <div className="text-center">
                <p className="text-5xl font-black text-white">{showScore.score}</p>
                <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Score</p>
              </div>
              <div className="w-[1px] h-16 bg-slate-800" />
              <div className="text-center">
                <p className="text-5xl font-black text-slate-500">{showScore.totalQuestions}</p>
                <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Total</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-12">
          <h3 className="text-xl font-bold text-white px-4">Detailed Review</h3>
          {showScore.attempts.map((attempt, idx) => {
            const currentTest = tests.find(t => t.id === showScore.testId);
            const bloomLevel = currentTest?.questions.find(q => q.id === attempt.questionId)?.bloom_level || 'N/A';
            
            return (
              <div key={attempt.questionId} className={`p-8 rounded-[32px] bg-slate-900/40 border ${attempt.isCorrect ? 'border-emerald-500/20' : 'border-rose-500/20'} transition-all`}>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Side: Question & Options (70%) */}
                  <div className="flex-1 md:w-[70%] space-y-6">
                    <div className="flex gap-4">
                      <span className={`w-12 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${attempt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        Q{idx + 1}
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
                    
                    {(() => {
                      const isShuffleOptionsEnabled = showScore.testId.includes('_O');
                        let optionsArr = ['A', 'B', 'C', 'D'].map(key => ({
                          key,
                          text: attempt.options[key as keyof typeof attempt.options]
                        }));

                        if (isShuffleOptionsEnabled && currentUser.role === Role.STUDENT) {
                          const seedString = `${currentUser.id}*${showScore.testId}*${attempt.questionId}`;
                          optionsArr = deterministicShuffle(optionsArr, seedString);
                        }

                        const labels = ['A', 'B', 'C', 'D'];
                        const getRenderedLabel = (originalKey: string) => {
                          const index = optionsArr.findIndex(o => o.key === originalKey);
                          return index !== -1 ? labels[index] : originalKey;
                        };

                        return (
                          <>
                            <div className="space-y-3">
                              {labels.map((label, index) => {
                                const optObj = optionsArr[index];
                                const originalKey = optObj.key;
                                const value = optObj.text;
                                const isSelected = attempt.selectedAnswer === originalKey;
                                const isCorrect = attempt.correctAnswer === originalKey;
                                
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
                                  <div key={label} className={`p-4 rounded-2xl border ${borderColor} ${bgColor} flex items-center gap-4`}>
                                    <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${borderColor} ${textColor}`}>{label}</span>
                                    <span className={`text-sm font-medium ${textColor}`}>{value}</span>
                                    {isSelected && (
                                      <span className="ml-auto text-[10px] font-mono uppercase opacity-60">Your Choice</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex flex-wrap gap-4 pt-4">
                              <div className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest border ${attempt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                Your Answer: {attempt.selectedAnswer ? getRenderedLabel(attempt.selectedAnswer) : 'None'}
                              </div>
                              {currentUser.role === Role.ADMIN && (
                                <div className="px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                  Correct Answer: {getRenderedLabel(attempt.correctAnswer)}
                                </div>
                              )}
                              <div className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 ${attempt.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {attempt.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                  </div>

                  {/* Right Side: Bloom's Level (30%) */}
                  <div className="md:w-[30%] flex flex-col items-center md:items-end justify-start pt-2">
                    <div className={`px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 shadow-lg`}>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Bloom:</span>
                      <span className={`text-xs font-bold ${theme.accent}`}>{bloomLevel}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => setShowScore(null)}
          className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl ${theme.button}`}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (activeTest) {
    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-2xl font-black text-white uppercase">{activeTest.title}</h2>
            <p className="text-slate-400 text-sm">Attempting {selectedSubject.toLowerCase()} module test</p>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${timeLeft < 60 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse' : 'bg-slate-900/40 border border-slate-800 text-white'}`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
            )}
            <button 
              onClick={() => {
                setActiveTest(null);
                setAnswers({});
                setTimeLeft(null);
              }}
              className="px-6 py-3 rounded-2xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {activeTest.questions.map((q, idx) => (
            <div key={q.id} className="p-8 rounded-[32px] bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Side: Question & Options (70%) */}
                <div className="flex-1 md:w-[70%] space-y-6">
                  <div className="flex gap-4">
                    <span className={`w-12 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold ${theme.accent} border border-white/5 shrink-0`}>
                      Q{idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-lg text-white font-medium">{q.question}</p>
                      {q.image_url && (
                        <div className="mt-4">
                          <img src={q.image_url} alt="Question Image" className="max-w-full h-auto rounded-xl border border-white/10 max-h-64 object-contain bg-black/20" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {(() => {
                      const isShuffleOptionsEnabled = activeTest.id.includes('_O');
                      let optionsArr = ['A', 'B', 'C', 'D'].map(opt => ({
                        key: opt,
                        text: q[`option_${opt.toLowerCase()}` as keyof Question] as string
                      }));

                      if (isShuffleOptionsEnabled && currentUser.role === Role.STUDENT) {
                        const seedString = `${currentUser.id}*${activeTest.id}*${q.id}`;
                        optionsArr = deterministicShuffle(optionsArr, seedString);
                      }

                      const labels = ['A', 'B', 'C', 'D'];
                      return labels.map((label, index) => {
                        const optObj = optionsArr[index];
                        const originalKey = optObj.key;
                        const isSelected = answers[q.id] === originalKey;
                        return (
                          <button
                            key={label}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: originalKey }))}
                            className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center gap-4 ${isSelected ? `bg-white/10 ${theme.border} ${theme.accent}` : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-600'}`}
                          >
                            <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${isSelected ? `border-white/20 bg-white/10` : 'border-slate-700'}`}>{label}</span>
                            <span className="text-sm font-medium">{optObj.text}</span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right Side: Bloom's Level (30%) */}
                <div className="md:w-[30%] flex flex-col items-center md:items-end justify-start pt-2">
                  <div className={`px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 shadow-lg`}>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Bloom:</span>
                    <span className={`text-xs font-bold ${theme.accent}`}>{q.bloom_level || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-4">
          <div className="flex justify-between items-center px-4">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Progress</span>
            <span className={`text-xs font-bold ${theme.accent}`}>
              {activeTest.questions.filter(q => answers[q.id]).length} / {activeTest.questions.length} Answered
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${theme.primary} transition-all duration-500`}
              style={{ width: `${(activeTest.questions.filter(q => answers[q.id]).length / activeTest.questions.length) * 100}%` }}
            />
          </div>
          <button 
            onClick={submitTest}
            className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
              activeTest.questions.every(q => answers[q.id]) 
                ? theme.button 
                : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-80'
            }`}
          >
            {activeTest.questions.every(q => answers[q.id]) 
              ? 'Submit Final Answers' 
              : `Complete ${activeTest.questions.length - activeTest.questions.filter(q => answers[q.id]).length} More to Submit`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Examination Center</h2>
          <p className="text-slate-400 text-sm">Review available assessments and monitor progress.</p>
        </div>
        {currentUser.role === Role.ADMIN && (
          <button 
            onClick={() => setIsCreating(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${theme.button}`}
          >
            <Plus className="w-5 h-5" /> CREATE TEST
          </button>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">Test Configurator</h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Test Designation</label>
                <input 
                  type="text" 
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-slate-600 outline-none"
                  placeholder="Mid-Sem Unit Test"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Target Class</label>
                <div className="grid grid-cols-4 gap-2">
                  {['ALL', ...Object.values(Division)].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTestDivision(d as any)}
                      className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${testDivision === d ? `bg-white/10 ${theme.accent} border-white/20` : 'bg-transparent border-slate-800 text-slate-500'}`}
                    >
                      {d === 'ALL' ? 'ALL CLASS' : d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-500 uppercase mb-1">Timer (Minutes)</label>
                <input 
                  type="number" 
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-slate-600 outline-none"
                  placeholder="e.g. 30 (Leave blank for no limit)"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                <div>
                  <p className="text-sm font-bold text-white">Shuffle Questions</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Per Student Attempt</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShuffleEnabled(!shuffleEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${shuffleEnabled ? theme.button : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${shuffleEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                <div>
                  <p className="text-sm font-bold text-white">Auto Shuffle Options</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Randomize A, B, C, D</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShuffleOptionsEnabled(!shuffleOptionsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${shuffleOptionsEnabled ? theme.button : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${shuffleOptionsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center bg-black/40">
                <FileSpreadsheet className={`w-10 h-10 mx-auto mb-2 ${excelFile ? theme.accent : 'text-slate-600'}`} />
                <p className="text-xs text-slate-500">
                  {excelFile ? excelFile.name : 'Auto-convert Excel to Question Bank'}
                </p>
                <input 
                  type="file" 
                  className="hidden" 
                  id="excel-upload" 
                  accept=".xlsx, .xls" 
                  onChange={handleExcelChange}
                />
                <label htmlFor="excel-upload" className={`inline-block mt-4 text-[10px] font-bold uppercase tracking-widest cursor-pointer ${theme.accent} hover:underline`}>
                  {excelFile ? 'Change File' : 'Select File'}
                </label>
              </div>
              <button type="submit" className={`w-full py-4 rounded-xl font-bold mt-4 shadow-xl ${theme.button}`}>INITIALIZE TEST</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map(test => {
          const hasSubmitted = currentUser.role === Role.STUDENT && results.some(r => r.testId === test.id && r.studentId === currentUser.id);
          
          return (
          <div key={test.id} className="p-8 rounded-[32px] bg-slate-900/40 border border-white/5 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-4 rounded-2xl bg-white/5 ${theme.accent}`}>
                <PenTool className="w-6 h-6" />
              </div>
              {currentUser.role === Role.ADMIN && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingItem(test);
                  }} 
                  className="p-2 text-red-500/50 hover:text-red-500 transition-colors bg-red-500/10 rounded-lg"
                  title="Delete Test"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">{test.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] font-mono text-slate-300 uppercase">
                  {test.division === 'ALL' ? 'ALL CLASSES' : `DIV ${test.division}`}
                </span>
                <p className="text-xs text-slate-500 font-mono uppercase">BY PROF. {test.createdBy.split(' ')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono mb-8">
              <span className="flex items-center gap-1"><PenTool className="w-3 h-3" /> {test.questions.length} Qs</span>
              {test.timeLimit && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.timeLimit} Min</span>}
            </div>
            <button 
              onClick={() => {
                if (!hasSubmitted) startTest(test);
              }}
              disabled={hasSubmitted}
              className={`w-full py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${hasSubmitted ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : theme.button}`}
            >
              {currentUser.role === Role.ADMIN ? 'Manage Questions' : (hasSubmitted ? 'Already Submitted' : 'Start Assessment')}
            </button>
          </div>
        )})}
        {filteredTests.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[40px]">
            <p className="text-slate-600 font-mono text-sm">NO TESTS REGISTERED IN DATABASE</p>
          </div>
        )}
      </div>

      {deletingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Delete this item from:</h3>
            <p className="text-slate-400 text-sm mb-6">Select the class scope for deletion of "{deletingItem.title}"</p>
            
            <div className="grid grid-cols-1 gap-3 mb-8">
              {Object.values(Division).map(div => (
                <button
                  key={div}
                  onClick={() => handleDelete(deletingItem.id, div)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-white font-bold hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                >
                  {div} ONLY
                </button>
              ))}
              <button
                onClick={() => handleDelete(deletingItem.id, 'ALL')}
                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
              >
                ALL CLASSES
              </button>
            </div>
            
            <button 
              onClick={() => setDeletingItem(null)}
              className="w-full py-3 text-slate-500 font-bold hover:text-white transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {deleteStatus && (
        <div className={`fixed bottom-8 right-8 z-[300] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-500 ${deleteStatus.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          <p className="font-bold text-sm uppercase tracking-widest">{deleteStatus.message}</p>
        </div>
      )}
    </div>
  );
};

export default TestsPage;
