
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Subject, Role, Division, User } from '../types';
import { THEMES, ADMIN_CREDENTIALS } from '../constants';
import { ArrowLeft, UserCircle, ShieldAlert } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

const LoginPage: React.FC = () => {
  const { selectedSubject, setSelectedSubject, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [loginRole, setLoginRole] = useState<Role>(Role.STUDENT);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Student form
  const [name, setName] = useState('');
  const [roll, setRoll] = useState('');
  const [div, setDiv] = useState<Division>(Division.LIN);

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
        if (!name || !roll) {
          setIsAuthenticating(false);
          setError("Please fill all fields");
          return;
        }
        const formattedName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
        // Include subject in ID to prevent collisions between different modules
        const studentId = `${selectedSubject}_${div}_${roll}`.toLowerCase();
        
        user = {
          id: studentId,
          name: formattedName,
          rollNumber: roll,
          division: div,
          year: 'FY',
          role: Role.STUDENT,
          subject: selectedSubject
        };
        
        try {
          await supabaseService.addUser(user);
        } catch (dbError: any) {
          console.error("Database sync failed:", dbError);
          // If it's a network error or RLS error, we still let them in locally 
          // so they can at least view notes, but warn them.
          if (dbError.message?.includes('policy')) {
            setError("Server sync restricted. Please contact Admin to enable 'users' table RLS policies.");
            setIsAuthenticating(false);
            return;
          }
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
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || 'Authentication failed. Please check your connection.');
    } finally {
      setIsAuthenticating(false);
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
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Year</label>
                  <select disabled className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 text-sm cursor-not-allowed">
                    <option>FY</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1 ml-1">Division</label>
                <div className="flex gap-2">
                  {Object.values(Division).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiv(d)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${div === d ? `bg-white/10 ${theme.accent} border-white/20` : 'bg-transparent border-slate-800 text-slate-500'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
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
            className={`w-full py-4 mt-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${isAuthenticating ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : theme.button}`}
          >
            {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
