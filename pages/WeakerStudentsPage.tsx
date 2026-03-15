import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Role } from '../types';

const WeakerStudentsPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [allResults, setAllResults] = useState<any[]>([]);
  const [deletingResult, setDeletingResult] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject && currentUser?.role === Role.ADMIN) {
        try {
          const resultsData = await supabaseService.getResults(selectedSubject);
          setAllResults(resultsData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [selectedSubject, currentUser]);

  if (!selectedSubject || !currentUser || currentUser.role !== Role.ADMIN) return null;
  const theme = THEMES[selectedSubject];

  const handleDeleteResult = async () => {
    if (deletingResult) {
      try {
        await supabaseService.deleteResult(deletingResult.id);
        setAllResults(prev => prev.filter(r => r.id !== deletingResult.id));
        setDeletingResult(null);
      } catch (error) {
        console.error("Failed to delete result:", error);
      }
    }
  };

  const weakerStudents: any[] = [];
  allResults.forEach(result => {
    const percentage = (result.score / result.totalQuestions) * 100;
    if (percentage < 40) {
      weakerStudents.push({
        ...result,
        percentage
      });
    }
  });
  weakerStudents.sort((a, b) => a.percentage - b.percentage);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Weaker Students</h2>
          <p className="text-slate-400 text-sm">Monitor students scoring below 40% in assessments.</p>
        </div>
      </div>

      <div className={`rounded-[32px] border ${theme.border} bg-slate-900/40 p-8 flex flex-col`}>
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className={`w-6 h-6 text-rose-400`} />
          <h2 className="text-xl font-bold text-white">Needs Attention</h2>
        </div>
        <div className="overflow-x-auto">
          {weakerStudents.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm">
                  <th className="pb-3 font-medium">Student Name</th>
                  <th className="pb-3 font-medium">Roll Number</th>
                  <th className="pb-3 font-medium">Division</th>
                  <th className="pb-3 font-medium">Test Name</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Percentage</th>
                  <th className="pb-3 font-medium">Attempt Date</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {weakerStudents.map((result, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 text-white font-medium">{result.studentName}</td>
                    <td className="py-4 text-slate-300 font-mono">{result.rollNumber}</td>
                    <td className="py-4 text-slate-300">{result.division}</td>
                    <td className="py-4 text-slate-300">{result.testTitle}</td>
                    <td className="py-4 text-rose-400 font-bold">{result.score}/{result.totalQuestions}</td>
                    <td className="py-4 text-slate-300 font-mono">{Math.round(result.percentage)}%</td>
                    <td className="py-4 text-slate-400">
                      {new Date(result.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => setDeletingResult(result)}
                        className="p-2 inline-flex rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                        title="Delete Result"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600 opacity-40">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p className="text-sm font-mono uppercase">No students found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Result Modal */}
      {deletingResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Delete Result</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete this test result? This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingResult(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleDeleteResult}
                className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeakerStudentsPage;
