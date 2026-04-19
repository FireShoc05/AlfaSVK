import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ErrorBoundary } from '../ErrorBoundary';
import '../../styles/layout.css';

import { useAuthStore } from '../../store/useAuthStore';
import { useMeetingsStore } from '../../store/useMeetingsStore';

export function AppLayout() {
  const user = useAuthStore(s => s.user);
  const fetchUserMeetings = useMeetingsStore(s => s.fetchUserMeetings);

  useEffect(() => {
    if (user?.id) {
      fetchUserMeetings(user.id);
    }
  }, [user?.id, fetchUserMeetings]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
