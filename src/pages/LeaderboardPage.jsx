import '../styles/leaderboard.css';
import { useState, useEffect } from 'react';
import { Tabs } from '../components/ui';
import { Trophy } from 'lucide-react';
import { useMeetingsStore } from '../store/useMeetingsStore';
import { useUsersStore } from '../store/useUsersStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatters';

const medals = ['🥇', '🥈', '🥉'];
const medalClasses = ['leaderboard__item--gold', 'leaderboard__item--silver', 'leaderboard__item--bronze'];

export function LeaderboardPage() {
  const { fetchAllMeetings, getLeaderboardData } = useMeetingsStore();
  const { users, fetchUsers } = useUsersStore();
  const { leaderboardTabs, fetchLeaderboardTabs } = useSettingsStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (user?.group_id) {
      fetchUsers(user.group_id);
      fetchAllMeetings(user.group_id);
      fetchLeaderboardTabs(user.group_id);
    }
  }, [fetchUsers, fetchAllMeetings, fetchLeaderboardTabs, user?.group_id]);

  // Set default active tab when tabs load
  useEffect(() => {
    if (leaderboardTabs.length > 0 && !activeTab) {
      setActiveTab(leaderboardTabs[0].id);
    }
  }, [leaderboardTabs, activeTab]);

  // Build tabs for the Tabs component
  const tabs = leaderboardTabs.map((t) => ({ id: t.id, label: t.label }));

  // Find current tab config
  const currentTab = leaderboardTabs.find((t) => t.id === activeTab);

  // Build leaderboard list based on current tab type
  const getLeaderboardList = () => {
    if (!currentTab) return [];

    return users.map((u) => {
      const stats = getLeaderboardData(u.id);
      let value = 0;

      if (currentTab.type === 'earnings') {
        value = stats.earnings;
      } else if (currentTab.type === 'product') {
        // Count sales of a specific product by name
        value = getProductSalesCount(u.id, currentTab.productName);
      }

      return {
        id: u.id,
        name: u.fullName || u.username,
        value,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  };

  /**
   * Count how many times a user sold a specific product/service by name.
   * Searches through all meetings for that user.
   */
  const getProductSalesCount = (userId, productName) => {
    const meetings = useMeetingsStore.getState()._getUserMeetings(userId);
    let count = 0;

    meetings.forEach((m) => {
      (m?.products || []).forEach((p) => {
        // Match by base name (strip "Кросс Дет #1" -> "Кросс Дет")
        const baseName = p.name?.replace(/ #\d+$/, '');
        if (baseName === productName || p.name === productName) {
          count += p.quantity || 1;
        }
      });
    });

    return count;
  };

  const list = getLeaderboardList();

  const formatValue = (val) => {
    if (currentTab?.type === 'earnings') return formatCurrency(val);
    return val;
  };

  return (
    <div className="leaderboard">
      <div className="page-header">
        <h1 className="page-header__title">
          <Trophy size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: 'var(--gold)' }} />
          Рейтинги сотрудников
        </h1>
        <p className="page-header__subtitle">Лидеры по результатам работы</p>
      </div>

      {tabs.length > 0 && (
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <div className="leaderboard__list">
        {list.length > 0 ? (
          list.map((item, index) => (
            <div key={item.id} className={`leaderboard__item ${index < 3 ? medalClasses[index] : ''}`}>
              <div className="leaderboard__rank">
                {index < 3 ? <span className="leaderboard__medal">{medals[index]}</span> : <span className="leaderboard__rank-num">#{index + 1}</span>}
              </div>
              <div className="leaderboard__name">{item.name}</div>
              <div className="leaderboard__value">
                {formatValue(item.value)}
              </div>
            </div>
          ))
        ) : (
          <div className="leaderboard__empty">
            <Trophy size={48} strokeWidth={1} />
            <p>Пока нет данных</p>
            <p className="leaderboard__empty-hint">Завершите первую встречу, чтобы увидеть результаты</p>
          </div>
        )}
      </div>
    </div>
  );
}
