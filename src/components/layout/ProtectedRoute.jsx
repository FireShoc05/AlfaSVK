import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Защищенный слой роутинга. Контролирует доступ к разным страницам 
 * на основе авторизации, роли и статуса онбординга.
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Не авторизован — кидаем на форму входа
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Проверка ролей
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />;
    if (user.role === 'agent') return <Navigate to="/" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  if (user.role === 'superadmin' && location.pathname !== '/superadmin') {
    return <Navigate to="/superadmin" replace />;
  }

  // 1. Проверка онбординга (для всех, кроме суперадмина)
  if (user.role !== 'superadmin') {
    const path = location.pathname;

    if (!user.onboarded || !user.passwordChanged) {
      if (path !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
      }
      return children ? children : <Outlet />;
    }

    if (path === '/onboarding') {
      return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
    }

    // 2. Проверка статуса стажера (только для обычных сотрудников)
    if (user.role === 'employee' || user.role === 'agent') {
      if (user.status === 'На обучении' && path !== '/training') {
        return <Navigate to="/training" replace />;
      }

      if (user.status !== 'На обучении' && path === '/training') {
        return <Navigate to="/" replace />;
      }
    }
  }

  return children ? children : <Outlet />;
}
