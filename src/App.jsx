import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TrainingPage } from './pages/TrainingPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

import { MeetingPage } from './pages/MeetingPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { LinksPage } from './pages/LinksPage';
import { PlaceholderPages } from './pages/PlaceholderPages';

export default function App() {
  return (
    <Routes>
      {/* Публичный роут */}
      <Route path="/login" element={<LoginPage />} />

      {/* Админ-панель */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Слой маршрутизации обычных сотрудников */}
      <Route element={<ProtectedRoute allowedRoles={['agent', 'admin']} />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/training" element={<TrainingPage />} />

        {/* Основной интерфейс */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/meeting" replace />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          <Route path="/links" element={<LinksPage />} />
          <Route path="/pending" element={<PlaceholderPages type="pending" />} />
        </Route>
      </Route>
    </Routes>
  );
}
