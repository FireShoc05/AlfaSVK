import { useState } from 'react';
import { XCircle, Save, ChevronLeft, CheckCircle, AlertTriangle, ArrowRightLeft, Ban, ShieldAlert } from 'lucide-react';
import { Button, GlassCard, Modal } from '../ui';
import { useRejectionsStore } from '../../store/useRejectionsStore';
import { useAuthStore } from '../../store/useAuthStore';
import '../../styles/wizard.css';

const REJECTION_TYPES = [
  { value: 'НДЗ', label: 'НДЗ', icon: <AlertTriangle size={18} /> },
  { value: 'Перенос', label: 'Перенос', icon: <ArrowRightLeft size={18} /> },
  { value: 'Отказ', label: 'Отказ', icon: <Ban size={18} /> },
  { value: '911', label: '911', icon: <ShieldAlert size={18} /> },
];

const TRANSFER_REASONS = [
  'Нет ДУЛ в день встречи',
  'Перенос по ИК',
];

const REFUSAL_REASONS = [
  'ДУЛ не совпал или отсутствует',
  'Отказ от фото',
  'Ошибка на встрече',
  'Вне зоны доставки',
  'Заявка дубль',
  'Категорический отказ',
  'Не заказывал продукт',
  'В отделении',
];

export function RejectionForm({ onBack }) {
  const user = useAuthStore((s) => s.user);
  const addRejection = useRejectionsStore((s) => s.addRejection);

  const [meetingId, setMeetingId] = useState('');
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const needsReason = type === 'Перенос' || type === 'Отказ';
  const needsTransferDate = type === 'Перенос';
  const reasonOptions = type === 'Перенос' ? TRANSFER_REASONS : type === 'Отказ' ? REFUSAL_REASONS : [];

  // Format date input with auto-dots: dd.mm.yyyy
  const handleDateInput = (rawValue) => {
    // Strip non-digits
    const digits = rawValue.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += '.' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '.' + digits.slice(4, 8);
    setTransferDate(formatted);
  };

  // Validate transfer date is in the future
  const isTransferDateValid = () => {
    if (!needsTransferDate) return true;
    if (!transferDate) return false;
    const parts = transferDate.split('.');
    if (parts.length !== 3) return false;
    const [dd, mm, yyyy] = parts.map(Number);
    if (!dd || !mm || !yyyy || String(yyyy).length !== 4) return false;
    const date = new Date(yyyy, mm - 1, dd);
    if (isNaN(date.getTime())) return false;
    // Verify the date components match (catches invalid dates like 32.13.2026)
    if (date.getDate() !== dd || date.getMonth() !== mm - 1) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const isFormValid = () => {
    if (!meetingId.trim()) return false;
    if (!type) return false;
    if (needsReason && !reason) return false;
    if (needsTransferDate && !isTransferDateValid()) return false;
    if (type === '911' && !comment.trim()) return false;
    return true;
  };

  const handleSave = async () => {
    if (!isFormValid() || saving) return;
    setSaving(true);

    const success = await addRejection({
      userId: user?.id,
      meetingId: meetingId.trim(),
      type,
      reason: needsReason ? reason : null,
      transferDate: needsTransferDate ? transferDate : null,
      comment: comment.trim() || null,
    });

    setSaving(false);
    if (success) {
      setShowSuccess(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setMeetingId('');
    setType('');
    setReason('');
    setTransferDate('');
    setComment('');
    if (onBack) onBack();
  };

  // Reset dependent fields when type changes
  const handleTypeChange = (newType) => {
    setType(newType);
    setReason('');
    setTransferDate('');
    setComment('');
  };

  return (
    <div className="wizard">
      <div className="page-header">
        <h1 className="page-header__title">Неуспешная встреча</h1>
        <p className="page-header__subtitle">Заполните данные о неуспешной встрече</p>
      </div>

      <button className="rejection-back-btn" onClick={onBack}>
        <ChevronLeft size={18} /> Назад к выбору
      </button>

      <GlassCard className="rejection-card">
        {/* Meeting ID */}
        <div className="rejection-field">
          <label className="rejection-field__label">ID встречи</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="rejection-field__input"
              placeholder="Введите ID встречи"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              style={{ flex: 1, margin: 0 }}
            />
            <button
              type="button"
              onClick={() => setMeetingId('ЗАБЫЛ')}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            >
              Забыл ID
            </button>
          </div>
        </div>

        {/* Rejection type */}
        <div className="rejection-field">
          <label className="rejection-field__label">Вид отказа</label>
          <div className="rejection-type-grid">
            {REJECTION_TYPES.map((rt) => (
              <button
                key={rt.value}
                className={`rejection-type-btn ${type === rt.value ? 'rejection-type-btn--active' : ''}`}
                onClick={() => handleTypeChange(rt.value)}
              >
                {rt.icon}
                <span>{rt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reason (conditional) */}
        {needsReason && (
          <div className="rejection-field">
            <label className="rejection-field__label">Причина</label>
            <div className="rejection-reason-list">
              {reasonOptions.map((r) => (
                <button
                  key={r}
                  className={`rejection-reason-btn ${reason === r ? 'rejection-reason-btn--active' : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transfer date (conditional) */}
        {needsTransferDate && (
          <div className="rejection-field">
            <label className="rejection-field__label">День переноса</label>
            <input
              type="text"
              className="rejection-field__input"
              placeholder="дд.мм.гггг"
              value={transferDate}
              onChange={(e) => handleDateInput(e.target.value)}
              maxLength={10}
              inputMode="numeric"
            />
            {transferDate && !isTransferDateValid() && (
              <span className="rejection-field__error">Введите корректную дату в будущем (дд.мм.гггг)</span>
            )}
          </div>
        )}

        {/* Comment (for Перенос, Отказ and 911) */}
        {(needsReason || type === '911') && (
          <div className="rejection-field">
            <label className="rejection-field__label">
              Комментарий {type !== '911' && <span className="rejection-field__optional">(необязательно)</span>}
            </label>
            <textarea
              className="rejection-field__textarea"
              placeholder="Комментарий о встрече..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </GlassCard>

      {/* Save button */}
      <div className="wizard-actions" style={{ marginTop: '16px' }}>
        <Button
          variant="primary"
          block
          disabled={!isFormValid() || saving}
          onClick={handleSave}
        >
          <Save size={16} /> {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      {/* Success modal */}
      <Modal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        footer={
          <Button variant="primary" block onClick={handleSuccessClose}>
            Отлично!
          </Button>
        }
      >
        <div className="success-screen">
          <div className="success-screen__icon">
            <CheckCircle />
          </div>
          <h3 className="success-screen__title">Запись сохранена!</h3>
          <p className="success-screen__subtitle">Данные о неуспешной встрече отправлены.</p>
        </div>
      </Modal>
    </div>
  );
}
