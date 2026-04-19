import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { MeetingPage } from './pages/MeetingPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlaceholderPages } from './pages/PlaceholderPages';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/meeting" replace />} />
        <Route path="/meeting" element={<MeetingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/passwords" element={<PlaceholderPages type="passwords" />} />
        <Route path="/transfers" element={<PlaceholderPages type="transfers" />} />
        <Route path="/admin" element={<PlaceholderPages type="admin" />} />
        <Route path="/pending" element={<PlaceholderPages type="pending" />} />
      </Route>
    </Routes>
  );
}
