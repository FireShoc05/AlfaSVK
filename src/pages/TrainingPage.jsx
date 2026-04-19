import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui';
import { BookOpen, LogOut } from 'lucide-react';

export function TrainingPage() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{
        marginBottom: '24px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 49, 36, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)'
      }}>
        <BookOpen size={40} />
      </div>
      
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Пройди обучение</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '32px', lineHeight: '1.5' }}>
        Ваш аккаунт находится в статусе стажера. Для получения полного доступа к платформе агента вам необходимо успешно завершить корпоративное обучение и сдать тестирование.
      </p>

      <Button variant="outline-danger" onClick={handleLogout}>
        <LogOut size={16} style={{ marginRight: 8 }} />
        Сменить аккаунт / Выйти
      </Button>
    </div>
  );
}
