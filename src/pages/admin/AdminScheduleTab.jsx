import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User as UserIcon, Plus, X, Search, Clock } from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useUsersStore } from '../../store/useUsersStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard, Button, Modal, Badge } from '../../components/ui';

const ODD_HOURS = [9, 11, 13, 15, 17, 19, 21, 23];

export function AdminScheduleTab() {
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' or 'personal'
  
  return (
    <div className="admin-tab">
      <div style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: '800', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={24} color="var(--accent)" /> Управление графиками
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Контроль и редактирование смен сотрудников</p>
        </div>
      </div>
      
      <div className="admin-tabs-sub">
        <button 
          className={`admin-tabs-sub__btn ${activeSubTab === 'general' ? 'admin-tabs-sub__btn--active' : ''}`}
          onClick={() => setActiveSubTab('general')}
        >
          Общий график
        </button>
        <button 
          className={`admin-tabs-sub__btn ${activeSubTab === 'personal' ? 'admin-tabs-sub__btn--active' : ''}`}
          onClick={() => setActiveSubTab('personal')}
        >
          Личный график
        </button>
      </div>

      {activeSubTab === 'general' ? <GeneralSchedule /> : <PersonalSchedule />}
    </div>
  );
}

function GeneralSchedule() {
  const { schedules, fetchSchedules, adminDeleteShift, adminSaveShift } = useScheduleStore();
  const { users, fetchUsers } = useUsersStore();
  const { user } = useAuthStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedDay, setSelectedDay] = useState(null); // 'YYYY-MM-DD'
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [shiftStart, setShiftStart] = useState(9);
  const [shiftEnd, setShiftEnd] = useState(11);
  const [isExtra, setIsExtra] = useState(false);
  
  const [editingShiftId, setEditingShiftId] = useState(null);

  useEffect(() => {
    if (user?.group_id) {
      fetchUsers(user.group_id);
    }
  }, [fetchUsers, user?.group_id]);

  useEffect(() => {
    if (user?.group_id) {
      fetchSchedules(monthKey, null, user.group_id);
    }
  }, [monthKey, fetchSchedules, user?.group_id]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const acc = {};
    schedules.forEach(s => {
      if (!acc[s.date]) acc[s.date] = [];
      acc[s.date].push(s);
    });
    return acc;
  }, [schedules]);

  const handleDayClick = (day) => {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    resetForm();
  };

  const resetForm = () => {
    setSelectedUserToAdd('');
    setShiftStart(9);
    setShiftEnd(11);
    setIsExtra(false);
    setEditingShiftId(null);
  };

  const handleEditShiftClick = (shift) => {
    setEditingShiftId(shift.id);
    setSelectedUserToAdd(shift.userId);
    setShiftStart(parseInt(shift.start_time.split(':')[0]));
    setShiftEnd(parseInt(shift.end_time.split(':')[0]));
    setIsExtra(shift.is_extra);
  };

  const handleSaveShift = async () => {
    if (!selectedUserToAdd) return;
    const startStr = `${String(shiftStart).padStart(2, '0')}:00`;
    const endStr = `${String(shiftEnd).padStart(2, '0')}:00`;
    
    await adminSaveShift(selectedUserToAdd, selectedDay, startStr, endStr, isExtra);
    if (user?.group_id) fetchSchedules(monthKey, null, user.group_id);
    resetForm();
  };

  const handleDeleteShift = async (userId) => {
    if (window.confirm('Точно удалить смену сотрудника?')) {
      await adminDeleteShift(userId, selectedDay);
      if (user?.group_id) fetchSchedules(monthKey, null, user.group_id);
      if (editingShiftId) resetForm();
    }
  };

  const getDayElement = (day) => {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const daySchedules = schedulesByDate[dateStr] || [];

    return (
      <div 
        key={day} 
        className="calendar-day"
        onClick={() => handleDayClick(day)}
        style={{ justifyContent: 'flex-start', alignItems: 'flex-start', overflow: 'hidden' }}
      >
        <div className="calendar-day__num">{day}</div>
        <div style={{ marginTop: '20px', width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {daySchedules.slice(0, 4).map(s => (
            <div key={s.id} style={{ fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: s.is_extra ? 'rgba(168, 85, 247, 0.2)' : 'var(--glass-bg)', padding: '2px 4px', borderRadius: '4px', color: s.is_extra ? '#c084fc' : 'var(--text-secondary)' }}>
              {s.users?.fullName?.split(' ')[0]} {s.start_time.replace(/^0/, '')}-{s.end_time.replace(/^0/, '')}
            </div>
          ))}
          {daySchedules.length > 4 && (
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              +{daySchedules.length - 4} ещё
            </div>
          )}
        </div>
      </div>
    );
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day calendar-day--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(getDayElement(d));
  }

  const selectedDaySchedules = selectedDay ? (schedulesByDate[selectedDay] || []) : [];

  return (
    <GlassCard className="calendar-card">
      <div className="calendar-header">
        <button 
          className="calendar-header__nav" 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
        >
          <ChevronLeft size={20} />
          <span>Пред. месяц</span>
        </button>
        
        <h2 className="calendar-header__title">
          {currentDate.toLocaleString('ru', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase())}
        </h2>
        
        <button 
          className="calendar-header__nav" 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
        >
          <span>След. месяц</span>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-grid-header">
        <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
      </div>
      <div className="calendar-grid">
        {calendarDays}
      </div>

      <Modal isOpen={!!selectedDay} onClose={() => { setSelectedDay(null); resetForm(); }} title={`Смены на ${selectedDay}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ margin: '0 0 var(--space-sm)' }}>{editingShiftId ? 'Редактировать смену' : 'Добавить сотрудника'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <select 
                className="admin-link-row__input" 
                value={selectedUserToAdd}
                onChange={e => setSelectedUserToAdd(e.target.value)}
                disabled={!!editingShiftId}
              >
                <option value="">Выберите сотрудника...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>
                ))}
              </select>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  className="admin-link-row__input"
                  value={shiftStart}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setShiftStart(val);
                    if (shiftEnd <= val) setShiftEnd(val + 2);
                  }}
                  style={{ flex: 1 }}
                >
                  {ODD_HOURS.slice(0, -1).map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
                </select>
                <select 
                  className="admin-link-row__input"
                  value={shiftEnd}
                  onChange={e => setShiftEnd(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                >
                  {ODD_HOURS.filter(h => h > shiftStart).map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={isExtra} onChange={e => setIsExtra(e.target.checked)} />
                Дополнительная смена
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="primary" onClick={handleSaveShift} disabled={!selectedUserToAdd} block>
                  Сохранить
                </Button>
                {editingShiftId && (
                  <Button variant="ghost" onClick={resetForm}>Отмена</Button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 var(--space-sm)' }}>Сотрудники в смене ({selectedDaySchedules.length}):</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedDaySchedules.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Нет сотрудников на этот день.</p>}
              {selectedDaySchedules.map(shift => (
                <div key={shift.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{shift.users?.fullName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{shift.start_time} - {shift.end_time}</div>
                    {shift.is_extra && <Badge variant="accent">Доп. смена</Badge>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="ghost" onClick={() => handleEditShiftClick(shift)} style={{ padding: '6px' }}><Clock size={16} /></Button>
                    <Button variant="ghost" onClick={() => handleDeleteShift(shift.userId)} style={{ padding: '6px', color: 'var(--danger)' }}><X size={16} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </GlassCard>
  );
}

function PersonalSchedule() {
  const { schedules, fetchSchedules, adminSaveShift, adminDeleteShift } = useScheduleStore();
  const { users, fetchUsers } = useUsersStore();
  const { user } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [selectedDay, setSelectedDay] = useState(null);
  const [shiftStart, setShiftStart] = useState(9);
  const [shiftEnd, setShiftEnd] = useState(11);
  const [isExtra, setIsExtra] = useState(false);

  useEffect(() => {
    if (user?.group_id) {
      fetchUsers(user.group_id);
    }
  }, [fetchUsers, user?.group_id]);

  useEffect(() => {
    if (selectedUser && user?.group_id) {
      fetchSchedules(monthKey, selectedUser.id, user.group_id);
    }
  }, [selectedUser, monthKey, fetchSchedules, user?.group_id]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return users.filter(u => u.fullName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term));
  }, [users, searchTerm]);

  const schedulesMap = useMemo(() => {
    const acc = {};
    schedules.forEach(s => {
      acc[s.date] = s;
    });
    return acc;
  }, [schedules]);

  const handleDayClick = (day) => {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const shift = schedulesMap[dateStr];
    
    setSelectedDay(dateStr);
    if (shift) {
      setShiftStart(parseInt(shift.start_time.split(':')[0]));
      setShiftEnd(parseInt(shift.end_time.split(':')[0]));
      setIsExtra(shift.is_extra);
    } else {
      setShiftStart(9);
      setShiftEnd(11);
      setIsExtra(false);
    }
  };

  const handleSaveShift = async () => {
    const startStr = `${String(shiftStart).padStart(2, '0')}:00`;
    const endStr = `${String(shiftEnd).padStart(2, '0')}:00`;
    await adminSaveShift(selectedUser.id, selectedDay, startStr, endStr, isExtra);
    if (user?.group_id) fetchSchedules(monthKey, selectedUser.id, user.group_id);
    setSelectedDay(null);
  };

  const handleRemoveShift = async () => {
    if (schedulesMap[selectedDay]) {
      await adminDeleteShift(selectedUser.id, selectedDay);
      if (user?.group_id) fetchSchedules(monthKey, selectedUser.id, user.group_id);
    }
    setSelectedDay(null);
  };

  if (!selectedUser) {
    return (
      <GlassCard className="calendar-card">
        <h3 style={{ marginBottom: '16px' }}>Поиск сотрудника</h3>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              className="admin-link-row__input" 
              placeholder="Введите ФИО или логин..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredUsers.map(u => (
            <div 
              key={u.id} 
              style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
              onClick={() => { setSelectedUser(u); setSearchTerm(''); }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {u.fullName.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>{u.fullName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{u.username} • {u.role === 'admin' ? 'Администратор' : 'Сотрудник'}</div>
              </div>
            </div>
          ))}
          {searchTerm && filteredUsers.length === 0 && <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>Сотрудники не найдены</div>}
        </div>
      </GlassCard>
    );
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const getDayElement = (day) => {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const shift = schedulesMap[dateStr];
    
    let content;
    if (shift) {
      content = (
        <div className="calendar-day__shift">
          <span className="calendar-day__time">
            <span className="time-start">{shift.start_time.replace(/^0/, '')}</span>
            <span className="time-sep">-</span>
            <span className="time-end">{shift.end_time.replace(/^0/, '')}</span>
          </span>
          {shift.is_extra && <span className="calendar-day__badge calendar-day__badge--extra">Доп. смена</span>}
        </div>
      );
    } else {
      content = <div className="calendar-day__off">Выходной</div>;
    }

    return (
      <div 
        key={day} 
        className={`calendar-day ${shift ? 'calendar-day--active' : ''}`}
        onClick={() => handleDayClick(day)}
      >
        <div className="calendar-day__num">{day}</div>
        {content}
      </div>
    );
  };

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day calendar-day--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(getDayElement(d));
  }

  return (
    <GlassCard className="calendar-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="ghost" onClick={() => setSelectedUser(null)} style={{ padding: '8px' }}>
            <ChevronLeft size={20} /> Назад
          </Button>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-subtle)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {selectedUser.fullName.charAt(0)}
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{selectedUser.fullName}</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{selectedUser.username}</div>
          </div>
        </div>
      </div>

      <div className="calendar-header">
        <button 
          className="calendar-header__nav" 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
        >
          <ChevronLeft size={20} />
          <span>Пред. месяц</span>
        </button>
        
        <h2 className="calendar-header__title">
          {currentDate.toLocaleString('ru', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase())}
        </h2>
        
        <button 
          className="calendar-header__nav" 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
        >
          <span>След. месяц</span>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-grid-header">
        <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
      </div>
      <div className="calendar-grid">
        {calendarDays}
      </div>

      <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)} title={`Смена ${selectedDay}`}>
        <div className="shift-modal-body">
          <div className="shift-selectors">
            <div className="shift-selector">
              <label>Начало смены</label>
              <select className="admin-link-row__input" value={shiftStart} onChange={e => {
                const val = parseInt(e.target.value);
                setShiftStart(val);
                if (shiftEnd <= val) setShiftEnd(val + 2);
              }}>
                {ODD_HOURS.slice(0, -1).map(h => <option key={`start-${h}`} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
            
            <div className="shift-selector">
              <label>Конец смены</label>
              <select className="admin-link-row__input" value={shiftEnd} onChange={e => setShiftEnd(parseInt(e.target.value))}>
                {ODD_HOURS.filter(h => h > shiftStart).map(h => <option key={`end-${h}`} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px', fontSize: '14px' }}>
            <input type="checkbox" checked={isExtra} onChange={e => setIsExtra(e.target.checked)} />
            Дополнительная смена
          </label>
          
          <div className="shift-modal-actions">
            <Button variant="outline-danger" onClick={handleRemoveShift} block>Убрать смену (Выходной)</Button>
            <Button variant="primary" onClick={handleSaveShift} block>Применить часы</Button>
          </div>
        </div>
      </Modal>
    </GlassCard>
  );
}
