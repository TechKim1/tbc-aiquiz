import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../store/quizStore';
import { getQuestions } from '../lib/quizService';

export default function NicknamePage() {
  const navigate = useNavigate();
  const { currentSet, setNickname, setQuestions, resetQuiz } = useQuizStore();
  const [nickname, setNicknameInput] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentSet) {
    navigate('/');
    return null;
  }

  const set = currentSet;

  async function handleStart() {
    const trimmed = nickname.trim();
    if (trimmed.length < 2) { setError('닉네임은 최소 2자 이상이어야 합니다.'); return; }
    if (trimmed.length > 10) { setError('닉네임은 최대 10자까지 가능합니다.'); return; }
    setError('');
    setLoading(true);
    try {
      const questions = await getQuestions(set.id);
      if (questions.length === 0) {
        setError('이 퀴즈에 문제가 없습니다. 관리자에게 문의하세요.');
        setLoading(false);
        return;
      }
      setNickname(trimmed, department.trim());
      setQuestions(questions);
      resetQuiz();
      navigate('/play');
    } catch {
      setError('문제를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👤</div>
          <h1 className="text-2xl font-bold text-gray-900">{currentSet.title}</h1>
          <p className="text-gray-500 mt-1">
            {currentSet.settings.questionCount}문제 · 문제당 {currentSet.settings.timerSeconds}초
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-4">참여자 정보 입력</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">닉네임 *</label>
              <input
                className="input"
                placeholder="2~10자 입력"
                value={nickname}
                onChange={e => setNicknameInput(e.target.value)}
                maxLength={10}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                부서/팀 <span className="text-gray-400">(선택)</span>
              </label>
              <input
                className="input"
                placeholder="예: 인사팀, 개발팀"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button className="btn-primary w-full" onClick={handleStart} disabled={loading}>
              {loading ? '준비 중...' : '퀴즈 시작하기 🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
