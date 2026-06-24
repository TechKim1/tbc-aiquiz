import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    if (password === adminPassword) {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
          <p className="text-gray-500 mt-1">교육담당자 전용</p>
        </div>

        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">관리자 비밀번호</label>
              <input
                type="password"
                className="input"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <button className="btn-primary w-full" onClick={handleLogin}>
              로그인
            </button>
          </div>
        </div>

        <button
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full text-center"
          onClick={() => navigate('/')}
        >
          ← 메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
