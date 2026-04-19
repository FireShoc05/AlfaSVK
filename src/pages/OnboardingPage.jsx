import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useUsersStore } from '../store/useUsersStore';
import { GlassCard, Button, InputGroup } from '../components/ui';
import '../styles/login.css'; // We can reuse the login layout for onboarding

export function OnboardingPage() {
  const { user, updateUser: updateAuthUser } = useAuthStore();
  const updateStoreUser = useUsersStore(s => s.updateUser);
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() && !telegram.trim() && !email.trim()) {
      setError('Необходимо заполнить хотя бы одно поле (Телефон, Telegram или Email)');
      return;
    }

    const updates = {
      phone: phone.trim(),
      telegram: telegram.trim(),
      email: email.trim(),
      onboarded: true,
    };

    // Обновляем текущую сессию
    updateAuthUser(updates);
    
    // Обновляем в локальной базе данных
    if (user.id !== 'admin_root') {
      updateStoreUser(user.id, updates);
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
          <p>Для завершения настройки профиля укажите контактные данные. <br /><strong>Заполните хотя бы одно поле.</strong></p>
        </div>

        <GlassCard className="login-card">
          <form onSubmit={handleSubmit} className="login-form">
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
            
            {error && <div className="login-error">{error}</div>}

            <Button type="submit" block variant="primary" style={{ marginTop: 16 }}>
              Подтвердить и продолжить
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
