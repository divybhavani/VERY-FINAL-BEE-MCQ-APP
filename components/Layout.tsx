
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MENU_ITEMS, THEMES } from '../constants';
import { Menu, X, Terminal } from 'lucide-react';
import { Subject } from '../types';

const Layout: React.FC = () => {
  const { currentUser, selectedSubject, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser || !selectedSubject) return <Navigate to="/" replace />;

  const theme = THEMES[selectedSubject];
  const activeItem = MENU_ITEMS.find(item => location.pathname.includes(item.id));
  const activeId = activeItem?.id || 'dashboard';
  const activeLabel = activeItem?.label || 'Dashboard';

  const handleNav = (id: string) => {
    if (id === 'logout') {
      logout();
      navigate('/');
    } else {
      navigate(`/${id}`);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 bg-slate-900/40 border-r ${theme.border} backdrop-blur-xl z-50 transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.primary} shadow-lg ${theme.glow}`}>
              {theme.icon}
            </div>
            <span className="font-bold tracking-tight text-white uppercase">{theme.shortLabel}</span>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {MENU_ITEMS.filter(item => item.roles.includes(currentUser.role)).map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? `bg-gradient-to-r ${theme.primary} text-black shadow-lg ${theme.glow}` 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className={`m-4 p-4 rounded-xl bg-slate-800/50 border ${theme.border}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                {currentUser.name[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className={`h-16 flex items-center justify-between px-6 bg-slate-900/40 border-b ${theme.border} backdrop-blur-xl shrink-0`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-white capitalize">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-300 uppercase">Status: Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
