
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Subject, User } from './types';
import { AppContext } from './context/AppContext';
import MKJDLandingPage from './pages/MKJDLandingPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NotesPage from './pages/NotesPage';
import MediaPage from './pages/MediaPage';
import TestsPage from './pages/TestsPage';
import ScoresPage from './pages/ScoresPage';
import ProfilePage from './pages/ProfilePage';
import StudentsPage from './pages/StudentsPage';
import TestAttemptsPage from './pages/TestAttemptsPage';
import NotAttemptedTestsPage from './pages/NotAttemptedTestsPage';
import WeakerStudentsPage from './pages/WeakerStudentsPage';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(() => {
    try {
      const saved = localStorage.getItem('spark_subject');
      return saved ? saved as Subject : null;
    } catch (error) {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('spark_session');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("LocalStorage access failed:", error);
      return null;
    }
  });

  useEffect(() => {
    try {
      if (selectedSubject) {
        localStorage.setItem('spark_subject', selectedSubject);
      } else {
        localStorage.removeItem('spark_subject');
      }
    } catch (error) {
      console.warn("Subject persistence failed:", error);
    }
  }, [selectedSubject]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('spark_session', JSON.stringify(currentUser));
        if (currentUser.subject) {
          setSelectedSubject(currentUser.subject);
        }
      } else {
        localStorage.removeItem('spark_session');
      }
    } catch (error) {
      console.warn("LocalStorage update failed:", error);
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
            <Route path="/media" element={<MediaPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/scores" element={<ScoresPage />} />
            <Route path="/test-attempts" element={<TestAttemptsPage />} />
            <Route path="/not-attempted" element={<NotAttemptedTestsPage />} />
            <Route path="/weaker-students" element={<WeakerStudentsPage />} />
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
