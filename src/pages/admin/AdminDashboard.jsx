import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, UserPlus, KeyRound, Copy, Check, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUsersStore } from '../../store/useUsersStore';
import { GlassCard, Button, InputGroup, Badge } from '../../components/ui';
import '../../styles/admin.css';

// Утилиты для генерации
const cyrillicToLatinMap = {
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH',
  'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS',
  'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
};

const transliterateChar = (char) => cyrillicToLatinMap[char.toUpperCase()] || char.toUpperCase();

const generateLogin = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().toUpperCase().split(/\s+/);
  let initials = '';
  if (parts.length >= 1) initials += transliterateChar(parts[0].charAt(0));
  if (parts.length >= 2) initials += transliterateChar(parts[1].charAt(0));
  if (parts.length >= 3) initials += transliterateChar(parts[2].charAt(0));
  
  // Example: SVK-IVN-492104
  const randomCode = Math.floor(100000 + Math.random() * 900000);
  return `SVK-${initials}-${randomCode}`;
};

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

export function AdminDashboard() {
  const { logout } = useAuthStore();
  const { users, addUser, regeneratePassword, updateUser, deleteUser } = useUsersStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState('Действующий сотрудник');
  const [copiedId, setCopiedId] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const newLogin = generateLogin(fullName);
    const newPassword = generatePassword();

    addUser({
      id: `user_${Date.now()}`,
      fullName: fullName.trim(),
      username: newLogin,
      tempPassword: newPassword,
      status, // "На обучении" | "Действующий сотрудник"
      role: 'agent',
    });

    setFullName('');
    setStatus('Действующий сотрудник');
  };

  const handleRegenerate = (userId) => {
    if (window.confirm('Сгенерировать новый одноразовый пароль для этого сотрудника?')) {
      const newPass = generatePassword();
      regeneratePassword(userId, newPass);
    }
  };

  const toggleAdminRole = (userObj) => {
    if (window.confirm(`Изменить права пользователя ${userObj.fullName}?`)) {
      const newRole = userObj.role === 'admin' ? 'agent' : 'admin';
      updateUser(userObj.id, { role: newRole });
    }
  };

  const handleDelete = (userObj) => {
    if (window.confirm(`Вы уверены, что хотите безвозвратно удалить сотрудника: ${userObj.fullName}?`)) {
      deleteUser(userObj.id);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="admin-layout">
      <div className="admin-header">
        <div className="admin-header__brand">
          <ShieldAlert color="var(--accent)" />
          <h2>AlfaSVK | Admin Panel</h2>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/')} style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
            Вернуться на сайт
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} style={{ marginRight: 8 }} /> Выйти
          </Button>
        </div>
      </div>

      <div className="admin-content">
        {/* ADD USER FORM */}
        <GlassCard className="admin-card">
          <h3 className="admin-card__title">
            <UserPlus size={18} /> Добавить сотрудника
          </h3>
          <form className="admin-form" onSubmit={handleAddUser}>
            <div className="admin-form__row">
              <div style={{ flex: 2 }}>
                <InputGroup 
                  id="fullName" 
                  label="ФИО сотрудника" 
                  placeholder="Иванов Иван Иванович"
                  value={fullName}
                  onChange={setFullName}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="input-group__label">Статус</label>
                <select 
                  className="input-group__field" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--glass-border)' }}
                >
                  <option value="На обучении">На обучении</option>
                  <option value="Действующий сотрудник">Действующий сотрудник</option>
                </select>
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={!fullName.trim()}>
              Сгенерировать доступ
            </Button>
          </form>
        </GlassCard>

        {/* USERS LIST */}
        <GlassCard className="admin-card" style={{ marginTop: 24 }}>
          <h3 className="admin-card__title">База сотрудников ({users.length})</h3>
          
          {users.length === 0 ? (
            <div className="admin-empty">Нет добавленных сотрудников</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Сотрудник</th>
                    <th>Логин</th>
                    <th>Вр. пароль</th>
                    <th>Роль</th>
                    <th>Статус</th>
                    <th>Онборд</th>
                    <th style={{ textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.fullName}</strong>
                      </td>
                      <td className="monospace-cell">
                        {u.username}
                        <button className="copy-btn" onClick={() => copyToClipboard(u.username, u.id + 'login')}>
                          {copiedId === u.id + 'login' ? <Check size={14} color="var(--success)"/> : <Copy size={14} />}
                        </button>
                      </td>
                      <td className="monospace-cell">
                        {u.tempPassword}
                        <button className="copy-btn" onClick={() => copyToClipboard(u.tempPassword, u.id + 'pass')}>
                          {copiedId === u.id + 'pass' ? <Check size={14} color="var(--success)"/> : <Copy size={14} />}
                        </button>
                      </td>
                      <td>
                        <Badge variant={u.role === 'admin' ? 'accent' : 'primary'}>
                          {u.role === 'admin' ? 'Админ' : 'Агент'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={u.status === 'На обучении' ? 'warning' : 'success'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td>
                        {u.onboarded ? '✅ Да' : '⏳ Нет'}
                      </td>
                      <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button variant={u.role === 'admin' ? 'outline' : 'primary'} size="sm" onClick={() => toggleAdminRole(u)}>
                          <ShieldAlert size={14} /> {u.role === 'admin' ? 'Забрать права' : 'Дать админа'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRegenerate(u.id)}>
                          <KeyRound size={14} /> Пароль
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(u)}>
                          <Trash2 size={14} /> 
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
