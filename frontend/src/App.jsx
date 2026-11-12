import { Navigate, Route, Routes } from 'react-router-dom';
import StreakLoader from './components/DailyStreak/StreakLoader';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth/AuthPage';
import DailyStreakPage from './pages/DailyStreak/DailyStreakPage';
import HistoryPage from './pages/History/HistoryPage';
import ProfilePage from './pages/Profile/ProfilePage';
import WalletPage from './pages/Wallet/WalletPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <StreakLoader message="Verifying your session..." />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <StreakLoader message="Loading VELoop Rewards..." />;
  }
  if (isAuthenticated) {
    return <Navigate to="/daily-streak" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/daily-streak" replace />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="login" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <AuthPage initialMode="register" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/daily-streak"
        element={
          <ProtectedRoute>
            <DailyStreakPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/daily-streak" replace />} />
    </Routes>
  );
}

