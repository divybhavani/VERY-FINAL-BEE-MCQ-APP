
export enum Subject {
  ELECTRICAL = 'ELECTRICAL',
  ELECTRONICS = 'ELECTRONICS'
}

export enum Role {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum Division {
  LIN = 'LIN',
  WIN = 'WIN',
  MAC = 'MAC'
}

export interface User {
  id: string;
  name: string;
  rollNumber?: string;
  division?: Division;
  year: 'FY';
  role: Role;
  subject: Subject;
  adminId?: string;
}

export interface AcademicNote {
  id: string;
  title: string;
  type: 'PDF' | 'PPT' | 'DOC' | 'XLSX';
  fileUrl: string;
  subject: Subject;
  division: Division | 'ALL';
  uploadedBy: string;
  createdAt: number;
}

export interface Question {
  id: string;
  testId: string;
  question: string;
  bloom_level?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
}

export interface Test {
  id: string;
  title: string;
  subject: Subject;
  division: Division | 'ALL';
  createdBy: string;
  questions: Question[];
  totalQuestionsToAttempt?: number;
  createdAt: number;
}

export interface QuestionAttempt {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export interface Result {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  division: Division;
  testId: string;
  testTitle: string;
  subject: Subject;
  score: number;
  totalQuestions: number;
  attempts: QuestionAttempt[];
  submittedAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  subject: Subject;
  classTarget: Division | 'ALL';
  createdAt: number;
}
