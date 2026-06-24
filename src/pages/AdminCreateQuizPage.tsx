import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestions, createQuizSet } from '../lib/quizService';
import type { Question, QuizSettings } from '../types';

type InputType = 'topic' | 'text';
type Step = 'form' | 'review' | 'done';

export default function AdminCreateQuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [title, setTitle] = useState('');
  const [inputType, setInputType] = useState<InputType>('topic');
  const [content, setContent] = useState('');
  const [settings, setSettings] = useState<QuizSettings>({
    questionCount: 10,
    difficulty: 'medium',
    questionType: 'multiple',
    timerSeconds: 30,
    retryLimit: null,
  });
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [accessCode, setAccessCode] = useState('');

  async function handleGenerate() {
    if (!title.trim()) { setError('세트 제목을 입력해주세요.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }
    setError('');
    setGenerating(true);
    try {
      const result = await generateQuestions({
        inputType,
        content: content.trim(),
        settings: {
          questionCount: settings.questionCount,
          difficulty: settings.difficulty,
          questionType: settings.questionType,
          language: 'ko',
        },
      });
      setQuestions(result.questions);
      setStep('review');
    } catch (e) {
      setError('문제 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(status: 'draft' | 'active') {
    setSaving(true);
    try {
      const { accessCode: code } = await createQuizSet(
        {
          title: title.trim(),
          description: content.substring(0, 200),
          createdBy: 'admin',
          status,
          startDate: null,
          endDate: null,
          settings,
        },
        questions
      );
      setAccessCode(code);
      setStep('done');
    } catch (e) {
      setError('저장 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index: number, field: string, value: string) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  }

  function deleteQuestion(index: number) {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">퀴즈 세트 완성!</h2>
          <p className="text-gray-500 mb-6">임직원에게 아래 코드를 공유하세요.</p>
          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-blue-500 mb-1">퀴즈 접근 코드</p>
            <p className="text-4xl font-mono font-bold text-blue-700 tracking-widest">{accessCode}</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => navigate('/admin/dashboard')}>
              대시보드로
            </button>
            <button className="btn-primary flex-1" onClick={() => {
              setStep('form'); setTitle(''); setContent(''); setQuestions([]); setAccessCode('');
            }}>
              새 퀴즈 만들기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-sm text-gray-500">{questions.length}개 문제 검토 중</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm py-2 px-4" onClick={() => setStep('form')}>
                ← 뒤로
              </button>
              <button
                className="btn-secondary text-sm py-2 px-4"
                onClick={() => handleSave('draft')}
                disabled={saving}
              >
                초안 저장
              </button>
              <button
                className="btn-primary text-sm py-2 px-4"
                onClick={() => handleSave('active')}
                disabled={saving}
              >
                {saving ? '저장 중...' : '공개 저장'}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
          {questions.map((q, i) => (
            <div key={i} className="card">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">
                  Q{i + 1}
                </span>
                <button
                  className="text-red-400 hover:text-red-600 text-xs"
                  onClick={() => deleteQuestion(i)}
                >
                  삭제
                </button>
              </div>
              <textarea
                className="input text-sm mb-3 resize-none"
                rows={2}
                value={q.question}
                onChange={e => updateQuestion(i, 'question', e.target.value)}
              />
              {q.type === 'multiple' && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {q.options.map((opt, oi) => (
                    <input
                      key={oi}
                      className="input text-sm"
                      value={opt}
                      onChange={e => {
                        const newOpts = [...q.options];
                        newOpts[oi] = e.target.value;
                        updateQuestion(i, 'options', newOpts as unknown as string);
                        setQuestions(prev => prev.map((pq, pi) =>
                          pi === i ? { ...pq, options: newOpts } : pq
                        ));
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="bg-green-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-green-700 mb-1">✓ 정답: {q.answer}</p>
                <p className="text-green-600">{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">새 퀴즈 세트 만들기</h1>
          <button className="btn-secondary text-sm py-2 px-4" onClick={() => navigate('/admin/dashboard')}>
            ← 뒤로
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}

        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-1">세트 제목 *</label>
          <input
            className="input"
            placeholder="예: 개인정보보호법 기초 퀴즈"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-3">입력 방식</label>
          <div className="flex gap-2 mb-4">
            {([['topic', '주제 입력'], ['text', '텍스트 붙여넣기']] as const).map(([type, label]) => (
              <button
                key={type}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  inputType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setInputType(type)}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            className="input resize-none"
            rows={inputType === 'topic' ? 3 : 8}
            placeholder={
              inputType === 'topic'
                ? '예: 개인정보보호법의 주요 원칙과 위반 시 처벌 규정'
                : '학습 자료 텍스트를 여기에 붙여넣으세요...'
            }
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-4">퀴즈 설정</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">문제 수</label>
              <div className="flex gap-1">
                {([5, 10, 20] as const).map(n => (
                  <button
                    key={n}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      settings.questionCount === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                    onClick={() => setSettings(s => ({ ...s, questionCount: n }))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">난이도</label>
              <div className="flex gap-1">
                {([['easy', '쉬움'], ['medium', '보통'], ['hard', '어려움']] as const).map(([v, l]) => (
                  <button
                    key={v}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      settings.difficulty === v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                    onClick={() => setSettings(s => ({ ...s, difficulty: v }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">타이머 (초/문제)</label>
              <div className="flex gap-1 flex-wrap">
                {[15, 30, 60, 90].map(sec => (
                  <button
                    key={sec}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors min-w-[3rem] ${
                      settings.timerSeconds === sec
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                    onClick={() => setSettings(s => ({ ...s, timerSeconds: sec }))}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">재도전</label>
              <div className="flex gap-1">
                {([[null, '무제한'], [1, '1회'], [3, '3회']] as const).map(([v, l]) => (
                  <button
                    key={String(v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      settings.retryLimit === v
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                    onClick={() => setSettings(s => ({ ...s, retryLimit: v }))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          className="btn-primary w-full py-4 text-lg"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span>
              AI가 문제를 생성하는 중... (최대 30초)
            </span>
          ) : (
            '🤖 AI로 문제 생성하기'
          )}
        </button>
      </div>
    </div>
  );
}
