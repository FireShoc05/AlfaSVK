import { Navigate, useLocation } from 'react-router-dom';
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

  // Если это админ, и он пытается зайти на обычные страницы (не /admin)
  // Мы можем либо пускать его, либо форсировать на /admin.
  // Оставим проверку allowedRoles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Если у юзера роль agent, а суется в admin
    if (user.role === 'agent') return <Navigate to="/" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  // Спец-проверки только для сотрудников (не админов)
  if (user.role !== 'admin') {
    // 1. Проверка онбординга
    // Если агент не прошел онбординг (нет контактов) и он НЕ на странице /onboarding
    if (!user.onboarded && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }

    // Если прошел онбординг, но пытается зайти на /onboarding -> кидаем домой
    if (user.onboarded && location.pathname === '/onboarding') {
      return <Navigate to="/" replace />;
    }

    // 2. Проверка статуса стажера
    // Если агент стажер, он может видеть только /training
    if (user.status === 'На обучении' && location.pathname !== '/training') {
      return <Navigate to="/training" replace />;
    }

    // Если агент НЕ стажер, но пытается зайти на /training
    if (user.status !== 'На обучении' && location.pathname === '/training') {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
