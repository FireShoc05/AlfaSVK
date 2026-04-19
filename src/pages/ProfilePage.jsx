import '../styles/profile.css';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useMeetingsStore } from '../store/useMeetingsStore';
import { GlassCard, Button, Modal, InputGroup, Badge, Tabs } from '../components/ui';
import { formatCurrency } from '../utils/formatters';
import {
  User,
  Calendar,
  Activity,
  TrendingUp,
  Lock,
  Package,
  Layers,
} from 'lucide-react';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const mStore = useMeetingsStore();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState('month');
  
  const todayEarnings = mStore.getTodayEarnings();
  const monthEarnings = mStore.getMonthEarnings();
  const todayMeetings = mStore.getTodayMeetings();
  const monthMeetings = mStore.getMonthMeetings();
  const productStats = mStore.getProductStats(statsPeriod);
  const chartData = mStore.getMonthlyChartData();
  const maxChart = Math.max(...chartData, 1);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = () => {
    alert('Пароль успешно изменён (заглушка)');
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
  };

  return (
    <div className="profile">
      {/* Profile Card */}
      <GlassCard className="profile__card">
        <div className="profile__header">
          <div className="profile__avatar">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="profile__info">
            <h2 className="profile__name">{user?.fullName}</h2>
            <span className="profile__username">{user?.username}</span>
            <Badge variant="success">✅ Активный аккаунт</Badge>
          </div>
        </div>
        <div className="profile__meta">
          <div className="profile__meta-item">
            <Calendar size={14} />
            <span>В команде с: {user?.joinDate}</span>
          </div>
          <div className="profile__meta-item">
            <Activity size={14} />
            <span>Активность: {new Date().toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(true)}>
          <Lock size={14} /> Сменить пароль
        </Button>
      </GlassCard>

      {/* Dashboard Widgets */}
      <div className="profile__widgets">
        <GlassCard className="profile__widget">
          <div className="profile__widget-label">За сегодня</div>
          <div className="profile__widget-value">{formatCurrency(todayEarnings)}</div>
          <div className="profile__widget-sub">{todayMeetings.length} встреч</div>
        </GlassCard>
        <GlassCard className="profile__widget">
          <div className="profile__widget-label">За месяц</div>
          <div className="profile__widget-value">{formatCurrency(monthEarnings)}</div>
          <div className="profile__widget-sub">{monthMeetings.length} встреч</div>
        </GlassCard>
      </div>

      {/* Activity Chart */}
      <GlassCard className="profile__chart-card">
        <h3 className="profile__section-title">
          <TrendingUp size={18} /> Активность за месяц
        </h3>
        <div className="profile__chart">
          {chartData.map((val, i) => (
            <div key={i} className="profile__chart-bar-wrap">
              <div
                className="profile__chart-bar"
                style={{ height: `${(val / maxChart) * 100}%` }}
                title={`${i + 1} число: ${formatCurrency(val)}`}
              />
              {(i + 1) % 5 === 0 && (
                <span className="profile__chart-label">{i + 1}</span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Detail Tables Filter */}
      <div style={{ marginBottom: '16px' }}>
        <Tabs 
          tabs={[
            { id: 'today', label: 'За сегодня' },
            { id: 'month', label: 'За месяц' }
          ]}
          activeTab={statsPeriod}
          onTabChange={setStatsPeriod}
        />
      </div>

      {/* Detail Tables */}
      <GlassCard>
        <h3 className="profile__section-title">
          <Package size={18} /> Основные продукты
        </h3>
        {productStats.main.length > 0 ? (
          <table className="profile__table">
            <thead>
              <tr>
                <th>Продукт</th>
                <th>Кол-во</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {productStats.main.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.count}</td>
                  <td>{formatCurrency(p.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="profile__empty">Нет данных</p>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="profile__section-title">
          <Layers size={18} /> Доп. продукты и услуги
        </h3>
        {(productStats.cross.length > 0) ? (
          <table className="profile__table">
            <thead>
              <tr>
                <th>Продукт</th>
                <th>Кол-во</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {productStats.cross.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.count}</td>
                  <td>{formatCurrency(p.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="profile__empty">Нет данных</p>
        )}
      </GlassCard>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Сменить пароль"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>Отмена</Button>
            <Button variant="primary" onClick={handlePasswordChange}>Сохранить</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InputGroup
            label="Старый пароль"
            id="old-password"
            type="password"
            placeholder="Введите старый пароль"
            value={oldPassword}
            onChange={setOldPassword}
          />
          <InputGroup
            label="Новый пароль"
            id="new-password"
            type="password"
            placeholder="Введите новый пароль"
            value={newPassword}
            onChange={setNewPassword}
          />
        </div>
      </Modal>
    </div>
  );
}
