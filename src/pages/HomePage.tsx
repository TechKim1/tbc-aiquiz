import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveQuizSets } from '../lib/quizService';
import { useQuizStore } from '../store/quizStore';
import type { QuizSet } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { setCurrentSet } = useQuizStore();
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getActiveQuizSets()
      .then(sets => setQuizSets(sets))
      .catch(() => setError('퀴즈 목록을 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(set: QuizSet) {
    setCurrentSet(set);
    navigate('/nickname');
  }

  const difficultyLabel = (d: string) => ({ easy: '쉬움', medium: '보통', hard: '어려움' })[d] ?? d;
  const difficultyColor = (d: string) => ({
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  })[d] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-lg mx-auto px-4 py-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎯</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TBC AI 퀴즈</h1>
          <p className="text-gray-500 text-lg">AI가 만든 교육 퀴즈에 도전하세요!</p>
        </div>

        {/* 퀴즈 목록 */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3 animate-spin">⚙️</div>
            불러오는 중...
          </div>
        ) : error ? (
          <div className="card text-center py-8 text-red-500">{error}</div>
        ) : quizSets.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">현재 진행 중인 퀴즈가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1">교육담당자에게 문의하세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500 mb-2">진행 중인 퀴즈 {quizSets.length}개</p>
            {quizSets.map(set => (
              <button
                key={set.id}
                className="card w-full text-left hover:shadow-md hover:border-blue-200 border-2 border-transparent transition-all active:scale-98"
                onClick={() => handleSelect(set)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{set.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {set.settings?.questionCount ?? '?'}문제
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        ⏱ {set.settings?.timerSeconds ?? '?'}초/문제
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${difficultyColor(set.settings?.difficulty)}`}>
                        {difficultyLabel(set.settings?.difficulty)}
                      </span>
                    </div>
                  </div>
                  <span className="text-blue-500 text-xl mt-1">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 관리자 링크 */}
        <div className="text-center mt-8">
          <button
            className="text-sm text-gray-400 hover:text-blue-600 transition-colors"
            onClick={() => navigate('/admin/login')}
          >
            교육담당자 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
