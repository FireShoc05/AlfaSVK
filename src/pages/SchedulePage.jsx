import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, Clock, X, AlertTriangle } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button, GlassCard, Modal, Badge } from '../components/ui';
import '../styles/calendar.css';

const ODD_HOURS = [9, 11, 13, 15, 17, 19, 21, 23];

export function SchedulePage() {
  const user = useAuthStore(s => s.user);
  const refreshUser = useAuthStore(s => s.refreshUser);
  const { schedules, locks, fetchSchedules, fetchLocks, saveMonthSchedule, acknowledgeScheduleChange } = useScheduleStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Two allowed months: current month and next month
  const today = new Date();
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  const isNextMonth = currentDate.getMonth() === nextMonthDate.getMonth() && currentDate.getFullYear() === nextMonthDate.getFullYear();
  
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Local state for edits
  const [localShifts, setLocalShifts] = useState({});
  const [deletedShifts, setDeletedShifts] = useState(new Set()); // Dates to delete
  
  const [selectedDay, setSelectedDay] = useState(null);
  const [shiftStart, setShiftStart] = useState(9);
  const [shiftEnd, setShiftEnd] = useState(11);
  
  const [isSaving, setIsSaving] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user?.id) {
      fetchSchedules(monthKey, user.id);
      fetchLocks(monthKey);
      setLocalShifts({});
      setDeletedShifts(new Set());
    }
  }, [monthKey, user?.id, fetchSchedules, fetchLocks]);

  const isLocked = locks.some(l => l.userId === user?.id);

  // Initialize localShifts when schedules change
  useEffect(() => {
    const shifts = {};
    schedules.forEach(s => {
      shifts[s.date] = {
        start_time: s.start_time,
        end_time: s.end_time,
        is_extra: s.is_extra
      };
    });
    setLocalShifts(shifts);
    setDeletedShifts(new Set());
  }, [schedules]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust so Monday is 0
  const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const handleDayClick = (day) => {
    if (isLocked) return;
    
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const shift = localShifts[dateStr];
    
    if (shift && shift.is_extra) {
      // Extra shifts cannot be edited by employee
      return;
    }
    
    setSelectedDay(dateStr);
    if (shift) {
      setShiftStart(parseInt(shift.start_time.split(':')[0]));
      setShiftEnd(parseInt(shift.end_time.split(':')[0]));
    } else {
      setShiftStart(9);
      setShiftEnd(11);
    }
  };

  const handleSaveShift = () => {
    const startStr = `${String(shiftStart).padStart(2, '0')}:00`;
    const endStr = `${String(shiftEnd).padStart(2, '0')}:00`;
    
    setLocalShifts(prev => ({
      ...prev,
      [selectedDay]: { start_time: startStr, end_time: endStr, is_extra: false }
    }));
    
    setDeletedShifts(prev => {
      const newSet = new Set(prev);
      newSet.delete(selectedDay);
      return newSet;
    });
    
    setSelectedDay(null);
  };

  const handleRemoveShift = () => {
    setLocalShifts(prev => {
      const next = { ...prev };
      delete next[selectedDay];
      return next;
    });
    
    setDeletedShifts(prev => new Set(prev).add(selectedDay));
    setSelectedDay(null);
  };

  const handleSaveMonth = () => {
    setShowConfirm(true);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown > 0 && showConfirm) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, showConfirm]);

  const confirmSaveMonth = async () => {
    if (countdown > 0 || isSaving) return;
    setIsSaving(true);
    
    const shiftsToUpsert = Object.entries(localShifts)
      .filter(([date, shift]) => !shift.is_extra)
      .map(([date, shift]) => ({
        date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_extra: false
      }));
      
    const datesToDelete = Array.from(deletedShifts);
    
    const success = await saveMonthSchedule(user.id, monthKey, shiftsToUpsert, datesToDelete);
    if (success) {
      fetchLocks(monthKey); // Refresh locks
      setShowConfirm(false);
    }
    setIsSaving(false);
  };

  const getDayElement = (day) => {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const shift = localShifts[dateStr];
    
    let content;
    if (shift) {
      content = (
        <div className="calendar-day__shift">
          <span className="calendar-day__time">{shift.start_time} - {shift.end_time}</span>
          {shift.is_extra && <span className="calendar-day__badge calendar-day__badge--extra">Доп. смена</span>}
        </div>
      );
    } else {
      content = <div className="calendar-day__off">Выходной</div>;
    }
    
    const isPast = new Date(dateStr) < new Date(today.setHours(0,0,0,0));

    return (
      <div 
        key={day} 
        className={`calendar-day ${shift ? 'calendar-day--active' : ''} ${isLocked ? 'calendar-day--locked' : ''} ${shift?.is_extra ? 'calendar-day--extra-locked' : ''} ${isPast ? 'calendar-day--past' : ''}`}
        onClick={() => !isPast && handleDayClick(day)}
      >
        <div className="calendar-day__num">{day}</div>
        {content}
      </div>
    );
  };

  const handleAcknowledge = async () => {
    if (user?.id) {
      await acknowledgeScheduleChange(user.id);
      refreshUser();
    }
  };

  // Build calendar days
  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day calendar-day--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(getDayElement(d));
  }

  // End time options based on selected start time
  const endOptions = ODD_HOURS.filter(h => h > shiftStart);

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1 className="page-header__title"><CalendarIcon size={24} /> Мой график</h1>
        <p className="page-header__subtitle">Настройте свои рабочие смены</p>
      </div>

      {user?.schedule_changed && (
        <GlassCard className="schedule-notification">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle className="text-warning" size={24} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>В графике произошли изменения</h4>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Администратор внес изменения в ваши смены.</p>
            </div>
            <Button variant="ghost" onClick={handleAcknowledge}>
              Скрыть уведомление
            </Button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="calendar-card">
        <div className="calendar-header">
          <button 
            className="calendar-header__nav" 
            onClick={() => setCurrentDate(currentMonthDate)}
            disabled={!isNextMonth}
          >
            <ChevronLeft size={20} />
            <span>Текущий месяц</span>
          </button>
          
          <h2 className="calendar-header__title">
            {currentDate.toLocaleString('ru', { month: 'long', year: 'numeric' }).replace(/^./, str => str.toUpperCase())}
          </h2>
          
          <button 
            className="calendar-header__nav" 
            onClick={() => setCurrentDate(nextMonthDate)}
            disabled={isNextMonth}
          >
            <span>Следующий месяц</span>
            <ChevronRight size={20} />
          </button>
        </div>

        {isLocked && (
          <div className="calendar-locked-banner">
            График на этот месяц зафиксирован и больше не может быть изменен.
          </div>
        )}

        <div className="calendar-grid-header">
          <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
        </div>
        
        <div className="calendar-grid">
          {calendarDays}
        </div>

        {!isLocked && (
          <div className="calendar-actions">
            <Button variant="primary" block onClick={handleSaveMonth} style={{ padding: '16px', fontSize: '16px' }}>
              <Save size={18} /> Сохранить график на {currentDate.toLocaleString('ru', { month: 'long' })}
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Edit Shift Modal */}
      <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)} title="Настройка смены">
        <div className="shift-modal-body">
          <div className="shift-date">
            {selectedDay && new Date(selectedDay).toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          
          <div className="shift-selectors">
            <div className="shift-selector">
              <label>Начало смены</label>
              <select 
                className="admin-link-row__input"
                value={shiftStart} 
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setShiftStart(val);
                  if (shiftEnd <= val) setShiftEnd(val + 2);
                }}
              >
                {ODD_HOURS.slice(0, -1).map(h => (
                  <option key={`start-${h}`} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            
            <div className="shift-selector">
              <label>Конец смены</label>
              <select 
                className="admin-link-row__input"
                value={shiftEnd} 
                onChange={e => setShiftEnd(parseInt(e.target.value))}
              >
                {endOptions.map(h => (
                  <option key={`end-${h}`} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="shift-modal-actions">
            <Button variant="outline-danger" onClick={handleRemoveShift} block>Убрать смену (Выходной)</Button>
            <Button variant="primary" onClick={handleSaveShift} block>Применить часы</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Save Month Modal */}
      <Modal isOpen={showConfirm} onClose={() => { if (!isSaving) setShowConfirm(false); }} title="Подтверждение графика">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            Вы уверены, что хотите зафиксировать график? После сохранения вы не сможете вносить изменения в расписание на этот месяц.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="ghost" block onClick={() => setShowConfirm(false)} disabled={isSaving}>Вернуться</Button>
            <Button 
              variant="success" 
              block 
              onClick={confirmSaveMonth} 
              disabled={countdown > 0 || isSaving}
            >
              {countdown > 0 ? `Точно сохранить? (${countdown})` : isSaving ? 'Сохранение...' : 'Точно сохранить'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
