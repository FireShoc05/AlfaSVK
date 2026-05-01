import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Search, ChevronDown, ChevronUp, Calendar, Users, Package, CreditCard, Wrench, XCircle, CheckCircle } from 'lucide-react';
import { useMeetingsStore } from '../../store/useMeetingsStore';
import { useRejectionsStore } from '../../store/useRejectionsStore';
import { useUsersStore } from '../../store/useUsersStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { GlassCard, Button, Badge } from '../../components/ui';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/admin.css';

// Helpers
function getBaseName(name) {
  if (!name) return '';
  return name.replace(/ #\d+$/, '');
}

export function AdminStatisticsTab() {
  const { fetchAllMeetings, meetingsByUser } = useMeetingsStore();
  const { fetchRejections, rejections } = useRejectionsStore();
  const { fetchUsers, users } = useUsersStore();
  const { fetchProducts, productsMain, productsCross, productsServices } = useSettingsStore();
  const { user } = useAuthStore();

  // Date selection
  const [selectedDate, setSelectedDate] = useState(() => {
    // Local date string YYYY-MM-DD
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);

  // Initial fetch
  useEffect(() => {
    if (user?.group_id) {
      fetchAllMeetings(user.group_id);
      fetchRejections(user.group_id);
      fetchUsers(user.group_id);
      fetchProducts(user.group_id);
    }
  }, [fetchAllMeetings, fetchRejections, fetchUsers, fetchProducts, user?.group_id]);

  // Compute stats for selected date
  const stats = useMemo(() => {
    // 1. Get all meetings and rejections
    const allMeetings = Object.values(meetingsByUser).flat();
    
    // Filter by selected date
    const dailyMeetings = allMeetings.filter(m => m?.meeting_timestamp?.startsWith(selectedDate));
    // Fallback to local conversion of created_at if necessary, but rejections uses created_at
    const dailyRejections = rejections.filter(r => {
      // Rejections created_at is UTC, let's just check if it starts with the date or convert to local
      if (!r.created_at) return false;
      // Simplest way is to match the substring, or convert UTC to local string
      const localDateStr = new Date(r.created_at).toLocaleDateString('en-CA'); // format: YYYY-MM-DD
      return localDateStr === selectedDate || r.created_at.startsWith(selectedDate);
    });

    const successfulCount = dailyMeetings.length;
    const unsuccessfulCount = dailyRejections.length;
    const totalMeetings = successfulCount + unsuccessfulCount;
    
    const totalEarned = dailyMeetings.reduce((sum, m) => sum + (Number(m?.total_earned) || 0), 0);

    // Global Product Counters
    const prodCounts = { main: {}, cross: {}, services: {} };

    dailyMeetings.forEach(m => {
      (m?.products || []).forEach(p => {
        const baseName = getBaseName(p.name);
        const count = p.quantity || 1;
        if (p.type === 'main') {
          prodCounts.main[baseName] = (prodCounts.main[baseName] || 0) + count;
        } else if (p.type === 'cross') {
          prodCounts.cross[baseName] = (prodCounts.cross[baseName] || 0) + count;
        } else if (p.type === 'service') {
          prodCounts.services[baseName] = (prodCounts.services[baseName] || 0) + count;
        }
      });
    });

    // Employee Stats
    const employeeStats = users.map(user => {
      const uMeetings = dailyMeetings.filter(m => m.userId === user.id);
      const uEarned = uMeetings.reduce((sum, m) => sum + (Number(m?.total_earned) || 0), 0);
      
      const uCounts = { main: {}, cross: {}, services: {} };
      uMeetings.forEach(m => {
        (m?.products || []).forEach(p => {
          const baseName = getBaseName(p.name);
          const count = p.quantity || 1;
          if (p.type === 'main') uCounts.main[baseName] = (uCounts.main[baseName] || 0) + count;
          else if (p.type === 'cross') uCounts.cross[baseName] = (uCounts.cross[baseName] || 0) + count;
          else if (p.type === 'service') uCounts.services[baseName] = (uCounts.services[baseName] || 0) + count;
        });
      });

      return {
        ...user,
        earned: uEarned,
        products: uCounts
      };
    });

    // Sort employees alphabetically by name
    employeeStats.sort((a, b) => {
      const nameA = a.fullName || a.username || '';
      const nameB = b.fullName || b.username || '';
      return nameA.localeCompare(nameB);
    });

    return {
      totalEarned,
      totalMeetings,
      successfulCount,
      unsuccessfulCount,
      prodCounts,
      employeeStats
    };

  }, [meetingsByUser, rejections, users, selectedDate]);

  // Render product global breakdown
  const renderGlobalProductList = (title, items, counts, icon) => (
    <div className="admin-stat-block">
      <h4 className="admin-stat-block__title">{icon} {title}</h4>
      <div className="admin-stat-block__list">
        {items.map(p => {
          const count = counts[p.name] || 0;
          return (
            <div key={p.id} className="admin-stat-row">
              <span className="admin-stat-row__name">{p.name}</span>
              <span className={`admin-stat-row__value ${count > 0 ? 'admin-stat-row__value--active' : ''}`}>
                {count} шт.
              </span>
            </div>
          );
        })}
        {items.length === 0 && <div className="admin-empty">Нет продуктов</div>}
      </div>
    </div>
  );

  // Filter users by search
  const filteredUsers = stats.employeeStats.filter(u => {
    const term = searchQuery.toLowerCase();
    const name = (u.fullName || '').toLowerCase();
    const login = (u.username || '').toLowerCase();
    return name.includes(term) || login.includes(term);
  });

  return (
    <div className="admin-statistics-tab">
      
      {/* HEADER & DATE PICKER */}
      <GlassCard className="admin-card admin-statistics-header">
        <div className="admin-statistics-header__top">
          <div>
            <h3 className="admin-card__title" style={{ marginBottom: '4px' }}>
              <BarChart3 size={18} /> Дневная статистика
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
              Выберите дату для просмотра подробной информации по всем продажам и сотрудникам.
            </p>
          </div>
          <div className="admin-date-picker-wrapper">
            <label className="admin-date-picker-label"><Calendar size={14}/> Дата:</label>
            <input 
              type="date" 
              className="admin-date-picker-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toLocaleDateString('en-CA')}
            />
          </div>
        </div>

        {/* GLOBAL SUMMARY CARDS */}
        <div className="admin-stats-summary-grid">
          <div className="admin-stat-summary-card admin-stat-summary-card--earn">
            <span className="admin-stat-summary-card__label">Общая сумма продаж</span>
            <span className="admin-stat-summary-card__value">{formatCurrency(stats.totalEarned)}</span>
          </div>
          <div className="admin-stat-summary-card">
            <span className="admin-stat-summary-card__label">Всего встреч</span>
            <span className="admin-stat-summary-card__value">{stats.totalMeetings}</span>
            <div className="admin-stat-summary-card__sub">
              <span className="admin-stat-summary-card__sub-item success">
                <CheckCircle size={12}/> Удачные: {stats.successfulCount}
              </span>
              <span className="admin-stat-summary-card__sub-item danger">
                <XCircle size={12}/> Неудачные: {stats.unsuccessfulCount}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* GLOBAL PRODUCTS BREAKDOWN */}
      <GlassCard className="admin-card">
        <h3 className="admin-card__title">Статистика продуктов за день</h3>
        <div className="admin-products-stats-grid">
          {renderGlobalProductList('Основные продукты', productsMain, stats.prodCounts.main, <CreditCard size={16}/>)}
          {renderGlobalProductList('Доп. продукты', productsCross, stats.prodCounts.cross, <Package size={16}/>)}
          {renderGlobalProductList('Услуги', productsServices, stats.prodCounts.services, <Wrench size={16}/>)}
        </div>
      </GlassCard>

      <div className="admin-divider" />

      {/* EMPLOYEES SECTION */}
      <GlassCard className="admin-card">
        <div className="admin-employees-header">
          <h3 className="admin-card__title" style={{ marginBottom: 0 }}>
            <Users size={18} /> Статистика по сотрудникам
          </h3>
          <div className="admin-search-box">
            <Search size={16} className="admin-search-box__icon" />
            <input 
              type="text"
              placeholder="Поиск по ФИО..."
              className="admin-search-box__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-employees-list">
          {filteredUsers.length === 0 ? (
            <div className="admin-empty">Сотрудники не найдены</div>
          ) : (
            filteredUsers.map(user => {
              const isExpanded = expandedUser === user.id;
              
              // Determine if they sold any products to render them
              const hasSoldAnyMain = Object.keys(user.products.main).length > 0;
              const hasSoldAnyCross = Object.keys(user.products.cross).length > 0;
              const hasSoldAnyServices = Object.keys(user.products.services).length > 0;
              const hasAnySales = hasSoldAnyMain || hasSoldAnyCross || hasSoldAnyServices;

              return (
                <div key={user.id} className={`admin-employee-accordion ${isExpanded ? 'expanded' : ''}`}>
                  <div 
                    className="admin-employee-accordion__header" 
                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                  >
                    <div className="admin-employee-accordion__info">
                      <div className="admin-employee-accordion__name">{user.fullName || user.username}</div>
                      <div className="admin-employee-accordion__earn">
                        {user.earned > 0 ? (
                          <Badge variant="success">{formatCurrency(user.earned)}</Badge>
                        ) : (
                          <Badge variant="ghost">0 ₽</Badge>
                        )}
                      </div>
                    </div>
                    <div className="admin-employee-accordion__icon">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="admin-employee-accordion__body">
                      {!hasAnySales ? (
                        <div className="admin-empty" style={{ padding: '16px' }}>
                          В этот день нет успешных продаж
                        </div>
                      ) : (
                        <div className="admin-employee-stats-cols">
                          {hasSoldAnyMain && (
                            <div className="admin-emp-stat-col">
                              <div className="admin-emp-stat-col__title">Основные:</div>
                              {Object.entries(user.products.main).map(([name, count]) => (
                                <div key={name} className="admin-emp-stat-row">
                                  <span>{name}</span>
                                  <strong>{count} шт.</strong>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {hasSoldAnyCross && (
                            <div className="admin-emp-stat-col">
                              <div className="admin-emp-stat-col__title">Допы:</div>
                              {Object.entries(user.products.cross).map(([name, count]) => (
                                <div key={name} className="admin-emp-stat-row">
                                  <span>{name}</span>
                                  <strong>{count} шт.</strong>
                                </div>
                              ))}
                            </div>
                          )}

                          {hasSoldAnyServices && (
                            <div className="admin-emp-stat-col">
                              <div className="admin-emp-stat-col__title">Услуги:</div>
                              {Object.entries(user.products.services).map(([name, count]) => (
                                <div key={name} className="admin-emp-stat-row">
                                  <span>{name}</span>
                                  <strong>{count} шт.</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

    </div>
  );
}
