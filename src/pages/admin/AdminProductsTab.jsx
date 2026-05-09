import { useState, useEffect, useRef, useCallback } from 'react';
import { Package, Plus, Trash2, Save, Check, Edit3, X, CreditCard, Wrench, ChevronDown, ChevronUp, Download, Upload, FileCheck } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard, Button, Modal } from '../../components/ui';
import { exportConfig, importConfig, summariseConfig } from '../../utils/configIO';
import '../../styles/admin.css';

/* ── Helpers ──────────────────────────────────── */

const generateId = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const CATEGORY_META = {
  main: {
    title: 'Основные продукты',
    icon: <CreditCard size={18} />,
    typeOptions: [
      { value: 'card', label: 'Карта (с опциями)' },
      { value: 'toggle', label: 'Переключатель (без опций)' },
    ],
  },
  cross: {
    title: 'Доп. продукты',
    icon: <Package size={18} />,
    typeOptions: [
      { value: 'default', label: 'Обычный (без степпера)' },
      { value: 'stepper', label: 'Со степпером (несколько штук)' },
    ],
  },
  services: {
    title: 'Услуги',
    icon: <Wrench size={18} />,
    typeOptions: [
      { value: 'toggle', label: 'Переключатель (фиксированный бонус)' },
      { value: 'expandable', label: 'Раскрывающийся (условные бонусы)' },
    ],
  },
};

// Label for hasStepper checkbox by category
const STEPPER_LABELS = {
  main: 'Множественный (можно добавить несколько штук)',
  cross: null, // cross uses type selector instead
  services: 'Множественный (можно добавить несколько штук)',
};

/* ── Empty product templates ─────────────────── */

function newMainProduct() {
  return { id: generateId(), name: '', price: 0, type: 'card', options: [] };
}

function newCrossProduct() {
  return { id: generateId(), name: '', price: 0, hasStepper: false, maxQty: 5, options: [] };
}

function newService() {
  return { id: generateId(), name: '', type: 'toggle', bonus: 0, options: [] };
}

/* ── Product Editor Modal ────────────────────── */

