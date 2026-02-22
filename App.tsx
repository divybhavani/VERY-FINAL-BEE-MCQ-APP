
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Subject, User } from './types';
import { AppContext } from './context/AppContext';
import MKJDLandingPage from './pages/MKJDLandingPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NotesPage from './pages/NotesPage';
import TestsPage from './pages/TestsPage';
import ScoresPage from './pages/ScoresPage';
import ProfilePage from './pages/ProfilePage';
import StudentsPage from './pages/StudentsPage';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('spark_session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('spark_session', JSON.stringify(currentUser));
      setSelectedSubject(currentUser.subject);
    } else {
      localStorage.removeItem('spark_session');
    }
  }, [currentUser]);

  const logout = () => {
    setCurrentUser(null);
    setSelectedSubject(null);
  };

  return (
    <AppContext.Provider value={{ selectedSubject, setSelectedSubject, currentUser, setCurrentUser, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MKJDLandingPage />} />
          <Route path="/portal" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<NotesPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/scores" element={<ScoresPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
