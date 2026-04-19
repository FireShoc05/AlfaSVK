import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUsersStore } from '../store/useUsersStore';
import { GlassCard, Button, InputGroup } from '../components/ui';
import { Shield } from 'lucide-react';
import '../styles/login.css';

export function LoginPage() {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  
  const login = useAuthStore(s => s.login);
  const findUser = useUsersStore(s => s.findUserByCredentials);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // 1. Хардкод Админа
    if (loginInput === 'LitvinukADM' && passwordInput === 'Alfabank050505') {
      login({
        id: 'admin_root',
        fullName: 'Главный Администратор',
        username: 'LitvinukADM',
        role: 'admin',
        joinDate: new Date().toISOString().split('T')[0],
      });
      navigate('/admin');
      return;
    }

    // 2. Поиск в локальной базе
    const foundUser = findUser(loginInput, passwordInput);
    if (foundUser) {
      login(foundUser);
      // ProtectedRoute дальше сам раскидает пользователя (на onboarding, training или meeting)
      navigate('/');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>
      
      <div className="login-container">
        <div className="login-branding">
          <div className="login-logo">
            <Shield size={36} color="var(--accent)" />
          </div>
          <h1>AlfaSVK</h1>
          <p>Закрытый портал выездного агента</p>
        </div>

        <GlassCard className="login-card">
          <form onSubmit={handleLogin} className="login-form">
            <InputGroup 
              id="login" 
              label="Корпоративный логин" 
              placeholder="SVK-IVN-XXXXXX"
              value={loginInput}
              onChange={setLoginInput}
            />
            <InputGroup 
              id="password" 
              label="Пароль" 
              type="password"
              placeholder="Введите пароль"
              value={passwordInput}
              onChange={setPasswordInput}
            />
            
            {error && <div className="login-error">{error}</div>}

            <Button type="submit" block variant="primary" style={{ marginTop: 12 }}>
              Войти в систему
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
