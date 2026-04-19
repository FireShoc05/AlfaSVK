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
    if (user.role === 'agent') return <Navigate to="/" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  // Спец-проверки только для сотрудников (не админов)
  if (user.role !== 'admin') {
    const path = location.pathname;

    // 1. Проверка онбординга (высший приоритет)
    // Если агент не прошел онбординг или не сменил пароль — можно только /onboarding
    if (!user.onboarded || !user.passwordChanged) {
      if (path !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
      }
      // Если на /onboarding — показываем (даже если стажер)
      return children ? children : <Outlet />;
    }

    // Дальше: user.onboarded === true && user.passwordChanged === true

    // Если прошел онбординг, но пытается зайти на /onboarding -> домой
    if (path === '/onboarding') {
      return <Navigate to="/" replace />;
    }

    // 2. Проверка статуса стажера
    if (user.status === 'На обучении' && path !== '/training') {
      return <Navigate to="/training" replace />;
    }

    // Если НЕ стажер, но пытается зайти на /training
    if (user.status !== 'На обучении' && path === '/training') {
      return <Navigate to="/" replace />;
    }
  }

  return children ? children : <Outlet />;
}
