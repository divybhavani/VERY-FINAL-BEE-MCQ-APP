
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Subject, Role, Division, User } from '../types';
import { THEMES, ADMIN_CREDENTIALS } from '../constants';
import { ArrowLeft, UserCircle, ShieldAlert } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabase';

const LoginPage: React.FC = () => {
  const { selectedSubject, setSelectedSubject, currentUser, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [loginRole, setLoginRole] = useState<Role>(Role.STUDENT);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Student form
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [div, setDiv] = useState<Division>(Division.LIN);
  const [mobileNumber, setMobileNumber] = useState('');

  // Admin form
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');

  if (!selectedSubject) return <Navigate to="/" replace />;

  const theme = THEMES[selectedSubject];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);
    
    try {
      let user: User;

      if (loginRole === Role.STUDENT) {
        if (!name || !roll || !mobileNumber) {
          setIsAuthenticating(false);
          setError("Please fill all fields");
          return;
        }
        if (mobileNumber.length !== 10) {
          setIsAuthenticating(false);
          setError("Mobile number must be exactly 10 digits");
          return;
        }

        const formattedName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
        const trimmedRoll = roll.trim();
        const formattedRoll = trimmedRoll.length === 1 && /^[0-9]$/.test(trimmedRoll) ? `0${trimmedRoll}` : trimmedRoll;
        const studentId = `${selectedSubject}_${div}_${formattedRoll}`.toLowerCase();
        
        // 1. Check if this mobile number is already used by ANY student
        const { data: mobileUsers, error: mobileError } = await supabase
          .from('users')
          .select('id, name')
          .eq('mobile_number', mobileNumber)
          .eq('role', 'STUDENT');
          
        const isMissingColumn = mobileError && (
          (mobileError.message?.includes('mobile_number') && mobileError.message?.includes('schema cache')) ||
          mobileError.message?.includes('column users.mobile_number does not exist') ||
          mobileError.code === '42703'
        );

        if (mobileError && !isMissingColumn) {
          setIsAuthenticating(false);
          let errMsg = mobileError.message || JSON.stringify(mobileError);
          if (errMsg.includes('Failed to fetch')) {
             errMsg = 'Failed to fetch (CORS/Network error). If using Supabase, make sure you have run the database schema SQL to create the tables.';
          }
          setError(`Database error: ${errMsg}`);
          return;
        }

        // 2. Check if the exact student ID already exists
        const { data: existingIdUsers, error: idError } = await supabase
          .from('users')
          .select('*')
          .eq('id', studentId)
          .eq('role', 'STUDENT');

        if (idError) {
          setIsAuthenticating(false);
          let errMsg = idError.message || JSON.stringify(idError);
          if (errMsg.includes('Failed to fetch')) {
             errMsg = 'Failed to fetch (CORS/Network error). Please run the SQL schema in your Supabase dashboard.';
          }
          setError(`Database error: ${errMsg}`);
          return;
        }

        const existingStudent = existingIdUsers && existingIdUsers.length > 0 ? existingIdUsers[0] : null;

        if (existingStudent) {
          // Student with this Roll Number and Division already exists
          
          // Check if name matches (case-insensitive)
          if (existingStudent.name.toLowerCase() !== formattedName.toLowerCase()) {
            setIsAuthenticating(false);
            setError(`Roll number ${formattedRoll} in division ${div} is already registered to a different name.`);
            return;
          }

          // Check if mobile number matches
          if (existingStudent.mobile_number) {
            if (existingStudent.mobile_number !== mobileNumber) {
              setIsAuthenticating(false);
              setError("The mobile number provided does not match the one registered for this student.");
              return;
            }
          } else {
            // Mobile number is null in DB (old user). 
            // Check if the provided mobile number is already taken by someone else
            if (mobileUsers && mobileUsers.length > 0) {
              const belongsToOther = mobileUsers.some(u => u.id !== studentId);
              if (belongsToOther) {
                setIsAuthenticating(false);
                setError("This mobile number is already registered to another student.");
                return;
              }
            }
            
            // Update the mobile number
            existingStudent.mobile_number = mobileNumber;
            supabaseService.addUser(existingStudent).catch(dbError => {
              console.warn("Background sync failed:", dbError);
            });
          }
          
          user = existingStudent;
        } else {
          // New student registration
          
          // Check if mobile number is already taken
          if (mobileUsers && mobileUsers.length > 0) {
            setIsAuthenticating(false);
            setError("This mobile number is already registered to another student.");
            return;
          }
          
          user = {
            id: studentId,
            name: formattedName,
            rollNumber: formattedRoll,
            division: div,
            year: 'FY',
            mobile_number: mobileNumber,
            role: Role.STUDENT,
            subject: selectedSubject
          };
          
          supabaseService.addUser(user).catch(dbError => {
            console.warn("Background sync failed:", dbError);
          });
        }
      } else {
        if (adminId.trim() === ADMIN_CREDENTIALS.id && password.trim() === ADMIN_CREDENTIALS.password) {
          user = {
            id: `admin_${selectedSubject}`,
            name: 'Principal Admin',
            adminId: adminId.trim(),
            year: 'FY',
            role: Role.ADMIN,
            subject: selectedSubject
          };
          // Admin login is hardcoded; DB sync is optional to ensure login always works
          // We don't await this to prevent database issues from blocking admin access
          const { adminId: _, ...dbUser } = user;
          supabaseService.addUser(dbUser as User).catch(err => console.warn("Admin DB sync failed:", err));
        } else {
          setIsAuthenticating(false);
          setError("Invalid Admin Credentials");
          return;
        }
      }

      setCurrentUser(user);
      
      // Small delay to let React state settle and show success state
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || 'Authentication failed. Please check your connection.');
    } finally {
      // Don't set isAuthenticating to false if we are navigating
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center py-12 px-4 overflow-y-auto">
      <div className={`fixed top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.primary} shadow-lg ${theme.glow} z-[100]`} />
      
      <button 
        onClick={() => setSelectedSubject(null)}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5" /> <span className="text-xs uppercase font-bold tracking-widest hidden sm:inline">Back to Subject Select</span>
      </button>

      <div className={`w-full max-w-md bg-slate-900/40 border ${theme.border} rounded-[32px] p-8 backdrop-blur-xl relative z-10`}>
          <div className="flex flex-col items-center mb-8">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.primary} flex items-center justify-center mb-4`}>
              {loginRole === Role.STUDENT ? <UserCircle className="w-10 h-10 text-black" /> : <ShieldAlert className="w-10 h-10 text-black" />}
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{theme.label}</h2>
            <p className="text-slate-400 text-sm">{loginRole === Role.STUDENT ? 'Student Portal Login' : 'System Administration Access'}</p>
          </div>

        {/* Role Toggle */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8 border border-slate-700">
          <button 
            onClick={() => setLoginRole(Role.STUDENT)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginRole === Role.STUDENT ? `bg-gradient-to-r ${theme.primary} text-black` : 'text-slate-400 hover:text-white'}`}
          >
            STUDENT
          </button>
          <button 
            onClick={() => setLoginRole(Role.ADMIN)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginRole === Role.ADMIN ? `bg-gradient-to-r ${theme.primary} text-black` : 'text-slate-400 hover:text-white'}`}
          >
            ADMIN
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono text-center">
              {error}
            </div>
          )}
          {loginRole === Role.STUDENT ? (
            <>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Roll Number</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                    placeholder="e.g. 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Division</label>
                  <select 
                    value={div}
                    onChange={(e) => setDiv(e.target.value as Division)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slate-600 transition-colors appearance-none"
                    required
                  >
                    {Object.values(Division).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Mobile Number</label>
                <input 
                  type="tel" 
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Admin ID</label>
                <input 
                  type="text" 
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                  placeholder="Enter Admin ID"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slate-600 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <button 
            type="submit"
            disabled={isAuthenticating}
            className={`w-full py-4 mt-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${
              isAuthenticating 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : (currentUser ? (selectedSubject === Subject.ELECTRONICS ? 'bg-emerald-500 text-black' : 'bg-yellow-400 text-black') : theme.button)
            }`}
          >
            {isAuthenticating ? 'Authenticating...' : 'AUTHENTICATE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
