import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Save, Check, Edit3, X, CreditCard, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { GlassCard, Button, Modal } from '../../components/ui';
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

        {/* Max qty for stepper */}
        {category === 'cross' && form.hasStepper && (
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
    if (category === 'main') return product.type === 'card' ? 'Карта' : 'Переключатель';
    if (category === 'cross') return product.hasStepper ? 'Со степпером' : 'Обычный';
    if (category === 'services') return product.type === 'toggle' ? 'Переключатель' : 'Раскрывающийся';
    return '';
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

/* ════════════════════════════════════════════════
   AdminProductsTab — Main Export
   ════════════════════════════════════════════════ */

export function AdminProductsTab() {
  const {
    productsMain, productsCross, productsServices,
    fetchProducts, saveProductsMain, saveProductsCross, saveProductsServices
  } = useSettingsStore();

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

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    const ok1 = await saveProductsMain(localMain);
    const ok2 = await saveProductsCross(localCross);
    const ok3 = await saveProductsServices(localServices);
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

  const dirty = isDirty();

  return (
    <>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
          Управляйте продуктами и услугами. Изменения вступят в силу для всех агентов после сохранения.
        </p>
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
    </>
  );
}

