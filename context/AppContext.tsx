
import React, { createContext, useContext } from 'react';
import { Subject, User } from '../types';

export interface AppContextType {
  selectedSubject: Subject | null;
  setSelectedSubject: (s: Subject | null) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