function ProductEditorModal({ isOpen, onClose, product, category, onSave, onDelete }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (product) {
      setForm(JSON.parse(JSON.stringify(product))); // deep clone
    }
  }, [product]);

  if (!isOpen || !form) return null;

  const meta = CATEGORY_META[category];

  const handleFieldChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    setForm((f) => {
      const opts = [...(f.options || [])];
      opts[index] = { ...opts[index], [field]: value };
      return { ...f, options: opts };
    });
  };

  const addOption = () => {
    setForm((f) => ({
      ...f,
      options: [...(f.options || []), { id: generateId(), label: '', bonus: 0 }],
    }));
  };

  const removeOption = (index) => {
    setForm((f) => ({
      ...f,
      options: (f.options || []).filter((_, i) => i !== index),
    }));
  };

  const handleTypeChange = (value) => {
    if (category === 'cross') {
      setForm((f) => ({
        ...f,
        hasStepper: value === 'stepper',
      }));
    } else {
      setForm((f) => ({ ...f, type: value }));
    }
  };

  const currentType = category === 'cross'
    ? (form.hasStepper ? 'stepper' : 'default')
    : form.type;

  // Whether this product type supports options
  const showOptions = category === 'main'
    ? form.type === 'card'
    : category === 'cross'
      ? true
      : form.type === 'expandable';

  const showBasePrice = category !== 'services';
  const showBaseBonus = category === 'services';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.name ? `Редактирование: ${form.name}` : 'Новый продукт'}
    >
      <div className="product-editor">
        {/* Name */}
        <div className="product-editor__field">
          <label className="product-editor__label">Название</label>
          <input
            className="admin-link-row__input"
            value={form.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="Название продукта"
          />
        </div>

        {/* Type */}
        <div className="product-editor__field">
          <label className="product-editor__label">Тип</label>
          <select
            className="admin-link-row__input"
            value={currentType}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            {meta.typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Base price / bonus */}
        {showBasePrice && (
          <div className="product-editor__field">
            <label className="product-editor__label">Базовая выплата (₽)</label>
            <input
              type="number"
              className="admin-link-row__input"
              value={form.price}
              onChange={(e) => handleFieldChange('price', Number(e.target.value) || 0)}
              min="0"
            />
          </div>
        )}

        {showBaseBonus && (
          <div className="product-editor__field">
            <label className="product-editor__label">Базовый бонус (₽)</label>
            <input
              type="number"
              className="admin-link-row__input"
              value={form.bonus || 0}
              onChange={(e) => handleFieldChange('bonus', Number(e.target.value) || 0)}
              min="0"
            />
          </div>
        )}

        {/* hasStepper checkbox for main & services */}
        {(category === 'main' || category === 'services') && STEPPER_LABELS[category] && (
          <div className="product-editor__field">
            <label className="product-editor__label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!form.hasStepper}
                onChange={(e) => {
                  handleFieldChange('hasStepper', e.target.checked);
                  if (!e.target.checked) handleFieldChange('maxQty', undefined);
                  else if (!form.maxQty) handleFieldChange('maxQty', 5);
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              {STEPPER_LABELS[category]}
            </label>
          </div>
        )}

        {/* Max qty for stepper (any category) */}
        {form.hasStepper && (
          <div className="product-editor__field">
            <label className="product-editor__label">Макс. количество</label>
            <input
              type="number"
              className="admin-link-row__input"
              value={form.maxQty || 5}
              onChange={(e) => handleFieldChange('maxQty', Number(e.target.value) || 1)}
              min="1"
              max="20"
            />
          </div>
        )}

        {/* Options / Conditions */}
        {showOptions && (
          <div className="product-editor__options-section">
            <div className="product-editor__options-header">
              <label className="product-editor__label">Условия выплат</label>
            </div>

            {(form.options || []).length === 0 && (
              <div className="product-editor__empty-options">Нет условий — выплата фиксированная</div>
            )}

            {(form.options || []).map((opt, i) => (
              <div key={i} className="product-editor__option-row">
                <input
                  className="admin-link-row__input"
                  value={opt.label}
                  onChange={(e) => handleOptionChange(i, 'label', e.target.value)}
                  placeholder="Условие (напр. ТР от 1000 руб)"
                  style={{ flex: 2 }}
                />
                <div className="product-editor__option-bonus">
                  <span className="product-editor__option-bonus-label">+</span>
                  <input
                    type="number"
                    className="admin-link-row__input"
                    value={opt.bonus}
                    onChange={(e) => handleOptionChange(i, 'bonus', Number(e.target.value) || 0)}
                    placeholder="0"
                    style={{ width: '90px' }}
                    min="0"
                  />
                  <span className="product-editor__option-bonus-label">₽</span>
                </div>
                <button className="product-editor__option-delete" onClick={() => removeOption(i)}>
                  <X size={16} />
                </button>
              </div>
            ))}

            <button className="product-editor__add-option" onClick={addOption}>
              <Plus size={14} /> Добавить условие
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="product-editor__actions">
          {onDelete && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => {
                if (window.confirm(`Удалить "${form.name || 'продукт'}"?`)) {
                  onDelete(form.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={14} /> Удалить
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!form.name.trim()}
            onClick={() => {
              onSave(form);
              onClose();
            }}
          >
            <Save size={14} /> Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Product Card (compact, in list) ─────────── */

function ProductCard({ product, category, onClick }) {
  const getTypeLabel = () => {
    let label = '';
    if (category === 'main') label = product.type === 'card' ? 'Карта' : 'Переключатель';
    else if (category === 'cross') label = product.hasStepper ? 'Со степпером' : 'Обычный';
    else if (category === 'services') label = product.type === 'toggle' ? 'Переключатель' : 'Раскрывающийся';
    if ((category === 'main' || category === 'services') && product.hasStepper) label += ' ×N';
    return label;
  };

  const getPrice = () => {
    if (category === 'services') return product.bonus || 0;
    return product.price || 0;
  };

  const optionsCount = (product.options || []).length;

  return (
    <div className="admin-product-card" onClick={onClick}>
      <div className="admin-product-card__info">
        <div className="admin-product-card__name">{product.name}</div>
        <div className="admin-product-card__meta">
          <span className="admin-product-card__type">{getTypeLabel()}</span>
          {optionsCount > 0 && (
            <span className="admin-product-card__opts">{optionsCount} усл.</span>
          )}
        </div>
      </div>
      <div className="admin-product-card__price">
        {getPrice() > 0 ? `${getPrice()} ₽` : '—'}
      </div>
      <div className="admin-product-card__arrow">
        <Edit3 size={16} />
      </div>
    </div>
  );
}

/* ── Category Section ────────────────────────── */

function CategorySection({ title, icon, products, category, onEdit, onCreate, onDelete, onSave }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <GlassCard className="admin-card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div className="admin-category-header" onClick={() => setCollapsed(!collapsed)}>
        <h3 className="admin-card__title" style={{ marginBottom: 0, cursor: 'pointer' }}>
          {icon} {title} ({products.length})
          {collapsed ? <ChevronDown size={18} style={{ marginLeft: 8 }} /> : <ChevronUp size={18} style={{ marginLeft: 8 }} />}
        </h3>
      </div>

      {!collapsed && (
        <>
          <div className="admin-product-list">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                category={category}
                onClick={() => onEdit(p)}
              />
            ))}
            {products.length === 0 && (
              <div className="admin-empty">Нет продуктов в этой категории</div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onCreate}
            style={{ marginTop: 'var(--space-md)' }}
          >
            <Plus size={14} /> Создать новый
          </Button>
        </>
      )}
    </GlassCard>
  );
}

/* ── Diff helpers ─────────────────────────────── */

function computeDiff(original, local, category) {
  const origMap = new Map(original.map((p) => [p.id, p]));
  const localMap = new Map(local.map((p) => [p.id, p]));

  const added = local.filter((p) => !origMap.has(p.id));
  const deleted = original.filter((p) => !localMap.has(p.id));
  const modified = local.filter((p) => {
    const orig = origMap.get(p.id);
    if (!orig) return false;
    return JSON.stringify(orig) !== JSON.stringify(p);
  });

  return { added, deleted, modified, category };
}

function getCategoryLabel(cat) {
  if (cat === 'main') return 'Основные продукты';
  if (cat === 'cross') return 'Доп. продукты';
  return 'Услуги';
}

function getProductPrice(p, category) {
  if (category === 'services') return p.bonus || 0;
  return p.price || 0;
}

/* ── Changes Preview Modal ───────────────────── */

function ChangesPreviewModal({ isOpen, onClose, diffs, onConfirm, onRevertAll, saving }) {
  if (!isOpen) return null;

  const totalChanges = diffs.reduce(
    (sum, d) => sum + d.added.length + d.deleted.length + d.modified.length,
    0
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Предпросмотр изменений">
      <div className="changes-preview">
        {totalChanges === 0 ? (
          <div className="admin-empty" style={{ margin: 'var(--space-lg) 0' }}>
            Нет изменений для сохранения
          </div>
        ) : (
          diffs.map((diff) => {
            const hasChanges = diff.added.length + diff.deleted.length + diff.modified.length > 0;
            if (!hasChanges) return null;

            return (
              <div key={diff.category} className="changes-preview__category">
                <div className="changes-preview__category-title">
                  {getCategoryLabel(diff.category)}
                </div>

                {/* Deleted */}
                {diff.deleted.length > 0 && (
                  <div className="changes-preview__section">
                    <div className="changes-preview__section-title changes-preview__section-title--danger">
                      🗑️ Удалённые ({diff.deleted.length})
                    </div>
                    {diff.deleted.map((p) => (
                      <div key={p.id} className="changes-preview__item changes-preview__item--deleted">
                        <span className="changes-preview__item-name">{p.name}</span>
                        <span className="changes-preview__item-price">{getProductPrice(p, diff.category)} ₽</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modified */}
                {diff.modified.length > 0 && (
                  <div className="changes-preview__section">
                    <div className="changes-preview__section-title changes-preview__section-title--warning">
                      ✏️ Изменённые ({diff.modified.length})
                    </div>
                    {diff.modified.map((p) => (
                      <div key={p.id} className="changes-preview__item changes-preview__item--modified">
                        <span className="changes-preview__item-name">{p.name}</span>
                        <span className="changes-preview__item-price">{getProductPrice(p, diff.category)} ₽</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Added */}
                {diff.added.length > 0 && (
                  <div className="changes-preview__section">
                    <div className="changes-preview__section-title changes-preview__section-title--success">
                      ➕ Добавленные ({diff.added.length})
                    </div>
                    {diff.added.map((p) => (
                      <div key={p.id} className="changes-preview__item changes-preview__item--added">
                        <span className="changes-preview__item-name">{p.name}</span>
                        <span className="changes-preview__item-price">{getProductPrice(p, diff.category)} ₽</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Actions */}
        <div className="changes-preview__actions">
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => {
              onRevertAll();
              onClose();
            }}
          >
            <X size={14} /> Отменить всё
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Назад
          </Button>
          {totalChanges > 0 && (
            <Button
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={onConfirm}
            >
              <Save size={14} /> {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ── Config Export Modal ──────────────────────── */

function ConfigExportModal({ isOpen, onClose }) {
  const {
    productsMain, productsCross, productsServices,
    leaderboardTabs, links, customLinks,
  } = useSettingsStore();

  const [sections, setSections] = useState({ products: true, leaderboard: true, links: true });

  const toggle = (key) => setSections((s) => ({ ...s, [key]: !s[key] }));
  const anySelected = sections.products || sections.leaderboard || sections.links;

  const handleExport = () => {
    exportConfig(
      { productsMain, productsCross, productsServices, leaderboardTabs, links, customLinks },
      sections,
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Скачать конфигурацию">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>
          Выберите, какие разделы включить в файл конфигурации.
        </p>

        <div className="config-modal__sections">
          {/* Products */}
          <label className="config-modal__section">
            <input
              type="checkbox"
              className="config-modal__section-checkbox"
              checked={sections.products}
              onChange={() => toggle('products')}
            />
            <div className="config-modal__section-info">
              <div className="config-modal__section-title">📦 Товары и услуги</div>
              <div className="config-modal__section-desc">
                Основные, доп. продукты и услуги
              </div>
              <div className="config-modal__section-stats">
                <span className="config-modal__stat-badge">Основные: {productsMain.length}</span>
                <span className="config-modal__stat-badge">Доп.: {productsCross.length}</span>
                <span className="config-modal__stat-badge">Услуги: {productsServices.length}</span>
              </div>
            </div>
          </label>

          {/* Leaderboard */}
          <label className="config-modal__section">
            <input
              type="checkbox"
              className="config-modal__section-checkbox"
              checked={sections.leaderboard}
              onChange={() => toggle('leaderboard')}
            />
            <div className="config-modal__section-info">
              <div className="config-modal__section-title">🏆 Лидерборд</div>
              <div className="config-modal__section-desc">
                Настройки вкладок рейтинга
              </div>
              <div className="config-modal__section-stats">
                <span className="config-modal__stat-badge">Вкладок: {leaderboardTabs.length}</span>
              </div>
            </div>
          </label>

          {/* Links */}
          <label className="config-modal__section">
            <input
              type="checkbox"
              className="config-modal__section-checkbox"
              checked={sections.links}
              onChange={() => toggle('links')}
            />
            <div className="config-modal__section-info">
              <div className="config-modal__section-title">🔗 Ссылки</div>
              <div className="config-modal__section-desc">
                Быстрые и пользовательские ссылки
              </div>
              <div className="config-modal__section-stats">
                <span className="config-modal__stat-badge">
                  Пользов.: {customLinks.length}
                </span>
              </div>
            </div>
          </label>
        </div>

        <div className="config-modal__actions">
          <Button variant="ghost" size="sm" onClick={onClose}>Отмена</Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!anySelected}
            onClick={handleExport}
          >
            <Download size={14} /> Скачать файл
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Config Import Modal ─────────────────────── */

function ConfigImportModal({ isOpen, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [sections, setSections] = useState({ products: true, leaderboard: true, links: true });
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const reset = useCallback(() => {
    setFile(null);
    setParsed(null);
    setSummary(null);
    setError('');
    setSections({ products: true, leaderboard: true, links: true });
    setDragging(false);
    setImporting(false);
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const handleFile = async (f) => {
    setError('');
    setParsed(null);
    setSummary(null);
    setFile(f);

    try {
      const result = await importConfig(f);
      const sum = summariseConfig(result);
      setParsed(result);
      setSummary(sum);
      // Auto-check available sections, uncheck unavailable
      setSections({
        products: sum.products.available,
        leaderboard: sum.leaderboard.available,
        links: sum.links.available,
      });
    } catch (err) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const toggle = (key) => {
    if (!summary?.[key]?.available) return;
    setSections((s) => ({ ...s, [key]: !s[key] }));
  };

  const anySelected = sections.products || sections.leaderboard || sections.links;

  const handleImport = async () => {
    if (!parsed) return;
    setImporting(true);
    await onImport(parsed, sections);
    setImporting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Загрузить конфигурацию">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

        {/* Dropzone or file info */}
        {!file ? (
          <div
            className={`config-modal__dropzone ${dragging ? 'config-modal__dropzone--active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="config-modal__dropzone-icon" />
            <div className="config-modal__dropzone-text">Перетащите файл сюда</div>
            <div className="config-modal__dropzone-hint">или нажмите для выбора (.alfacfg)</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".alfacfg"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="config-modal__file-info">
            <FileCheck size={18} />
            <span className="config-modal__file-info-name">{file.name}</span>
            <button
              className="config-modal__file-info-remove"
              onClick={() => { reset(); }}
              title="Убрать файл"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && <div className="config-modal__error">⚠️ {error}</div>}

        {/* Section selection (only after successful parse) */}
        {summary && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>
              Выберите разделы для импорта. Данные полностью заменят текущие.
            </p>

            <div className="config-modal__sections">
              {/* Products */}
              <label className={`config-modal__section ${!summary.products.available ? 'config-modal__section--disabled' : ''}`}>
                <input
                  type="checkbox"
                  className="config-modal__section-checkbox"
                  checked={sections.products}
                  onChange={() => toggle('products')}
                  disabled={!summary.products.available}
                />
                <div className="config-modal__section-info">
                  <div className="config-modal__section-title">📦 Товары и услуги</div>
                  {summary.products.available ? (
                    <div className="config-modal__section-stats">
                      <span className="config-modal__stat-badge">Основные: {summary.products.mainCount}</span>
                      <span className="config-modal__stat-badge">Доп.: {summary.products.crossCount}</span>
                      <span className="config-modal__stat-badge">Услуги: {summary.products.servicesCount}</span>
                    </div>
                  ) : (
                    <div className="config-modal__section-desc">Нет в файле</div>
                  )}
                </div>
              </label>

              {/* Leaderboard */}
              <label className={`config-modal__section ${!summary.leaderboard.available ? 'config-modal__section--disabled' : ''}`}>
                <input
                  type="checkbox"
                  className="config-modal__section-checkbox"
                  checked={sections.leaderboard}
                  onChange={() => toggle('leaderboard')}
                  disabled={!summary.leaderboard.available}
                />
                <div className="config-modal__section-info">
                  <div className="config-modal__section-title">🏆 Лидерборд</div>
                  {summary.leaderboard.available ? (
                    <div className="config-modal__section-stats">
                      <span className="config-modal__stat-badge">Вкладок: {summary.leaderboard.count}</span>
                    </div>
                  ) : (
                    <div className="config-modal__section-desc">Нет в файле</div>
                  )}
                </div>
              </label>

              {/* Links */}
              <label className={`config-modal__section ${!summary.links.available ? 'config-modal__section--disabled' : ''}`}>
                <input
                  type="checkbox"
                  className="config-modal__section-checkbox"
                  checked={sections.links}
                  onChange={() => toggle('links')}
                  disabled={!summary.links.available}
                />
                <div className="config-modal__section-info">
                  <div className="config-modal__section-title">🔗 Ссылки</div>
                  {summary.links.available ? (
                    <div className="config-modal__section-stats">
                      <span className="config-modal__stat-badge">Пользов.: {summary.links.customLinksCount}</span>
                    </div>
                  ) : (
                    <div className="config-modal__section-desc">Нет в файле</div>
                  )}
                </div>
              </label>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="config-modal__actions">
          <Button variant="ghost" size="sm" onClick={onClose}>Отмена</Button>
          {summary && (
            <Button
              variant="primary"
              size="sm"
              disabled={!anySelected || importing}
              onClick={handleImport}
            >
              <Upload size={14} /> {importing ? 'Импорт...' : 'Импортировать'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   AdminProductsTab — Main Export
   ════════════════════════════════════════════════ */

export function AdminProductsTab() {
  const {
    productsMain, productsCross, productsServices,
    fetchProducts, saveProductsMain, saveProductsCross, saveProductsServices,
    leaderboardTabs, fetchLeaderboardTabs, saveLeaderboardTabs,
    links, customLinks, fetchLinks, saveLinks, saveCustomLinks,
  } = useSettingsStore();
  const { user } = useAuthStore();

  // Original snapshots (set once when data loads from Supabase)
  const [originalMain, setOriginalMain] = useState([]);
  const [originalCross, setOriginalCross] = useState([]);
  const [originalServices, setOriginalServices] = useState([]);

  // Local copies for editing
  const [localMain, setLocalMain] = useState([]);
  const [localCross, setLocalCross] = useState([]);
  const [localServices, setLocalServices] = useState([]);

  // Modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Changes preview modal
  const [showPreview, setShowPreview] = useState(false);

  // Config modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.group_id) {
      fetchProducts(user.group_id);
      fetchLeaderboardTabs(user.group_id);
      fetchLinks(user.group_id);
    }
  }, [fetchProducts, fetchLeaderboardTabs, fetchLinks, user?.group_id]);

  // Sync local + snapshot when store data loads
  useEffect(() => {
    const cloneMain = JSON.parse(JSON.stringify(productsMain));
    const cloneCross = JSON.parse(JSON.stringify(productsCross));
    const cloneServices = JSON.parse(JSON.stringify(productsServices));

    setOriginalMain(cloneMain);
    setOriginalCross(cloneCross);
    setOriginalServices(cloneServices);

    setLocalMain(JSON.parse(JSON.stringify(productsMain)));
    setLocalCross(JSON.parse(JSON.stringify(productsCross)));
    setLocalServices(JSON.parse(JSON.stringify(productsServices)));

    setSaved(false);
  }, [productsMain, productsCross, productsServices]);

  // Check if there are any changes
  const isDirty = () => {
    return JSON.stringify(localMain) !== JSON.stringify(originalMain)
      || JSON.stringify(localCross) !== JSON.stringify(originalCross)
      || JSON.stringify(localServices) !== JSON.stringify(originalServices);
  };

  // Compute diffs for preview
  const getDiffs = () => [
    computeDiff(originalMain, localMain, 'main'),
    computeDiff(originalCross, localCross, 'cross'),
    computeDiff(originalServices, localServices, 'services'),
  ];

  // ─── Edit / Create / Delete handlers ────────

  const handleEdit = (product, category) => {
    setEditingProduct(product);
    setEditingCategory(category);
  };

  const handleCreate = (category) => {
    let newProduct;
    if (category === 'main') newProduct = newMainProduct();
    else if (category === 'cross') newProduct = newCrossProduct();
    else newProduct = newService();

    setEditingProduct(newProduct);
    setEditingCategory(category);
  };

  const handleSaveProduct = (updatedProduct) => {
    const updateList = (list, setList) => {
      const idx = list.findIndex((p) => p.id === updatedProduct.id);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = updatedProduct;
        setList(copy);
      } else {
        setList([...list, updatedProduct]);
      }
    };

    if (editingCategory === 'main') updateList(localMain, setLocalMain);
    else if (editingCategory === 'cross') updateList(localCross, setLocalCross);
    else updateList(localServices, setLocalServices);

    setSaved(false);
  };

  const handleDeleteProduct = (productId) => {
    if (editingCategory === 'main') setLocalMain((l) => l.filter((p) => p.id !== productId));
    else if (editingCategory === 'cross') setLocalCross((l) => l.filter((p) => p.id !== productId));
    else setLocalServices((l) => l.filter((p) => p.id !== productId));

    setSaved(false);
  };

  // ─── Revert all local changes ─────────────────

  const handleRevertAll = () => {
    setLocalMain(JSON.parse(JSON.stringify(originalMain)));
    setLocalCross(JSON.parse(JSON.stringify(originalCross)));
    setLocalServices(JSON.parse(JSON.stringify(originalServices)));
    setSaved(false);
  };

  // ─── Save all to Supabase ─────────────────────

  const handleConfirmSave = async () => {
    setSaving(true);
    const ok1 = await saveProductsMain(localMain, user?.group_id);
    const ok2 = await saveProductsCross(localCross, user?.group_id);
    const ok3 = await saveProductsServices(localServices, user?.group_id);
    setSaving(false);

    if (ok1 && ok2 && ok3) {
      // Update originals to match what was just saved
      setOriginalMain(JSON.parse(JSON.stringify(localMain)));
      setOriginalCross(JSON.parse(JSON.stringify(localCross)));
      setOriginalServices(JSON.parse(JSON.stringify(localServices)));
      setSaved(true);
      setShowPreview(false);
    }
  };

  // ─── Import handler ───────────────────────────

  const handleConfigImport = async (parsedConfig, selectedSections) => {
    const s = parsedConfig.sections;

    // Products → replace local state (user must press Save)
    if (selectedSections.products && s.products) {
      setLocalMain(s.products.main || []);
      setLocalCross(s.products.cross || []);
      setLocalServices(s.products.services || []);
      setSaved(false);
    }

    // Leaderboard → save directly to Supabase
    if (selectedSections.leaderboard && s.leaderboard) {
      await saveLeaderboardTabs(s.leaderboard, user?.group_id);
    }

    // Links → save directly to Supabase
    if (selectedSections.links && s.links) {
      if (s.links.quick_links) {
        await saveLinks(s.links.quick_links, user?.group_id);
      }
      if (s.links.custom_links) {
        await saveCustomLinks(s.links.custom_links, user?.group_id);
      }
    }
  };

  const dirty = isDirty();

  return (
    <>
      <div className="config-header">
        <div className="config-header__desc">
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', margin: 0 }}>
            Управляйте продуктами и услугами. Изменения вступят в силу для всех агентов после сохранения.
          </p>
        </div>
        <div className="config-toolbar">
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <Download size={14} /> Скачать конфигурацию
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            <Upload size={14} /> Загрузить конфигурацию
          </Button>
        </div>
      </div>

      <CategorySection
        title={CATEGORY_META.main.title}
        icon={CATEGORY_META.main.icon}
        products={localMain}
        category="main"
        onEdit={(p) => handleEdit(p, 'main')}
        onCreate={() => handleCreate('main')}
      />

      <CategorySection
        title={CATEGORY_META.cross.title}
        icon={CATEGORY_META.cross.icon}
        products={localCross}
        category="cross"
        onEdit={(p) => handleEdit(p, 'cross')}
        onCreate={() => handleCreate('cross')}
      />

      <CategorySection
        title={CATEGORY_META.services.title}
        icon={CATEGORY_META.services.icon}
        products={localServices}
        category="services"
        onEdit={(p) => handleEdit(p, 'services')}
        onCreate={() => handleCreate('services')}
      />

      {/* Global save button */}
      <div style={{ position: 'sticky', bottom: 'var(--space-md)', zIndex: 10 }}>
        <Button
          variant={saved ? 'success' : 'primary'}
          block
          disabled={!dirty && !saved}
          onClick={() => {
            if (dirty) {
              setShowPreview(true);
            }
          }}
          style={{
            boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
          }}
        >
          {saved
            ? <><Check size={16} /> Сохранено</>
            : <><Save size={16} /> Сохранить все изменения</>
          }
        </Button>
      </div>

      {/* Editor modal */}
      <ProductEditorModal
        isOpen={!!editingProduct}
        onClose={() => { setEditingProduct(null); setEditingCategory(null); }}
        product={editingProduct}
        category={editingCategory}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
      />

      {/* Changes preview / confirmation modal */}
      <ChangesPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        diffs={getDiffs()}
        onConfirm={handleConfirmSave}
        onRevertAll={handleRevertAll}
        saving={saving}
      />

      {/* Config export / import modals */}
      <ConfigExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <ConfigImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleConfigImport}
      />
    </>
  );
}

