import { Check } from 'lucide-react';

export function Button({ children, variant = 'primary', size = 'md', block = false, disabled = false, onClick, className = '', ...props }) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function GlassCard({ children, active = false, interactive = false, onClick, className = '', ...props }) {
  const classes = [
    'glass-card',
    active && 'glass-card--active',
    interactive && 'glass-card--interactive',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
}

export function Checkbox({ checked, onChange, label, value, id }) {
  return (
    <label className={`checkbox ${checked ? 'checkbox--checked' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="checkbox__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="checkbox__box">
        <Check className="checkbox__icon" />
      </span>
      <span className="checkbox__content">
        <span className="checkbox__label">{label}</span>
        {value !== undefined && (
          <span className="checkbox__value">{value}</span>
        )}
      </span>
    </label>
  );
}

export function Stepper({ value, onChange, min = 0, max = 5 }) {
  return (
    <div className="stepper">
      <button
        className="stepper__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        type="button"
      >
        −
      </button>
      <span className="stepper__value">{value}</span>
      <button
        className="stepper__btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        type="button"
      >
        +
      </button>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tabs__tab ${activeTab === tab.id ? 'tabs__tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function InputGroup({ label, id, type = 'text', placeholder, value, onChange }) {
  return (
    <div className="input-group">
      {label && <label className="input-group__label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        type={type}
        className="input-group__field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Badge({ children, variant = 'accent' }) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

export function PlaceholderPage({ icon, title, description }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__icon">{icon}</div>
      <h2 className="placeholder-page__title">{title}</h2>
      <p className="placeholder-page__description">{description}</p>
    </div>
  );
}
