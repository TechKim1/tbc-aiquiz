import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import type { QuizSet, Question, GenerateQuestionsRequest, LeaderboardEntry } from '../types';

// ─── Quiz Sets ────────────────────────────────────────────────────────────────

export async function getActiveQuizSets(): Promise<QuizSet[]> {
  const q = query(collection(db, 'quizSets'), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSet));
}

export async function getAllQuizSets(): Promise<QuizSet[]> {
  const snap = await getDocs(collection(db, 'quizSets'));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data['createdAt']?.toDate?.() ?? new Date(),
    } as QuizSet;
  });
}

export async function getQuizSetByCode(code: string): Promise<QuizSet | null> {
  const q = query(
    collection(db, 'quizSets'),
    where('accessCode', '==', code.toUpperCase()),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as QuizSet;
}

export async function getQuizSetById(setId: string): Promise<QuizSet | null> {
  const ref = doc(db, 'quizSets', setId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as QuizSet;
}

export async function getQuestions(setId: string): Promise<Question[]> {
  const q = query(
    collection(db, 'quizSets', setId, 'questions'),
    orderBy('order')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
}

// ─── AI Question Generation (클라이언트 직접 호출) ───────────────────────────

export async function generateQuestions(req: GenerateQuestionsRequest) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) throw new Error('OPENAI API 키가 설정되지 않았습니다.');

  const difficultyMap: Record<string, string> = {
    easy: '쉬움', medium: '보통', hard: '어려움',
  };
  const typeMap: Record<string, string> = {
    multiple: '객관식 4지선다', short: '단답형', mixed: '혼합',
  };

  const prompt = `당신은 기업 교육용 퀴즈 문제를 생성하는 전문가입니다.

[입력 내용]
${req.inputType === 'topic' ? `주제: ${req.content}` : req.content}

[요구사항]
- 문제 수: ${req.settings.questionCount}개
- 난이도: ${difficultyMap[req.settings.difficulty] ?? req.settings.difficulty}
- 유형: ${typeMap[req.settings.questionType] ?? req.settings.questionType}
- 언어: 한국어

[출력 형식] JSON 배열만 출력하세요. 다른 텍스트 없이.
[
  {
    "order": 1,
    "type": "multiple",
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answer": "정답",
    "explanation": "해설 (2-3문장)"
  }
]

[주의사항]
- 정답이 항상 특정 위치에 오지 않도록 무작위 배치
- 오답 보기는 그럴듯하게 작성
- 해설은 왜 정답인지 포함
- short 유형일 경우 options 배열을 빈 배열로 설정`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `OpenAI 오류: ${res.status}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const raw = data.choices[0]?.message?.content ?? '[]';

  let questions: Omit<Question, 'id'>[];
  try {
    const parsed = JSON.parse(raw) as unknown;
    questions = Array.isArray(parsed) ? parsed as Omit<Question, 'id'>[] : [];
  } catch {
    throw new Error('AI 응답 파싱 실패. 다시 시도해주세요.');
  }

  return { questions };
}

// ─── Quiz Set 저장 ─────────────────────────────────────────────────────────────

export async function createQuizSet(
  data: Omit<QuizSet, 'id' | 'createdAt' | 'accessCode' | 'shareUrl'>,
  questions: Omit<Question, 'id'>[]
): Promise<{ setId: string; accessCode: string }> {
  const accessCode = generateAccessCode();
  const setRef = await addDoc(collection(db, 'quizSets'), {
    ...data,
    accessCode,
    shareUrl: `${window.location.origin}/quiz/${accessCode}`,
    createdAt: Timestamp.now(),
  });

  const saves = questions.map((q, i) =>
    setDoc(doc(collection(db, 'quizSets', setRef.id, 'questions')), {
      ...q,
      order: i + 1,
      createdAt: Timestamp.now(),
    })
  );
  await Promise.all(saves);
  return { setId: setRef.id, accessCode };
}

export async function updateQuizSetStatus(setId: string, status: 'draft' | 'active' | 'closed') {
  await updateDoc(doc(db, 'quizSets', setId), { status });
}

// ─── 퀴즈 제출 (클라이언트 채점) ──────────────────────────────────────────────

export async function submitQuiz(params: {
  setId: string;
  nickname: string;
  department: string | null;
  answers: { questionId: string; selectedAnswer: string; timeSpentMs: number }[];
}) {
  const { setId, nickname, department, answers } = params;

  // 문제 불러와서 채점
  const questionsSnap = await getDocs(
    collection(db, 'quizSets', setId, 'questions')
  );
  const questionMap: Record<string, { answer: string; explanation: string }> = {};
  questionsSnap.docs.forEach(d => {
    const data = d.data();
    questionMap[d.id] = { answer: data['answer'] as string, explanation: data['explanation'] as string };
  });

  let score = 0;
  const results = answers.map(a => {
    const q = questionMap[a.questionId];
    const isCorrect = q ? a.selectedAnswer.trim() === q.answer.trim() : false;
    if (isCorrect) score++;
    return {
      questionId: a.questionId,
      isCorrect,
      correctAnswer: q?.answer ?? '',
      explanation: q?.explanation ?? '',
    };
  });

  const totalTimeMs = answers.reduce((sum, a) => sum + a.timeSpentMs, 0);

  // Firestore에 제출 기록 저장
  const submissionRef = await addDoc(
    collection(db, 'quizSets', setId, 'submissions'),
    {
      nickname,
      department: department ?? null,
      score,
      totalQuestions: answers.length,
      totalTimeMs,
      submittedAt: Timestamp.now(),
      answers: answers.map((a, i) => ({
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect: results[i]?.isCorrect ?? false,
        timeSpentMs: a.timeSpentMs,
      })),
    }
  );

  // 리더보드 업데이트
  const rank = await updateLeaderboard(setId, { nickname, department, score, totalTimeMs });

  return {
    submissionId: submissionRef.id,
    score,
    totalQuestions: answers.length,
    totalTimeMs,
    rank,
    results,
  };
}

async function updateLeaderboard(
  setId: string,
  entry: { nickname: string; department: string | null; score: number; totalTimeMs: number }
): Promise<number> {
  const lbRef = doc(db, 'leaderboards', setId);

  try {
    return await runTransaction(db, async (tx) => {
      const lbSnap = await tx.get(lbRef);
      let rankings: LeaderboardEntry[] = lbSnap.exists()
        ? ((lbSnap.data()['rankings'] as LeaderboardEntry[]) ?? [])
        : [];

      // 동일 닉네임 기존 기록 제거 후 재삽입
      rankings = rankings.filter(r => r.nickname !== entry.nickname);
      rankings.push({
        rank: 0,
        nickname: entry.nickname,
        department: entry.department,
        score: entry.score,
        totalTimeMs: entry.totalTimeMs,
        submittedAt: new Date(),
      });

      // 점수 내림차순 → 시간 오름차순 정렬
      rankings.sort((a, b) =>
        b.score !== a.score ? b.score - a.score : a.totalTimeMs - b.totalTimeMs
      );
      rankings = rankings.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }));

      tx.set(lbRef, { rankings, updatedAt: Timestamp.now() });

      return rankings.find(r => r.nickname === entry.nickname)?.rank ?? 0;
    });
  } catch {
    return 0;
  }
}

// ─── 리더보드 실시간 구독 ──────────────────────────────────────────────────────

export function subscribeLeaderboard(
  setId: string,
  callback: (entries: LeaderboardEntry[]) => void
) {
  return onSnapshot(doc(db, 'leaderboards', setId), (snap) => {
    if (snap.exists()) {
      callback((snap.data()['rankings'] as LeaderboardEntry[]) ?? []);
    } else {
      callback([]);
    }
  });
}

// ─── 유틸 ──────────────────────────────────────────────────────────────────────

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
