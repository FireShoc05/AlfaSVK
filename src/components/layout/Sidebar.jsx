import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarPlus,
  Trophy,
  User,
  Link,
  Shield,
  LogOut,
  Menu,
  X,
  ExternalLink,
  CalendarDays,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

const mainNav = [
  { to: '/meeting', icon: CalendarPlus, label: 'Новая встреча' },
  { to: '/leaderboard', icon: Trophy, label: 'Лидеры' },
  { to: '/schedule', icon: CalendarDays, label: 'График' },
  { to: '/profile', icon: User, label: 'Профиль' },
];

const secondaryNav = [
  { to: '/links', icon: Link, label: 'Полезные ссылки' },
  { to: '/admin', icon: Shield, label: 'Админ панель' },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const links = useSettingsStore((s) => s.links);
  const fetchLinks = useSettingsStore((s) => s.fetchLinks);
  const loaded = useSettingsStore((s) => s.loaded);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loaded) fetchLinks();
  }, [loaded, fetchLinks]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const quickLinks = [
    { label: 'MAX', url: links.max_url },
    { label: 'SFAGo', url: links.sfago_url },
  ].filter(l => l.url);

  const sidebarContent = (
    <>
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">A</div>
        <div>
          <div className="sidebar__logo-text">АльфаСВК</div>
          <div className="sidebar__logo-sub">Платформа агента</div>
        </div>
      </div>

      {/* Quick Links */}
      {quickLinks.length > 0 && (
        <div className="sidebar__quick-links">
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar__quick-link"
            >
              <span className="sidebar__quick-link-label">{link.label}</span>
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      )}

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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar sidebar--desktop">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Открыть меню"
      >
        <Menu size={24} />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`sidebar sidebar--mobile ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <button
          className="sidebar__close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Закрыть меню"
        >
          <X size={24} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
