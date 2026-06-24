import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuizSets, updateQuizSetStatus } from '../lib/quizService';
import type { QuizSet } from '../types';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSets();
  }, []);

  async function loadSets() {
    setLoading(true);
    try {
      const sets = await getAllQuizSets();
      setQuizSets(sets);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(set: QuizSet) {
    const newStatus = set.status === 'active' ? 'draft' : 'active';
    await updateQuizSetStatus(set.id, newStatus);
    setQuizSets(prev => prev.map(s => s.id === set.id ? { ...s, status: newStatus } : s));
  }

  function handleLogout() {
    sessionStorage.removeItem('isAdmin');
    navigate('/');
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  const statusColor = (status: QuizSet['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'closed': return 'bg-gray-100 text-gray-500';
    }
  };

  const statusLabel = (status: QuizSet['status']) => {
    switch (status) {
      case 'active': return '공개';
      case 'draft': return '비공개';
      case 'closed': return '종료';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-sm text-gray-500">TBC AI 퀴즈 교육담당자</p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-primary text-sm py-2 px-4"
              onClick={() => navigate('/admin/create')}
            >
              + 새 퀴즈 만들기
            </button>
            <button className="btn-secondary text-sm py-2 px-4" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">불러오는 중...</div>
        ) : quizSets.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 mb-4">아직 만들어진 퀴즈가 없습니다.</p>
            <button className="btn-primary" onClick={() => navigate('/admin/create')}>
              첫 번째 퀴즈 만들기
            </button>
          </div>
        ) : (
          quizSets.map(set => (
            <div key={set.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(set.status)}`}>
                      {statusLabel(set.status)}
                    </span>
                    <span className="text-xs text-gray-400">{set.settings?.questionCount ?? '?'}문제 · {set.settings?.timerSeconds ?? '?'}초</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg truncate">{set.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-blue-600 font-bold tracking-widest bg-blue-50 px-3 py-1 rounded-lg text-sm">
                      {set.accessCode}
                    </span>
                    <button
                      className="text-xs text-gray-400 hover:text-blue-500"
                      onClick={() => copyCode(set.accessCode)}
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className={`text-sm py-1.5 px-3 rounded-lg font-medium transition-colors ${
                      set.status === 'active'
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    onClick={() => toggleStatus(set)}
                  >
                    {set.status === 'active' ? '비공개로' : '공개하기'}
                  </button>
                  <button
                    className="text-sm py-1.5 px-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    onClick={() => navigate(`/leaderboard/${set.id}`)}
                  >
                    리더보드
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
