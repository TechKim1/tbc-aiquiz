import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCreateQuizPage from './pages/AdminCreateQuizPage';
import NicknamePage from './pages/NicknamePage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import LeaderboardPage from './pages/LeaderboardPage';
import QuizEntryPage from './pages/QuizEntryPage';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/create" element={<AdminRoute><AdminCreateQuizPage /></AdminRoute>} />
        <Route path="/quiz/:code" element={<QuizEntryPage />} />
        <Route path="/nickname" element={<NicknamePage />} />
        <Route path="/play" element={<QuizPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/leaderboard/:setId" element={<LeaderboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
