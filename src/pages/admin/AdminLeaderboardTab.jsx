import { useState, useEffect } from 'react';
import { Trophy, Plus, Trash2, Save, Check, GripVertical } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard, Button, Badge } from '../../components/ui';
import '../../styles/admin.css';

const generateTabId = () => `lb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Builds a flat list of available products/services for the admin to pick from.
 * Each item has: { value: productName, label: displayLabel, category: 'main'|'cross'|'services' }
 */
function getAvailableProducts(productsMain, productsCross, productsServices) {
  const items = [];

  productsMain.forEach((p) => {
    items.push({ value: p.name, label: `${p.name}`, category: 'Основной продукт' });
  });

  productsCross.forEach((p) => {
    items.push({ value: p.name, label: `${p.name}`, category: 'Доп. продукт' });
  });

  productsServices.forEach((p) => {
    items.push({ value: p.name, label: `${p.name}`, category: 'Услуга' });
  });

  return items;
}

/* ════════════════════════════════════════════════
   AdminLeaderboardTab — Main Export
   ════════════════════════════════════════════════ */

export function AdminLeaderboardTab() {
  const {
    leaderboardTabs, fetchLeaderboardTabs, saveLeaderboardTabs,
    productsMain, productsCross, productsServices, fetchProducts,
  } = useSettingsStore();
  const { user } = useAuthStore();

  const [localTabs, setLocalTabs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // For adding new items
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('product'); // 'earnings' | 'product'
  const [addProductName, setAddProductName] = useState('');
  const [addLabel, setAddLabel] = useState('');

  useEffect(() => {
    if (user?.group_id) {
      fetchLeaderboardTabs(user.group_id);
      fetchProducts(user.group_id);
    }
  }, [fetchLeaderboardTabs, fetchProducts, user?.group_id]);

  useEffect(() => {
    setLocalTabs(leaderboardTabs || []);
  }, [leaderboardTabs]);

  const availableProducts = getAvailableProducts(productsMain, productsCross, productsServices);

  // Products already in the leaderboard
  const usedProductNames = localTabs
    .filter((t) => t.type === 'product')
    .map((t) => t.productName);

  const hasEarnings = localTabs.some((t) => t.type === 'earnings');

  // Filter out already-used products
  const unusedProducts = availableProducts.filter((p) => !usedProductNames.includes(p.value));

  // ─── Handlers ──────────────────────────────────

  const handleRemoveTab = (id) => {
    setLocalTabs((tabs) => tabs.filter((t) => t.id !== id));
    setDirty(true);
    setSaved(false);
  };

  const handleAddItem = () => {
    if (addType === 'earnings') {
      if (hasEarnings) return; // already exists
      setLocalTabs((tabs) => [
        ...tabs,
        { id: generateTabId(), label: addLabel.trim() || 'Заработок', type: 'earnings' },
      ]);
    } else {
      if (!addProductName) return;
      const product = availableProducts.find((p) => p.value === addProductName);
      setLocalTabs((tabs) => [
        ...tabs,
        {
          id: generateTabId(),
          label: addLabel.trim() || `Продажи ${product?.value || ''}`,
          type: 'product',
          productName: addProductName,
        },
      ]);
    }

    setShowAdd(false);
    setAddType('product');
    setAddProductName('');
    setAddLabel('');
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveLeaderboardTabs(localTabs, user?.group_id);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setDirty(false);
    }
  };

  const handleLabelChange = (id, newLabel) => {
    setLocalTabs((tabs) =>
      tabs.map((t) => (t.id === id ? { ...t, label: newLabel } : t))
    );
    setDirty(true);
    setSaved(false);
  };

  // ─── Move up/down ─────────────────────────────

  const moveTab = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= localTabs.length) return;
    const copy = [...localTabs];
    [copy[index], copy[newIdx]] = [copy[newIdx], copy[index]];
    setLocalTabs(copy);
    setDirty(true);
    setSaved(false);
  };

  return (
    <>
      <GlassCard className="admin-card">
        <h3 className="admin-card__title">
          <Trophy size={18} /> Настройка лидерборда
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginBottom: 'var(--space-lg)' }}>
          Выберите, какие показатели отображать в рейтинге сотрудников. Данные считаются автоматически из завершённых встреч.
        </p>

        {/* Current tabs list */}
        <div className="admin-leaderboard-list">
          {localTabs.length === 0 && (
            <div className="admin-empty">Лидерборд пуст. Добавьте хотя бы один пункт.</div>
          )}

          {localTabs.map((tab, index) => (
            <div key={tab.id} className="admin-leaderboard-item">
              <div className="admin-leaderboard-item__grip">
                <div className="admin-leaderboard-item__order-btns">
                  <button
                    className="admin-leaderboard-item__order-btn"
                    onClick={() => moveTab(index, -1)}
                    disabled={index === 0}
                    title="Вверх"
                  >▲</button>
                  <button
                    className="admin-leaderboard-item__order-btn"
                    onClick={() => moveTab(index, 1)}
                    disabled={index === localTabs.length - 1}
                    title="Вниз"
                  >▼</button>
                </div>
              </div>

              <div className="admin-leaderboard-item__info">
                <input
                  className="admin-leaderboard-item__label-input"
                  value={tab.label}
                  onChange={(e) => handleLabelChange(tab.id, e.target.value)}
                  placeholder="Название вкладки"
                />
                <div className="admin-leaderboard-item__type">
                  {tab.type === 'earnings' ? (
                    <Badge variant="accent">💰 Общий заработок</Badge>
                  ) : (
                    <Badge variant="primary">📦 {tab.productName}</Badge>
                  )}
                </div>
              </div>

              <button
                className="admin-leaderboard-item__delete"
                onClick={() => handleRemoveTab(tab.id)}
                title="Удалить из лидерборда"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Add new item */}
        {showAdd ? (
          <div className="admin-leaderboard-add-form">
            <div className="product-editor__field">
              <label className="product-editor__label">Тип пункта</label>
              <select
                className="admin-link-row__input"
                value={addType}
                onChange={(e) => {
                  setAddType(e.target.value);
                  setAddProductName('');
                  setAddLabel('');
                }}
              >
                <option value="product">Продажи продукта / услуги</option>
                {!hasEarnings && <option value="earnings">Общий заработок</option>}
              </select>
            </div>

            {addType === 'product' && (
              <div className="product-editor__field">
                <label className="product-editor__label">Продукт / услуга</label>
                {unusedProducts.length === 0 ? (
                  <div className="admin-empty" style={{ padding: 'var(--space-sm)' }}>
                    Все продукты уже добавлены
                  </div>
                ) : (
                  <select
                    className="admin-link-row__input"
                    value={addProductName}
                    onChange={(e) => {
                      setAddProductName(e.target.value);
                      if (!addLabel) {
                        setAddLabel(`Продажи ${e.target.value}`);
                      }
                    }}
                  >
                    <option value="">— Выберите —</option>
                    {unusedProducts.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} ({p.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="product-editor__field">
              <label className="product-editor__label">Название вкладки</label>
              <input
                className="admin-link-row__input"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder={addType === 'earnings' ? 'Заработок' : 'Продажи ...'}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <Button
                variant="primary"
                size="sm"
                disabled={addType === 'product' && !addProductName}
                onClick={handleAddItem}
              >
                <Check size={14} /> Добавить
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowAdd(false);
                setAddType('product');
                setAddProductName('');
                setAddLabel('');
              }}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdd(true)}
            style={{ marginTop: 'var(--space-md)' }}
          >
            <Plus size={14} /> Добавить пункт
          </Button>
        )}

        {/* Save */}
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <Button
            variant={saved ? 'success' : 'primary'}
            disabled={saving || (!dirty && !saved)}
            onClick={handleSave}
          >
            {saved
              ? <><Check size={16} /> Сохранено</>
              : <><Save size={16} /> {saving ? 'Сохранение...' : 'Сохранить'}</>
            }
          </Button>
        </div>
      </GlassCard>
    </>
  );
}
