
import React from 'react';
import { Subject } from './types';
import { 
  Zap, 
  Cpu, 
  LayoutDashboard, 
  FileText, 
  PenTool, 
  Users, 
  BarChart3, 
  UserCircle, 
  LogOut 
} from 'lucide-react';

export const THEMES = {
  [Subject.ELECTRICAL]: {
    primary: 'from-blue-600 to-yellow-400',
    accent: 'text-yellow-400',
    bg: 'bg-blue-950/20',
    glow: 'shadow-yellow-500/20',
    border: 'border-yellow-500/30',
    button: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    label: 'Electrical Module',
    shortLabel: 'ELECTRICAL'
  },
  [Subject.ELECTRONICS]: {
    primary: 'from-green-600 to-cyan-400',
    accent: 'text-cyan-400',
    bg: 'bg-green-950/20',
    glow: 'shadow-cyan-500/20',
    border: 'border-cyan-500/30',
    button: 'bg-cyan-500 hover:bg-cyan-600 text-black',
    icon: <Cpu className="w-8 h-8 text-cyan-400" />,
    label: 'Electronics Module',
    shortLabel: 'ELECTRONICS'
  }
};

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT', 'ADMIN'] },
  { id: 'documents', label: 'Notes', icon: FileText, roles: ['STUDENT', 'ADMIN'] },
  { id: 'tests', label: 'Tests', icon: PenTool, roles: ['STUDENT', 'ADMIN'] },
  { id: 'scores', label: 'Performance', icon: BarChart3, roles: ['STUDENT', 'ADMIN'] },
  { id: 'students', label: 'Students', icon: Users, roles: ['ADMIN'] },
  { id: 'profile', label: 'Profile', icon: UserCircle, roles: ['STUDENT', 'ADMIN'] },
  { id: 'logout', label: 'Logout', icon: LogOut, roles: ['STUDENT', 'ADMIN'] },
];

export const ADMIN_CREDENTIALS = {
  id: 'mkjd',
  password: 'mkjd6925'
};
