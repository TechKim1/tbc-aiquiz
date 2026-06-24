import { create } from 'zustand';
import type { QuizSet, Question, AnswerRecord, LeaderboardEntry } from '../types';

interface QuizState {
  currentSet: QuizSet | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  nickname: string;
  department: string;
  isQuizFinished: boolean;
  submissionResult: {
    submissionId: string;
    score: number;
    totalQuestions: number;
    totalTimeMs: number;
    rank: number;
    results: { questionId: string; isCorrect: boolean; correctAnswer: string; explanation: string }[];
  } | null;
  leaderboard: LeaderboardEntry[];

  setCurrentSet: (set: QuizSet) => void;
  setQuestions: (questions: Question[]) => void;
  setNickname: (nickname: string, department: string) => void;
  recordAnswer: (answer: AnswerRecord) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  setSubmissionResult: (result: QuizState['submissionResult']) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentSet: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  nickname: '',
  department: '',
  isQuizFinished: false,
  submissionResult: null,
  leaderboard: [],

  setCurrentSet: (currentSet) => set({ currentSet }),
  setQuestions: (questions) => set({ questions }),
  setNickname: (nickname, department) => set({ nickname, department }),
  recordAnswer: (answer) => set((s) => ({ answers: [...s.answers, answer] })),
  nextQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
  finishQuiz: () => set({ isQuizFinished: true }),
  setSubmissionResult: (submissionResult) => set({ submissionResult }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  resetQuiz: () => set({
    currentQuestionIndex: 0,
    answers: [],
    isQuizFinished: false,
    submissionResult: null,
  }),
}));
