import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';
import { submitQuiz } from '../lib/quizService';
import CountdownTimer from '../components/CountdownTimer';

export default function QuizPage() {
  const navigate = useNavigate();
  const {
    currentSet, questions, currentQuestionIndex,
    answers, nickname, department,
    recordAnswer, nextQuestion, finishQuiz, setSubmissionResult,
  } = useQuizStore();

  const [selected, setSelected] = useState<string | null>(null);
  const [timeoutMsg, setTimeoutMsg] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const questionStartTime = useRef(Date.now());

  useEffect(() => {
    if (!currentSet || questions.length === 0) { navigate('/'); return; }
  }, []);

  useEffect(() => {
    setSelected(null);
    setTimeoutMsg(false);
    setTimerKey(k => k + 1);
    questionStartTime.current = Date.now();
  }, [currentQuestionIndex]);

  if (!currentSet || questions.length === 0) return null;

  const q = questions[currentQuestionIndex];
  const isLast = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  async function handleAnswer(answer: string, isTimeout = false) {
    if (selected !== null) return;
    const timeSpentMs = Date.now() - questionStartTime.current;
    const isCorrect = answer.trim() === q.answer.trim();
    setSelected(answer);

    recordAnswer({
      questionId: q.id,
      selectedAnswer: answer,
      isCorrect,
      timeSpentMs,
    });

    if (isTimeout) {
      setTimeoutMsg(true);
      await new Promise(r => setTimeout(r, 800));
    } else {
      await new Promise(r => setTimeout(r, 400));
    }

    if (isLast) {
      await handleFinish([...answers, { questionId: q.id, selectedAnswer: answer, isCorrect, timeSpentMs }]);
    } else {
      nextQuestion();
    }
  }

  async function handleTimeout() {
    await handleAnswer('', true);
  }

  async function handleFinish(allAnswers: typeof answers) {
    setSubmitting(true);
    try {
      const result = await submitQuiz({
        setId: currentSet!.id,
        nickname,
        department: department || null,
        answers: allAnswers.map(a => ({
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          timeSpentMs: a.timeSpentMs,
        })),
      });
      setSubmissionResult(result);
      finishQuiz();
      navigate('/result');
    } catch (e) {
      console.error(e);
      finishQuiz();
      navigate('/result');
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1.5">
        <div
          className="bg-blue-500 h-1.5 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <span className="text-sm font-medium text-gray-500">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <CountdownTimer
            key={timerKey}
            totalSeconds={currentSet.settings.timerSeconds}
            onTimeout={handleTimeout}
            paused={selected !== null}
          />
          <span className="text-sm font-medium text-gray-500">{nickname}</span>
        </div>

        {/* Timeout msg */}
        {timeoutMsg && (
          <div className="bg-red-100 text-red-700 text-center py-2 px-4 rounded-xl mb-3 font-medium animate-pulse">
            ⏰ 시간 초과!
          </div>
        )}

        {/* Question */}
        <div className="card flex-1 flex flex-col">
          <p className="text-lg font-bold text-gray-900 mb-6 leading-relaxed flex-1">
            {q.question}
          </p>

          {q.type === 'multiple' ? (
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                let cls = 'w-full text-left py-4 px-5 rounded-xl border-2 font-medium transition-all ';
                if (selected === null) {
                  cls += 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 active:scale-98';
                } else if (opt === q.answer) {
                  cls += 'border-green-500 bg-green-50 text-green-700';
                } else if (opt === selected) {
                  cls += 'border-red-400 bg-red-50 text-red-700';
                } else {
                  cls += 'border-gray-100 bg-gray-50 text-gray-400';
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    onClick={() => handleAnswer(opt)}
                    disabled={selected !== null || submitting}
                  >
                    <span className="font-bold mr-2 text-gray-400">
                      {['①', '②', '③', '④'][i]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                className="input"
                placeholder="답을 입력하세요"
                id="short-answer"
                disabled={selected !== null}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) handleAnswer(val);
                  }
                }}
              />
              <button
                className="btn-primary w-full"
                disabled={selected !== null}
                onClick={() => {
                  const val = (document.getElementById('short-answer') as HTMLInputElement)?.value.trim();
                  if (val) handleAnswer(val);
                }}
              >
                제출
              </button>
            </div>
          )}
        </div>

        {submitting && (
          <div className="text-center py-4 text-gray-400">결과를 처리하는 중...</div>
        )}
      </div>
    </div>
  );
}
