import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, UserPlus, KeyRound, Copy, Check, Trash2, FileX, Link2, Save, Trophy, Package, BarChart3, CalendarDays } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUsersStore } from '../../store/useUsersStore';
import { useRejectionsStore } from '../../store/useRejectionsStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GlassCard, Button, InputGroup, Badge } from '../../components/ui';
import { AdminProductsTab } from './AdminProductsTab';
import { AdminLeaderboardTab } from './AdminLeaderboardTab';
import { AdminStatisticsTab } from './AdminStatisticsTab';
import { AdminMeetingsTab } from './AdminMeetingsTab';
import { AdminScheduleTab } from './AdminScheduleTab';
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
  const { logout, user } = useAuthStore();
  const { users, fetchUsers, addUser, regeneratePassword, updateUser, deleteUser } = useUsersStore();
  const { links, customLinks, fetchLinks, saveLinks, saveCustomLinks } = useSettingsStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users');

  // Links tab state
  const [linkMaxUrl, setLinkMaxUrl] = useState('');
  const [linkSfagoUrl, setLinkSfagoUrl] = useState('');
  const [customLinksLocal, setCustomLinksLocal] = useState([]);
  const [linksSaving, setLinksSaving] = useState(false);
  const [linksSaved, setLinksSaved] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkDesc, setNewLinkDesc] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => {
    if (user?.group_id) {
      fetchUsers(user.group_id);
      fetchLinks(user.group_id);
    }
  }, [fetchUsers, fetchLinks, user?.group_id]);

  // Sync link inputs when settings load
  useEffect(() => {
    setLinkMaxUrl(links.max_url || '');
    setLinkSfagoUrl(links.sfago_url || '');
  }, [links]);

  useEffect(() => {
    setCustomLinksLocal(customLinks || []);
  }, [customLinks]);

  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState('Действующий сотрудник');
  const [copiedId, setCopiedId] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const newLogin = generateLogin(fullName);
    const newPassword = generatePassword();

    await addUser({
      fullName: fullName.trim(),
      username: newLogin,
      tempPassword: newPassword,
      status, // "На обучении" | "Действующий сотрудник"
      role: 'agent',
    }, user.group_id);

    setFullName('');
    setStatus('Действующий сотрудник');
  };

  const handleRegenerate = async (userId) => {
    if (window.confirm('Сгенерировать новый одноразовый пароль для этого сотрудника?')) {
      const newPass = generatePassword();
      await regeneratePassword(userId, newPass);
    }
  };

  const toggleAdminRole = async (userObj) => {
    if (window.confirm(`Изменить права пользователя ${userObj.fullName}?`)) {
      const newRole = userObj.role === 'admin' ? 'agent' : 'admin';
      await updateUser(userObj.id, { role: newRole });
    }
  };

  const handleDelete = async (userObj) => {
    if (window.confirm(`Вы уверены, что хотите безвозвратно удалить сотрудника: ${userObj.fullName}?`)) {
      await deleteUser(userObj.id);
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

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tabs__tab ${activeTab === 'users' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <UserPlus size={16} /> Сотрудники
        </button>
        <button
          className={`admin-tabs__tab ${activeTab === 'meetings' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('meetings')}
        >
          <FileX size={16} /> Встречи
        </button>
        <button
          className={`admin-tabs__tab ${activeTab === 'schedule' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <CalendarDays size={16} /> График
        </button>
        <button
          className={`admin-tabs__tab ${activeTab === 'links' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('links')}
        >
          <Link2 size={16} /> Ссылки
        </button>
        <button
          className={`admin-tabs__tab ${activeTab === 'leaderboard' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={16} /> Лидерборд
        </button>
        <button
          className={`admin-tabs__tab ${activeTab === 'statistics' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <BarChart3 size={16} /> Статистика
        </button>
        <button
          className={`admin-tabs__tab ${activeTab === 'products' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} /> Товары
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
        <>
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
                    <th>Контакты</th>
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
                      <td style={{ fontSize: '0.85em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {u.phone && <div>📞 {u.phone}</div>}
                        {u.telegram && <div>✈️ {u.telegram}</div>}
                        {u.email && <div>✉️ {u.email}</div>}
                        {!u.phone && !u.telegram && !u.email && <span style={{opacity: 0.5}}>Нет данных</span>}
                      </td>
                      <td>
                        <Badge variant={u.role === 'admin' ? 'accent' : 'primary'}>
                          {u.role === 'admin' ? 'Админ' : 'Агент'}
                        </Badge>
                      </td>
                      <td>
                        <button 
                          className="status-toggle-btn"
                          onClick={() => {
                            const newStatus = u.status === 'На обучении' ? 'Действующий сотрудник' : 'На обучении';
                            updateUser(u.id, { status: newStatus });
                          }}
                          title="Нажмите для смены статуса"
                        >
                          <Badge variant={u.status === 'На обучении' ? 'warning' : 'success'}>
                            {u.status}
                          </Badge>
                        </button>
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
        </>
        )}

        {/* MEETINGS TAB */}
        {activeTab === 'meetings' && <AdminMeetingsTab />}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && <AdminScheduleTab />}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <GlassCard className="admin-card">
            <h3 className="admin-card__title">
              <Link2 size={18} /> Управление ссылками
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-lg)' }}>
              Ссылки MAX и SFAGo отображаются как кнопки в сайдбаре. Оставьте пустым, чтобы скрыть.
            </p>

            {/* Permanent quick links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="admin-link-row">
                <div className="admin-link-row__label">
                  <span className="admin-link-badge">MAX</span>
                </div>
                <input
                  type="url"
                  className="admin-link-row__input"
                  placeholder="https://..."
                  value={linkMaxUrl}
                  onChange={(e) => { setLinkMaxUrl(e.target.value); setLinksSaved(false); }}
                />
              </div>

              <div className="admin-link-row">
                <div className="admin-link-row__label">
                  <span className="admin-link-badge">SFAGo</span>
                </div>
                <input
                  type="url"
                  className="admin-link-row__input"
                  placeholder="https://..."
                  value={linkSfagoUrl}
                  onChange={(e) => { setLinkSfagoUrl(e.target.value); setLinksSaved(false); }}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="admin-link-divider">
              <span>Полезные ссылки для сотрудников</span>
            </div>

            {/* Custom links list */}
            {customLinksLocal.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                {customLinksLocal.map((cl, i) => (
                  <div key={i} className="admin-custom-link">
                    <div className="admin-custom-link__info">
                      <div className="admin-custom-link__title">{cl.title}</div>
                      {cl.description && <div className="admin-custom-link__desc">{cl.description}</div>}
                      <div className="admin-custom-link__url">{cl.url}</div>
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => {
                      setCustomLinksLocal(customLinksLocal.filter((_, idx) => idx !== i));
                      setLinksSaved(false);
                    }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new link form */}
            {showAddLink ? (
              <div className="admin-add-link-form">
                <input
                  type="text"
                  className="admin-link-row__input"
                  placeholder="Название"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                />
                <input
                  type="text"
                  className="admin-link-row__input"
                  placeholder="Краткое описание (необязательно)"
                  value={newLinkDesc}
                  onChange={(e) => setNewLinkDesc(e.target.value)}
                />
                <input
                  type="url"
                  className="admin-link-row__input"
                  placeholder="https://..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                    onClick={() => {
                      setCustomLinksLocal([...customLinksLocal, {
                        title: newLinkTitle.trim(),
                        description: newLinkDesc.trim(),
                        url: newLinkUrl.trim(),
                      }]);
                      setNewLinkTitle('');
                      setNewLinkDesc('');
                      setNewLinkUrl('');
                      setShowAddLink(false);
                      setLinksSaved(false);
                    }}
                  >
                    <Check size={14} /> Добавить
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setShowAddLink(false);
                    setNewLinkTitle('');
                    setNewLinkDesc('');
                    setNewLinkUrl('');
                  }}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddLink(true)} style={{ marginBottom: 'var(--space-lg)' }}>
                + Добавить ссылку
              </Button>
            )}

            {/* Save all button */}
            <div>
              <Button
                variant={linksSaved ? 'success' : 'primary'}
                disabled={linksSaving}
                onClick={async () => {
                  setLinksSaving(true);
                  const ok1 = await saveLinks({ max_url: linkMaxUrl.trim(), sfago_url: linkSfagoUrl.trim() }, user?.group_id);
                  const ok2 = await saveCustomLinks(customLinksLocal, user?.group_id);
                  setLinksSaving(false);
                  if (ok1 && ok2) setLinksSaved(true);
                }}
              >
                {linksSaved ? <><Check size={16} /> Сохранено</> : <><Save size={16} /> {linksSaving ? 'Сохранение...' : 'Сохранить всё'}</>}
              </Button>
            </div>
          </GlassCard>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && <AdminLeaderboardTab />}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && <AdminStatisticsTab />}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && <AdminProductsTab />}
      </div>
    </div>
  );
}
