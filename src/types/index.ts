export interface QuizSettings {
  questionCount: 5 | 10 | 20;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple' | 'short' | 'mixed';
  timerSeconds: number;
  retryLimit: number | null;
}

export interface Question {
  id: string;
  order: number;
  type: 'multiple' | 'short';
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  createdAt?: Date;
}

export interface QuizSet {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  status: 'draft' | 'active' | 'closed';
  startDate: Date | null;
  endDate: Date | null;
  settings: QuizSettings;
  accessCode: string;
  shareUrl: string;
}

export interface AnswerRecord {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpentMs: number;
}

export interface Submission {
  id: string;
  nickname: string;
  department: string | null;
  score: number;
  totalQuestions: number;
  totalTimeMs: number;
  submittedAt: Date;
  answers: AnswerRecord[];
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  department: string | null;
  score: number;
  totalTimeMs: number;
  submittedAt: Date;
}

export interface GenerateQuestionsRequest {
  inputType: 'topic' | 'text' | 'pdf';
  content: string;
  settings: {
    questionCount: number;
    difficulty: string;
    questionType: string;
    language: string;
  };
}
