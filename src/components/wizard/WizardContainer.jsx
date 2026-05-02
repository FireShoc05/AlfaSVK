import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import '../../styles/wizard.css';
import { useWizardStore } from '../../store/useWizardStore';
import { useMeetingsStore } from '../../store/useMeetingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Button, GlassCard, Toggle, Checkbox, Stepper, Modal } from '../ui';
import { formatCurrency, generateMeetingJSON, calculateTotal } from '../../utils/formatters';
import {
  CreditCard,
  Package,
  Wrench,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Trash2,
  CheckCircle,
  Smartphone,
} from 'lucide-react';

/* ─── Step Indicator ───────────────────────── */
function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: 'Продукты' },
    { num: 2, label: 'Доп.' },
    { num: 3, label: 'Услуги' },
    { num: 4, label: 'Итоги' },
  ];

  return (
    <div className="step-indicator">
      {steps.map((step, i) => (
        <div key={step.num} className="step-indicator__step-wrap" style={{ display: 'contents' }}>
          <div
            className={`step-indicator__step ${
              current === step.num ? 'step-indicator__step--active' :
              current > step.num ? 'step-indicator__step--completed' : ''
            }`}
          >
            <div className="step-indicator__dot">
              {current > step.num ? <Check size={14} /> : step.num}
            </div>
            <span className="step-indicator__label">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-indicator__line ${current > step.num ? 'step-indicator__line--filled' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Sticky Bank (Копилка) ────────────────── */
function StickyBank({ total }) {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevTotal = useRef(total);

  useEffect(() => {
    if (total !== prevTotal.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 300);
      prevTotal.current = total;
      return () => clearTimeout(timer);
    }
  }, [total]);

  return (
    <div className="sticky-bank">
      <span className="sticky-bank__icon">🏦</span>
      <span className={`sticky-bank__amount ${isPulsing ? 'sticky-bank__amount--pulse' : ''}`}>
        {total.toLocaleString('ru-RU')}
      </span>
      <span className="sticky-bank__currency">₽</span>
    </div>
  );
}

/* ─── Step 1: Основные продукты ────────────── */
function Step1() {
  const { mainProducts, toggleMainProduct, setMainProductOption, setMainCardOption, setMainProductQuantity } = useWizardStore();
  const MAIN_PRODUCTS = useSettingsStore((s) => s.productsMain);

  return (
    <div>
      <h2 className="step-title"><CreditCard size={22} /> Основные продукты</h2>
      <div className="product-grid">
        {MAIN_PRODUCTS.map((product) => {
          const selected = mainProducts[product.id]?.selected;
          const isToggle = product.type === 'toggle';
          const hasStepper = !!product.hasStepper;
          const sel = mainProducts[product.id];

          // Non-stepper product card
          if (!hasStepper) {
            return (
              <div
                key={product.id}
                className={`product-card ${selected ? 'product-card--selected' : ''}`}
                onClick={() => toggleMainProduct(product.id, false)}
              >
                <div className="product-card__check">
                  <Check size={14} />
                </div>
                <div className="product-card__icon">
                  {isToggle ? <Smartphone size={22} /> : <CreditCard size={22} />}
                </div>
                <div className="product-card__name">{product.name}</div>
                <div className="product-card__price">{formatCurrency(product.price)}</div>

                {selected && !isToggle && product.options.length > 0 && (
                  <div className="product-options" onClick={(e) => e.stopPropagation()}>
                    <div className="product-options__title">Опции:</div>
                    {product.options.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        id={`${product.id}-${opt.id}`}
                        checked={!!mainProducts[product.id]?.options[opt.id]}
                        onChange={(val) => setMainProductOption(product.id, opt.id, val)}
                        label={opt.label}
                        value={opt.bonus > 0 ? `+${opt.bonus}` : '+0'}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Stepper product (like cross stepper but in main category)
          return (
            <div key={product.id} className={`cross-card ${selected ? 'cross-card--selected' : ''}`}>
              <div className="cross-card__header">
                <div>
                  <div className="cross-card__name">{product.name}</div>
                  <div className="cross-card__price">{formatCurrency(product.price)} за шт.</div>
                </div>
                <Toggle
                  id={`main-${product.id}`}
                  checked={!!selected}
                  onChange={() => toggleMainProduct(product.id, true)}
                />
              </div>

              {selected && (
                <div className="cross-card__options">
                  <div className="cross-card__stepper">
                    <span className="cross-card__stepper-label">Количество:</span>
                    <Stepper
                      value={sel?.quantity || 0}
                      onChange={(val) => setMainProductQuantity(product.id, val)}
                      min={0}
                      max={product.maxQty || 5}
                    />
                  </div>

                  {(sel?.cards || []).map((card, cardIndex) => (
                    <div key={cardIndex} className="cross-card__card-group">
                      <div className="cross-card__card-label">Штука {cardIndex + 1}</div>
                      {product.options.map((opt) => (
                        <Checkbox
                          key={opt.id}
                          id={`${product.id}-card${cardIndex}-${opt.id}`}
                          checked={!!card[opt.id]}
                          onChange={(val) => setMainCardOption(product.id, cardIndex, opt.id, val)}
                          label={opt.label}
                          value={opt.bonus > 0 ? `+${opt.bonus}` : '+0'}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 2: Доп. продукты ────────────────── */
function Step2() {
  const { crossProducts, toggleCrossProduct, setCrossProductOption, setCrossCardOption, setCrossProductQuantity } = useWizardStore();
  const CROSS_PRODUCTS = useSettingsStore((s) => s.productsCross);

  return (
    <div>
      <h2 className="step-title"><Package size={22} /> Доп. продукты</h2>
      {CROSS_PRODUCTS.map((product) => {
        const state = crossProducts[product.id];
        const selected = state?.selected;

        return (
          <div key={product.id} className={`cross-card ${selected ? 'cross-card--selected' : ''}`}>
            <div className="cross-card__header">
              <div>
                <div className="cross-card__name">{product.name}</div>
                <div className="cross-card__price">{formatCurrency(product.price)} базовая</div>
              </div>
              <Toggle
                id={`cross-${product.id}`}
                checked={!!selected}
                onChange={() => toggleCrossProduct(product.id, product.hasStepper)}
              />
            </div>

            {selected && !product.hasStepper && (
              <div className="cross-card__options">
                {product.options.map((opt) => {
                  const isChecked = !!state.options?.[opt.id];
                  const displayValue = opt.bonus > 0 ? `+${opt.bonus}` : '+0';
                  return (
                    <Checkbox
                      key={opt.id}
                      id={`${product.id}-${opt.id}`}
                      checked={isChecked}
                      onChange={(val) => setCrossProductOption(product.id, opt.id, val)}
                      label={opt.label}
                      value={displayValue}
                    />
                  );
                })}
              </div>
            )}

            {selected && product.hasStepper && (
              <div className="cross-card__options">
                {/* Степпер сверху */}
                <div className="cross-card__stepper">
                  <span className="cross-card__stepper-label">Количество карт:</span>
                  <Stepper
                    value={state.quantity || 0}
                    onChange={(val) => setCrossProductQuantity(product.id, val)}
                    min={0}
                    max={product.maxQty}
                  />
                </div>

                {/* Отдельные чекбоксы для каждой карты */}
                {(state.cards || []).map((card, cardIndex) => (
                  <div key={cardIndex} className="cross-card__card-group">
                    <div className="cross-card__card-label">Карта {cardIndex + 1}</div>
                    {product.options.map((opt) => (
                      <Checkbox
                        key={opt.id}
                        id={`${product.id}-card${cardIndex}-${opt.id}`}
                        checked={!!card[opt.id]}
                        onChange={(val) => setCrossCardOption(product.id, cardIndex, opt.id, val)}
                        label={opt.label}
                        value={opt.bonus > 0 ? `+${opt.bonus}` : '+0'}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 3: Услуги ───────────────────────── */
function Step3() {
  const { services, toggleService, toggleExpandableService, setServiceOption, setServiceCardOption, setServiceQuantity } = useWizardStore();
  const SERVICES = useSettingsStore((s) => s.productsServices);

  return (
    <div>
      <h2 className="step-title"><Wrench size={22} /> Услуги</h2>
      {SERVICES.map((service) => {
        const isToggleType = service.type === 'toggle';
        const isExpandable = service.type === 'expandable';
        const hasStepper = !!service.hasStepper;

        // Toggle service (simple on/off, no stepper)
        if (isToggleType && !hasStepper) {
          const isActive = !!services[service.id];
          return (
            <div key={service.id} className={`service-card ${isActive ? 'service-card--active' : ''}`}>
              <div className="service-card__info">
                <div className="service-card__name">{service.name}</div>
                <div className="service-card__bonus">+{formatCurrency(service.bonus)}</div>
              </div>
              <Toggle
                id={`service-${service.id}`}
                checked={isActive}
                onChange={(val) => toggleService(service.id, val)}
              />
            </div>
          );
        }

        // Toggle service with stepper (multiple instances, no options per instance)
        if (isToggleType && hasStepper) {
          const state = services[service.id];
          const isActive = !!state?.active;

          return (
            <div key={service.id} className={`cross-card ${isActive ? 'cross-card--selected' : ''}`}>
              <div className="cross-card__header">
                <div>
                  <div className="cross-card__name">{service.name}</div>
                  <div className="cross-card__price">+{formatCurrency(service.bonus)} за шт.</div>
                </div>
                <Toggle
                  id={`service-${service.id}`}
                  checked={isActive}
                  onChange={() => toggleExpandableService(service.id, true)}
                />
              </div>

              {isActive && (
                <div className="cross-card__options">
                  <div className="cross-card__stepper">
                    <span className="cross-card__stepper-label">Количество:</span>
                    <Stepper
                      value={state?.quantity || 0}
                      onChange={(val) => setServiceQuantity(service.id, val)}
                      min={0}
                      max={service.maxQty || 5}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Expandable service WITHOUT stepper (original behavior)
        if (isExpandable && !hasStepper) {
          const state = services[service.id];
          const isActive = !!state?.active;

          return (
            <div key={service.id} className={`cross-card ${isActive ? 'cross-card--selected' : ''}`}>
              <div className="cross-card__header">
                <div>
                  <div className="cross-card__name">{service.name}</div>
                  <div className="cross-card__price">{formatCurrency(0)} базовая</div>
                </div>
                <Toggle
                  id={`service-${service.id}`}
                  checked={isActive}
                  onChange={() => toggleExpandableService(service.id, false)}
                />
              </div>

              {isActive && service.options && (
                <div className="cross-card__options">
                  {service.options.map((opt) => {
                    const isChecked = !!state.options?.[opt.id];
                    return (
                      <Checkbox
                        key={opt.id}
                        id={`service-${service.id}-${opt.id}`}
                        checked={isChecked}
                        onChange={(val) => setServiceOption(service.id, opt.id, val)}
                        label={opt.label}
                        value={`+${opt.bonus}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Expandable service WITH stepper
        if (isExpandable && hasStepper) {
          const state = services[service.id];
          const isActive = !!state?.active;

          return (
            <div key={service.id} className={`cross-card ${isActive ? 'cross-card--selected' : ''}`}>
              <div className="cross-card__header">
                <div>
                  <div className="cross-card__name">{service.name}</div>
                  <div className="cross-card__price">{formatCurrency(service.bonus || 0)} базовая</div>
                </div>
                <Toggle
                  id={`service-${service.id}`}
                  checked={isActive}
                  onChange={() => toggleExpandableService(service.id, true)}
                />
              </div>

              {isActive && (
                <div className="cross-card__options">
                  <div className="cross-card__stepper">
                    <span className="cross-card__stepper-label">Количество:</span>
                    <Stepper
                      value={state?.quantity || 0}
                      onChange={(val) => setServiceQuantity(service.id, val)}
                      min={0}
                      max={service.maxQty || 5}
                    />
                  </div>

                  {(state?.cards || []).map((card, cardIndex) => (
                    <div key={cardIndex} className="cross-card__card-group">
                      <div className="cross-card__card-label">Штука {cardIndex + 1}</div>
                      {service.options?.map((opt) => (
                        <Checkbox
                          key={opt.id}
                          id={`service-${service.id}-card${cardIndex}-${opt.id}`}
                          checked={!!card[opt.id]}
                          onChange={(val) => setServiceCardOption(service.id, cardIndex, opt.id, val)}
                          label={opt.label}
                          value={opt.bonus > 0 ? `+${opt.bonus}` : '+0'}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

/* ─── Step 4: Итоги ────────────────────────── */
function Step4({ onComplete, onDelete }) {
  const state = useWizardStore();
  const MAIN_PRODUCTS = useSettingsStore((s) => s.productsMain);
  const CROSS_PRODUCTS = useSettingsStore((s) => s.productsCross);
  const SERVICES = useSettingsStore((s) => s.productsServices);
  const total = calculateTotal(state, MAIN_PRODUCTS, CROSS_PRODUCTS, SERVICES);

  const mainSelected = MAIN_PRODUCTS.filter((p) => state.mainProducts[p.id]?.selected);
  const crossSelected = CROSS_PRODUCTS.filter((p) => state.crossProducts[p.id]?.selected);
  const servicesSelected = SERVICES.filter((s) => state.services[s.id]);

  return (
    <div>
      <h2 className="step-title"><ClipboardCheck size={22} /> Итоги встречи</h2>

      <div className="receipt">
        <div className="receipt__header">📋 Чек встречи</div>

        {mainSelected.length > 0 && (
          <div className="receipt__section">
            <div className="receipt__section-title">Основные продукты</div>
            {mainSelected.map((product) => {
              const sel = state.mainProducts[product.id];

              // Stepper main product
              if (product.hasStepper) {
                const count = sel.quantity || 1;
                const cards = sel.cards || [];
                let earned = 0;
                cards.forEach((card) => {
                  earned += product.price;
                  product.options.forEach((o) => {
                    if (card[o.id]) earned += o.bonus;
                  });
                });
                return (
                  <div key={product.id}>
                    <div className="receipt__item">
                      <span className="receipt__item-name">
                        {product.name} {count > 1 ? `×${count}` : ''}
                      </span>
                      <span className="receipt__item-value">{formatCurrency(earned)}</span>
                    </div>
                  </div>
                );
              }

              // Non-stepper main product
              let earned = product.price;
              product.options.forEach((o) => { if (sel.options[o.id]) earned += o.bonus; });
              const activeOpts = product.options.filter((o) => sel.options[o.id]).map((o) => o.label);

              return (
                <div key={product.id}>
                  <div className="receipt__item">
                    <span className="receipt__item-name">{product.name}</span>
                    <span className="receipt__item-value">{formatCurrency(earned)}</span>
                  </div>
                  {activeOpts.length > 0 && (
                    <div className="receipt__item-options">✓ {activeOpts.join(', ')}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {crossSelected.length > 0 && (
          <div className="receipt__section">
            <div className="receipt__section-title">Доп. продукты</div>
            {crossSelected.map((product) => {
              const sel = state.crossProducts[product.id];
              let earned = 0;
              let count = 1;
              
              if (product.hasStepper) {
                count = sel.quantity || 1;
                const cards = sel.cards || [];
                cards.forEach((card) => {
                  product.options.forEach((o) => {
                    if (card[o.id]) earned += o.bonus;
                  });
                });
              } else {
                product.options.forEach((o) => {
                  if (sel.options?.[o.id]) earned += o.bonus;
                });
              }

              return (
                <div key={product.id}>
                  <div className="receipt__item">
                    <span className="receipt__item-name">
                      {product.name} {product.hasStepper && count > 1 ? `×${count}` : ''}
                    </span>
                    <span className="receipt__item-value">{formatCurrency(earned)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {servicesSelected.length > 0 && (
          <div className="receipt__section">
            <div className="receipt__section-title">Услуги</div>
            {servicesSelected.map((service) => {
              let earned = service.bonus;
              const sel = state.services[service.id];
              
              if (service.hasStepper && sel?.active) {
                // Stepper service: bonus * quantity + card options
                const count = sel.quantity || 1;
                earned = service.bonus * count;
                if (sel.cards) {
                  sel.cards.forEach((card) => {
                    service.options?.forEach((o) => {
                      if (card[o.id]) earned += o.bonus;
                    });
                  });
                }
              } else if (service.type === 'expandable' && sel?.active) {
                service.options?.forEach((o) => {
                  if (sel.options?.[o.id]) earned += o.bonus;
                });
              }

              const count = sel?.quantity || 1;

              return (
                <div key={service.id} className="receipt__item">
                  <span className="receipt__item-name">
                    {service.name} {service.hasStepper && count > 1 ? `×${count}` : ''}
                  </span>
                  <span className="receipt__item-value">{formatCurrency(earned)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="receipt__total">
          <span className="receipt__total-label">Итого заработок:</span>
          <span className="receipt__total-value">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="wizard-actions">
        <Button variant="outline-danger" block onClick={onDelete}>
          <Trash2 size={16} /> Удалить встречу
        </Button>
        <Button variant="success" block onClick={onComplete}>
          <CheckCircle size={16} /> Завершить встречу
        </Button>
      </div>
    </div>
  );
}

/* ─── Wizard Container ─────────────────────── */
export function WizardContainer({ onBack }) {
  const store = useWizardStore();
  const { currentStep, nextStep, prevStep, resetWizard } = store;
  const MAIN_PRODUCTS = useSettingsStore((s) => s.productsMain);
  const CROSS_PRODUCTS = useSettingsStore((s) => s.productsCross);
  const SERVICES = useSettingsStore((s) => s.productsServices);
  const fetchProducts = useSettingsStore((s) => s.fetchProducts);
  const productsLoaded = useSettingsStore((s) => s.productsLoaded);
  const total = calculateTotal(store, MAIN_PRODUCTS, CROSS_PRODUCTS, SERVICES);
  const addMeeting = useMeetingsStore((s) => s.addMeeting);
  const user = useAuthStore((s) => s.user);
  const [showSuccess, setShowSuccess] = useState(false);
  const [meetingId, setMeetingId] = useState('');

  useEffect(() => {
    if (user?.group_id) {
      fetchProducts(user.group_id);
    }
  }, [fetchProducts, user?.group_id]);

  const handleComplete = async () => {
    const json = generateMeetingJSON(store, user?.fullName || 'АДМИН', meetingId.trim(), MAIN_PRODUCTS, CROSS_PRODUCTS, SERVICES);
    console.log('📦 Meeting JSON:', JSON.stringify(json, null, 2));
    await addMeeting(json, user?.id, user?.group_id);
    setShowSuccess(true);
  };

  const handleDelete = () => {
    resetWizard();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    resetWizard();
    setMeetingId('');
    if (onBack) onBack();
  };

  return (
    <div className="wizard">
      <div className="page-header">
        <h1 className="page-header__title">Успешная встреча</h1>
        <p className="page-header__subtitle">Заполните данные о продажах</p>
      </div>

      {onBack && (
        <button className="rejection-back-btn" onClick={onBack} style={{ marginBottom: '12px' }}>
          <ChevronLeft size={18} /> Назад к выбору
        </button>
      )}

      {/* Meeting ID field */}
      <div className="wizard-meeting-id">
        <label className="wizard-meeting-id__label">ID встречи</label>
        <div className="meeting-id-group">
          <input
            type="text"
            className="wizard-meeting-id__input"
            placeholder="Введите ID встречи"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setMeetingId('ЗАБЫЛ')}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
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

      <StepIndicator current={currentStep} />
      <StickyBank total={total} />

      {!productsLoaded ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: '15px' }}>
          <p>⏳ Загрузка товаров...</p>
        </div>
      ) : (
        <>
          {currentStep === 1 && <Step1 />}
          {currentStep === 2 && <Step2 />}
          {currentStep === 3 && <Step3 />}
          {currentStep === 4 && <Step4 onComplete={handleComplete} onDelete={handleDelete} />}
        </>
      )}

      {currentStep < 4 && (
        <div className="wizard-actions">
          {currentStep > 1 && (
            <Button variant="ghost" onClick={prevStep}>
              <ChevronLeft size={16} /> Назад
            </Button>
          )}
          <Button variant="primary" block onClick={nextStep} disabled={!meetingId.trim()}>
            Далее <ChevronRight size={16} />
          </Button>
        </div>
      )}



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
          <h3 className="success-screen__title">Встреча завершена!</h3>
          <p className="success-screen__subtitle">Данные сохранены. Вы заработали {formatCurrency(total)}.</p>
        </div>
      </Modal>
    </div>
  );
}
