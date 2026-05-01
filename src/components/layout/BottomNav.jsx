import { NavLink } from 'react-router-dom';
import { CalendarPlus, Trophy, User, CalendarDays } from 'lucide-react';

const navItems = [
  { to: '/meeting', icon: CalendarPlus, label: 'Встреча' },
  { to: '/leaderboard', icon: Trophy, label: 'Лидеры' },
  { to: '/schedule', icon: CalendarDays, label: 'График' },
  { to: '/profile', icon: User, label: 'Профиль' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
