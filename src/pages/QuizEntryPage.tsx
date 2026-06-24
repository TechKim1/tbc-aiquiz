import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizSetByCode } from '../lib/quizService';
import { useQuizStore } from '../store/quizStore';

export default function QuizEntryPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { setCurrentSet } = useQuizStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) { navigate('/'); return; }
    getQuizSetByCode(code).then(set => {
      if (!set) {
        setError('존재하지 않는 퀴즈 코드입니다.');
        setLoading(false);
        return;
      }
      setCurrentSet(set);
      navigate('/nickname');
    }).catch(() => {
      setError('퀴즈를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    });
  }, [code]);

  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">퀴즈 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-sm w-full">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button className="btn-primary" onClick={() => navigate('/')}>메인으로</button>
      </div>
    </div>
  );
}
