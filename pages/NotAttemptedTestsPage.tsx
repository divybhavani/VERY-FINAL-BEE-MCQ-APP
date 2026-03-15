import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEMES } from '../constants';
import { UserX, Trash2 } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { Role } from '../types';

const NotAttemptedTestsPage: React.FC = () => {
  const { selectedSubject, currentUser } = useApp();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [deletedAssignments, setDeletedAssignments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('deleted_assignments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [deletingAssignment, setDeletingAssignment] = useState<{ studentId: string, testId: string, studentName: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSubject && currentUser?.role === Role.ADMIN) {
        try {
          const [usersData, resultsData, testsData] = await Promise.all([
            supabaseService.getUsers(selectedSubject),
            supabaseService.getResults(selectedSubject),
            supabaseService.getTests(selectedSubject)
          ]);
          setAllUsers(usersData);
          setAllResults(resultsData);
          setAllTests(testsData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [selectedSubject, currentUser]);

  if (!selectedSubject || !currentUser || currentUser.role !== Role.ADMIN) return null;
  const theme = THEMES[selectedSubject];

  const handleDeleteAssignment = () => {
    if (deletingAssignment) {
      const newDeleted = [...deletedAssignments, `${deletingAssignment.studentId}-${deletingAssignment.testId}`];
      setDeletedAssignments(newDeleted);
      localStorage.setItem('deleted_assignments', JSON.stringify(newDeleted));
      setDeletingAssignment(null);
    }
  };

  const notAttemptedTests: any[] = [];
  const students = allUsers.filter(u => u.role === Role.STUDENT);
  allTests.forEach(test => {
    const eligibleStudents = students.filter(s => test.division === 'ALL' || s.division === test.division);
    const attemptedStudentIds = new Set(allResults.filter(r => r.testId === test.id).map(r => r.studentId));
    
    eligibleStudents.forEach(student => {
      if (!attemptedStudentIds.has(student.id) && !deletedAssignments.includes(`${student.id}-${test.id}`)) {
        notAttemptedTests.push({
          student,
          test
        });
      }
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Not Attempted Tests</h2>
          <p className="text-slate-400 text-sm">Monitor students who have not yet taken their assigned tests.</p>
        </div>
      </div>

      <div className={`rounded-[32px] border ${theme.border} bg-slate-900/40 p-8 flex flex-col`}>
        <div className="flex items-center gap-3 mb-6">
          <UserX className={`w-6 h-6 ${theme.accent}`} />
          <h2 className="text-xl font-bold text-white">Pending Assignments</h2>
        </div>
        <div className="overflow-x-auto">
          {notAttemptedTests.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm">
                  <th className="pb-3 font-medium">Student Name</th>
                  <th className="pb-3 font-medium">Roll Number</th>
                  <th className="pb-3 font-medium">Class</th>
                  <th className="pb-3 font-medium">Division</th>
                  <th className="pb-3 font-medium">Test Name</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {notAttemptedTests.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 text-white font-medium">{item.student.name}</td>
                    <td className="py-4 text-slate-300 font-mono">{item.student.rollNumber || 'N/A'}</td>
                    <td className="py-4 text-slate-300">{item.student.year}</td>
                    <td className="py-4 text-slate-300">{item.student.division}</td>
                    <td className="py-4 text-slate-300">{item.test.title}</td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => setDeletingAssignment({ studentId: item.student.id, testId: item.test.id, studentName: item.student.name })}
                        className="p-2 inline-flex rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                        title="Remove Assignment"
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
              <UserX className="w-8 h-8 mb-2" />
              <p className="text-sm font-mono uppercase">No pending assignments found.</p>
            </div>
          )}
        </div>
      </div>

      {deletingAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md bg-slate-900 border ${theme.border} rounded-[32px] p-8 shadow-2xl`}>
            <h3 className="text-xl font-bold text-white mb-2">Remove Assignment</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to remove this student from this test?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingAssignment(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleDeleteAssignment}
                className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                REMOVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotAttemptedTestsPage;
