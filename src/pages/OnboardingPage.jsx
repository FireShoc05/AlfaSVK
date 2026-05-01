import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUsersStore } from '../store/useUsersStore';
import { GlassCard, Button, InputGroup } from '../components/ui';
import '../styles/login.css';

export function OnboardingPage() {
  const { user, updateUser: updateAuthUser } = useAuthStore();
  const updateStoreUser = useUsersStore(s => s.updateUser);
  const navigate = useNavigate();

  const [phone, setPhone] = useState(user?.phone || '');
  const [telegram, setTelegram] = useState(user?.telegram || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() && !telegram.trim() && !email.trim()) {
      setError('Необходимо заполнить хотя бы одно поле контакта (Телефон, Telegram или Email)');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    const updates = {
      phone: phone.trim(),
      telegram: telegram.trim(),
      email: email.trim(),
      onboarded: true,
      passwordChanged: true,
      tempPassword: newPassword, // Обновляем пароль
    };

    if (user.role === 'admin' && newLogin.trim()) {
      updates.username = newLogin.trim();
    }

    // Обновляем текущую сессию
    updateAuthUser(updates);
    
    // Обновляем в базе данных
    if (user.id !== 'admin_root') {
      await updateStoreUser(user.id, updates);
    }

    // Перенаправляем на корень, а ProtectedRoute перебросит куда надо (обучение или работа)
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>
      
      <div className="login-container">
        <div className="login-branding" style={{ marginBottom: 16 }}>
          <h2>Добро пожаловать, {user?.fullName}!</h2>
          <p>
            Для завершения настройки профиля <strong>укажите контактные данные</strong> и <strong>смените пароль</strong>.
            <br />
            (Заполните хотя бы одно поле из контактов)
            {user?.role === 'admin' && <><br />Также вы можете изменить свой логин (необязательно).</>}
          </p>
        </div>

        <GlassCard className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
            {user?.role === 'admin' && (
              <InputGroup 
                id="new-login" 
                label="Новый логин (необязательно)" 
                placeholder="Придумайте новый логин"
                value={newLogin}
                onChange={setNewLogin}
              />
            )}
            <InputGroup 
              id="phone" 
              label="Номер телефона" 
              type="tel"
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={setPhone}
            />
            <InputGroup 
              id="telegram" 
              label="Telegram (никнейм)" 
              placeholder="@username"
              value={telegram}
              onChange={setTelegram}
            />
            <InputGroup 
              id="email" 
              label="Электронная почта" 
              type="email"
              placeholder="mail@example.com"
              value={email}
              onChange={setEmail}
            />
            
            <div style={{ marginTop: 16, marginBottom: 16, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <InputGroup 
                id="new-password" 
                label="Новый пароль" 
                type="password"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={setNewPassword}
              />
              <InputGroup 
                id="confirm-password" 
                label="Подтвердите новый пароль" 
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <Button type="submit" block variant="primary" style={{ marginTop: 16 }}>
              Сохранить и продолжить
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
