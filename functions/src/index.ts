import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();
const db = admin.firestore();

// ─── generateQuestions ───────────────────────────────────────────────────────

export const generateQuestions = onCall(
  { region: 'asia-northeast3', timeoutSeconds: 120 },
  async (request) => {
    const { inputType, content, settings } = request.data as {
      inputType: 'topic' | 'text' | 'pdf';
      content: string;
      settings: {
        questionCount: number;
        difficulty: string;
        questionType: string;
        language: string;
      };
    };

    if (!content || !settings) {
      throw new HttpsError('invalid-argument', 'content and settings are required');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const difficultyMap: Record<string, string> = {
      easy: '쉬움',
      medium: '보통',
      hard: '어려움',
    };
    const typeMap: Record<string, string> = {
      multiple: '객관식 4지선다',
      short: '단답형',
      mixed: '혼합',
    };

    const prompt = `당신은 기업 교육용 퀴즈 문제를 생성하는 전문가입니다.

[입력 내용]
${inputType === 'topic' ? `주제: ${content}` : content}

[요구사항]
- 문제 수: ${settings.questionCount}개
- 난이도: ${difficultyMap[settings.difficulty] ?? settings.difficulty}
- 유형: ${typeMap[settings.questionType] ?? settings.questionType}
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
- 정답이 항상 특정 위치(예: 첫 번째)에 오지 않도록 무작위 배치
- 오답 보기는 그럴듯하게 작성 (명백히 틀린 보기 지양)
- 해설은 왜 정답인지, 왜 다른 보기가 틀렸는지 포함
- short 유형일 경우 options 배열을 생략하거나 빈 배열로 설정`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{"questions":[]}';

    let parsed: { questions?: unknown[] };
    try {
      parsed = JSON.parse(raw) as { questions?: unknown[] };
    } catch {
      // gpt might return plain array
      const arr = JSON.parse(raw) as unknown[];
      parsed = { questions: arr };
    }

    const questions = Array.isArray(parsed) ? parsed : (parsed.questions ?? parsed);

    return { questions };
  }
);

// ─── submitQuiz ───────────────────────────────────────────────────────────────

export const submitQuiz = onCall(
  { region: 'asia-northeast3' },
  async (request) => {
    const { setId, nickname, department, answers } = request.data as {
      setId: string;
      nickname: string;
      department: string | null;
      answers: { questionId: string; selectedAnswer: string; timeSpentMs: number }[];
    };

    if (!setId || !nickname || !answers) {
      throw new HttpsError('invalid-argument', 'setId, nickname, answers are required');
    }

    // Load questions
    const questionsSnap = await db
      .collection('quizSets')
      .doc(setId)
      .collection('questions')
      .get();

    const questionMap: Record<string, { answer: string; explanation: string }> = {};
    questionsSnap.docs.forEach(d => {
      const data = d.data();
      questionMap[d.id] = { answer: data['answer'], explanation: data['explanation'] };
    });

    // Score answers
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

    // Save submission
    const submissionRef = await db
      .collection('quizSets')
      .doc(setId)
      .collection('submissions')
      .add({
        nickname,
        department: department ?? null,
        score,
        totalQuestions: answers.length,
        totalTimeMs,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        answers: answers.map((a, i) => ({
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          isCorrect: results[i]?.isCorrect ?? false,
          timeSpentMs: a.timeSpentMs,
        })),
      });

    // Update leaderboard
    const rank = await updateLeaderboard(setId, {
      nickname,
      department: department ?? null,
      score,
      totalTimeMs,
    });

    return {
      submissionId: submissionRef.id,
      score,
      totalQuestions: answers.length,
      totalTimeMs,
      rank,
      results,
    };
  }
);

async function updateLeaderboard(
  setId: string,
  entry: { nickname: string; department: string | null; score: number; totalTimeMs: number }
): Promise<number> {
  const lbRef = db.collection('leaderboards').doc(setId);

  return db.runTransaction(async (tx) => {
    const lbSnap = await tx.get(lbRef);
    let rankings: {
      rank: number;
      nickname: string;
      department: string | null;
      score: number;
      totalTimeMs: number;
      submittedAt: admin.firestore.Timestamp;
    }[] = lbSnap.exists ? (lbSnap.data()?.['rankings'] ?? []) : [];

    // Remove existing entry for same nickname
    rankings = rankings.filter(r => r.nickname !== entry.nickname);

    rankings.push({
      ...entry,
      rank: 0,
      submittedAt: admin.firestore.Timestamp.now(),
    });

    // Sort: score desc, totalTimeMs asc
    rankings.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTimeMs - b.totalTimeMs;
    });

    // Assign ranks (top 50)
    rankings = rankings.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }));

    tx.set(lbRef, { rankings, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    const myRank = rankings.find(r => r.nickname === entry.nickname)?.rank ?? 0;
    return myRank;
  });
}
