import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, UserPlus, Users, Trash2, Check, Copy, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSuperAdminStore } from '../../store/useSuperAdminStore';
import { GlassCard, Button, InputGroup, Badge } from '../../components/ui';
import '../../styles/admin.css';

// Utilities for password/login generation
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
  
  const randomCode = Math.floor(100000 + Math.random() * 900000);
  return `MNG-${initials}-${randomCode}`;
};

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let pass = '';
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

export function SuperAdminDashboard() {
  const { logout } = useAuthStore();
  const { groups, managers, loading, fetchData, addGroup, deleteGroup, addManager, deleteManager, updateManagerGroup } = useSuperAdminStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('managers');
  const [copiedId, setCopiedId] = useState(null);

  // Add Group state
  const [newGroupName, setNewGroupName] = useState('');

  // Add Manager state
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerGroup, setNewManagerGroup] = useState('');

  // Editing Manager Group state
  const [editingManagerId, setEditingManagerId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState('');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const result = await addGroup(newGroupName.trim());
    if (!result.success) {
      alert('Ошибка при создании группы: ' + (result.error?.message || JSON.stringify(result.error)));
    } else {
      setNewGroupName('');
    }
  };

  const handleDeleteGroup = async (group) => {
    if (window.confirm(`ВНИМАНИЕ! Вы удаляете группу "${group.name}". Все связанные с ней данные (сотрудники, встречи, настройки) могут быть удалены каскадно. Продолжить?`)) {
      await deleteGroup(group.id);
    }
  };

  const handleAddManager = async (e) => {
    e.preventDefault();
    if (!newManagerName.trim()) return;

    const newLogin = generateLogin(newManagerName);
    const newPassword = generatePassword();

    const result = await addManager({
      fullName: newManagerName.trim(),
      username: newLogin,
      tempPassword: newPassword,
      group_id: newManagerGroup || null,
    });

    if (!result.success) {
      alert('Ошибка при создании начальника: ' + (result.error?.message || JSON.stringify(result.error)));
    } else {
      setNewManagerName('');
      setNewManagerGroup('');
    }
  };

  const handleDeleteManager = async (manager) => {
    if (window.confirm(`Вы уверены, что хотите удалить начальника группы: ${manager.fullName}? Группа при этом сохранится.`)) {
      await deleteManager(manager.id);
    }
  };

  const handleUpdateManagerGroup = async (managerId) => {
    await updateManagerGroup(managerId, editingGroupId || null);
    setEditingManagerId(null);
    setEditingGroupId('');
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
          <h2>AlfaSVK | Super Admin Panel</h2>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} style={{ marginRight: 8 }} /> Выйти
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tabs__tab ${activeTab === 'managers' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('managers')}
        >
          <UserPlus size={16} /> Начальники групп
        </button>
        <button
          className={`admin-tabs__tab ${activeTab === 'groups' ? 'admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <Users size={16} /> Группы
        </button>
      </div>

      <div className="admin-content">
        {loading && <div style={{ color: 'white', textAlign: 'center' }}>Загрузка...</div>}

        {!loading && activeTab === 'managers' && (
          <>
            <GlassCard className="admin-card">
              <h3 className="admin-card__title">
                <UserPlus size={18} /> Добавить начальника группы
              </h3>
              <form className="admin-form" onSubmit={handleAddManager}>
                <div className="admin-form__row">
                  <div style={{ flex: 2 }}>
                    <InputGroup 
                      id="managerName" 
                      label="ФИО начальника" 
                      placeholder="Иванов Иван Иванович"
                      value={newManagerName}
                      onChange={setNewManagerName}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="input-group__label">Прикрепить к группе</label>
                    <select 
                      className="input-group__field" 
                      value={newManagerGroup} 
                      onChange={(e) => setNewManagerGroup(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--glass-border)' }}
                    >
                      <option value="">Без группы</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="submit" variant="primary" disabled={!newManagerName.trim()}>
                  Создать начальника
                </Button>
              </form>
            </GlassCard>

            <GlassCard className="admin-card" style={{ marginTop: 24 }}>
              <h3 className="admin-card__title">Список начальников групп ({managers.length})</h3>
              {managers.length === 0 ? (
                <div className="admin-empty">Нет начальников групп</div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Начальник</th>
                        <th>Группа</th>
                        <th>Логин</th>
                        <th>Вр. пароль</th>
                        <th style={{ textAlign: 'right' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managers.map(m => {
                        const mGroup = groups.find(g => g.id === m.group_id);
                        const isEditingGroup = editingManagerId === m.id;
                        return (
                          <tr key={m.id}>
                            <td><strong>{m.fullName}</strong></td>
                            <td>
                              {isEditingGroup ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <select 
                                    className="input-group__field" 
                                    value={editingGroupId} 
                                    onChange={(e) => setEditingGroupId(e.target.value)}
                                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--glass-border)', padding: '4px', height: 'auto' }}
                                  >
                                    <option value="">Без группы</option>
                                    {groups.map(g => (
                                      <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                  </select>
                                  <Button size="sm" variant="success" onClick={() => handleUpdateManagerGroup(m.id)}>
                                    <Check size={14} />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingManagerId(null)}>
                                    Отмена
                                  </Button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Badge variant={mGroup ? 'primary' : 'warning'}>
                                    {mGroup ? mGroup.name : 'Без группы'}
                                  </Badge>
                                  <button className="copy-btn" onClick={() => { setEditingManagerId(m.id); setEditingGroupId(m.group_id || ''); }}>
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="monospace-cell">
                              {m.username}
                              <button className="copy-btn" onClick={() => copyToClipboard(m.username, m.id + 'login')}>
                                {copiedId === m.id + 'login' ? <Check size={14} color="var(--success)"/> : <Copy size={14} />}
                              </button>
                            </td>
                            <td className="monospace-cell">
                              {m.tempPassword}
                              <button className="copy-btn" onClick={() => copyToClipboard(m.tempPassword, m.id + 'pass')}>
                                {copiedId === m.id + 'pass' ? <Check size={14} color="var(--success)"/> : <Copy size={14} />}
                              </button>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Button variant="outline-danger" size="sm" onClick={() => handleDeleteManager(m)}>
                                <Trash2 size={14} /> 
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </>
        )}

        {!loading && activeTab === 'groups' && (
          <>
            <GlassCard className="admin-card">
              <h3 className="admin-card__title">
                <Users size={18} /> Добавить группу
              </h3>
              <form className="admin-form" onSubmit={handleAddGroup} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <InputGroup 
                    id="groupName" 
                    label="Название / Номер группы" 
                    placeholder="Например: Тест или Группа 1"
                    value={newGroupName}
                    onChange={setNewGroupName}
                  />
                </div>
                <Button type="submit" variant="primary" disabled={!newGroupName.trim()}>
                  Создать
                </Button>
              </form>
            </GlassCard>

            <GlassCard className="admin-card" style={{ marginTop: 24 }}>
              <h3 className="admin-card__title">Список групп ({groups.length})</h3>
              {groups.length === 0 ? (
                <div className="admin-empty">Нет групп</div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Группа</th>
                        <th>Начальник</th>
                        <th>Кол-во сотрудников</th>
                        <th style={{ textAlign: 'right' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(g => (
                        <tr key={g.id}>
                          <td><strong>{g.name}</strong></td>
                          <td>
                            {g.manager ? (
                              <span>{g.manager.fullName}</span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)' }}>Отсутствует</span>
                            )}
                          </td>
                          <td>{g.employeesCount}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteGroup(g)}>
                              <Trash2 size={14} /> Удалить
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
      </div>
    </div>
  );
}
