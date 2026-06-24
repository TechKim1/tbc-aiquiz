import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeLeaderboard, getQuizSetById } from '../lib/quizService';
import { useQuizStore } from '../store/quizStore';
import type { LeaderboardEntry, QuizSet } from '../types';

export default function LeaderboardPage() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { nickname } = useQuizStore();
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!setId) return;
    getQuizSetById(setId).then(set => setQuizSet(set));
    const unsub = subscribeLeaderboard(setId, (entries) => {
      setRankings(entries);
      setLoading(false);
    });
    return () => unsub();
  }, [setId]);

  function formatTime(ms: number) {
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}분 ${sec}초` : `${sec}초`;
  }

  function getMedal(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🏆 리더보드</h1>
            {quizSet && <p className="text-sm text-gray-500">{quizSet.title}</p>}
          </div>
          <button className="btn-secondary text-sm py-2 px-4" onClick={() => navigate(-1)}>
            ← 뒤로
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        {loading ? (
          <div className="text-center py-16 text-gray-400">불러오는 중...</div>
        ) : rankings.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500">아직 응시한 사람이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.slice(0, 50).map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.nickname === nickname;
              const medal = getMedal(rank);
              return (
                <div
                  key={i}
                  className={`card flex items-center gap-4 ${isMe ? 'border-2 border-blue-500 bg-blue-50' : ''}`}
                >
                  <div className="w-10 text-center">
                    {medal ? (
                      <span className="text-2xl">{medal}</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-400">{rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold truncate ${isMe ? 'text-blue-700' : 'text-gray-900'}`}>
                        {entry.nickname}
                      </span>
                      {isMe && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">나</span>}
                      {entry.department && (
                        <span className="text-xs text-gray-400">{entry.department}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{formatTime(entry.totalTimeMs)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${isMe ? 'text-blue-600' : 'text-gray-700'}`}>
                      {entry.score}점
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
