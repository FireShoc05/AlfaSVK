import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  Trophy,
  User,
  KeyRound,
  ArrowRightLeft,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const mainNav = [
  { to: '/meeting', icon: CalendarPlus, label: 'Новая встреча' },
  { to: '/leaderboard', icon: Trophy, label: 'Лидеры' },
  { to: '/profile', icon: User, label: 'Профиль' },
];

const secondaryNav = [
  { to: '/passwords', icon: KeyRound, label: 'Логины и пароли' },
  { to: '/transfers', icon: ArrowRightLeft, label: 'Бот переносов' },
  { to: '/admin', icon: Shield, label: 'Админ панель' },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">A</div>
        <div>
          <div className="sidebar__logo-text">АльфаСВК</div>
          <div className="sidebar__logo-sub">Платформа агента</div>
        </div>
      </div>

      <div className="sidebar__section">
        <div className="sidebar__section-title">Основное</div>
        <nav className="sidebar__nav">
          {mainNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar__section">
        <div className="sidebar__section-title">Дополнительно</div>
        <nav className="sidebar__nav">
          {secondaryNav
            .filter(({ to }) => to !== '/admin' || user?.role === 'admin')
            .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar__spacer" />

      {user && (
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user.fullName?.charAt(0) || 'A'}
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user.fullName}</div>
            <div className="sidebar__user-role">{user.username}</div>
          </div>
          <button className="sidebar__logout" onClick={handleLogout} title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  );
}
