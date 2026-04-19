import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import '../../styles/layout.css';

export function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
