import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';

export default function ResultPage() {
  const navigate = useNavigate();
  const { currentSet, questions, submissionResult, nickname, resetQuiz } = useQuizStore();

  if (!submissionResult || !currentSet) {
    navigate('/');
    return null;
  }

  const { score, totalQuestions, totalTimeMs, rank, results } = submissionResult;
  const pct = Math.round((score / totalQuestions) * 100);
  const totalSec = Math.round(totalTimeMs / 1000);

  function getEmoji() {
    if (pct >= 90) return '🏆';
    if (pct >= 70) return '🎉';
    if (pct >= 50) return '👍';
    return '💪';
  }

  function getMsg() {
    if (pct >= 90) return '훌륭해요! 만점에 가까운 점수입니다!';
    if (pct >= 70) return '잘 하셨어요! 핵심 내용을 잘 이해하고 있네요.';
    if (pct >= 50) return '절반은 맞혔어요. 조금 더 공부해 봅시다!';
    return '다시 한번 도전해보세요. 화이팅!';
  }

  function handleRetry() {
    resetQuiz();
    navigate('/nickname');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto p-4">
        {/* Score card */}
        <div className="card text-center py-8 mb-4">
          <div className="text-6xl mb-3">{getEmoji()}</div>
          <h1 className="text-2xl font-bold mb-1">{nickname}님의 결과</h1>
          <p className="text-gray-500 text-sm mb-6">{getMsg()}</p>

          <div className="flex justify-center gap-8 mb-6">
            <div>
              <div className="text-4xl font-bold text-blue-600">{score}<span className="text-xl text-gray-400">/{totalQuestions}</span></div>
              <div className="text-xs text-gray-400 mt-1">정답 수</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600">{pct}<span className="text-xl text-gray-400">%</span></div>
              <div className="text-xs text-gray-400 mt-1">정답률</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600">{totalSec}<span className="text-xl text-gray-400">s</span></div>
              <div className="text-xs text-gray-400 mt-1">총 시간</div>
            </div>
          </div>

          {rank > 0 && (
            <div className="bg-yellow-50 rounded-xl py-3 px-4 inline-flex items-center gap-2">
              <span className="text-yellow-500 font-bold text-lg">🥇 현재 {rank}위</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            className="btn-secondary flex-1"
            onClick={() => navigate(`/leaderboard/${currentSet.id}`)}
          >
            🏅 리더보드 보기
          </button>
          {(currentSet.settings.retryLimit === null || true) && (
            <button className="btn-primary flex-1" onClick={handleRetry}>
              🔄 재도전
            </button>
          )}
        </div>

        {/* Answers review */}
        <h2 className="text-lg font-bold mb-3">문제별 결과</h2>
        <div className="space-y-3">
          {results.map((r, i) => {
            const q = questions.find(q => q.id === r.questionId);
            return (
              <div key={r.questionId} className={`card border-l-4 ${r.isCorrect ? 'border-green-500' : 'border-red-400'}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-lg ${r.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {r.isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-1">Q{i + 1}. {q?.question}</p>
                    {!r.isCorrect && (
                      <p className="text-sm text-red-500 mb-1">
                        정답: <span className="font-bold">{r.correctAnswer}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-500">{r.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-secondary w-full mt-6" onClick={() => navigate('/')}>
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
