import '../styles/leaderboard.css';
import { useState, useEffect } from 'react';
import { Tabs } from '../components/ui';
import { Trophy } from 'lucide-react';
import { useMeetingsStore } from '../store/useMeetingsStore';
import { useUsersStore } from '../store/useUsersStore';
import { formatCurrency } from '../utils/formatters';

const tabs = [
  { id: 'earnings', label: 'Заработок' },
  { id: 'bs', label: 'Продажи БС' },
  { id: 'kl', label: 'Продажи КЛ' },
];

const medals = ['🥇', '🥈', '🥉'];
const medalClasses = ['leaderboard__item--gold', 'leaderboard__item--silver', 'leaderboard__item--bronze'];

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('earnings');
  
  const { fetchAllMeetings, getLeaderboardData } = useMeetingsStore();
  const { users, fetchUsers } = useUsersStore();

  useEffect(() => {
    fetchUsers();
    fetchAllMeetings();
  }, [fetchUsers, fetchAllMeetings]);

  const getLeaderboardList = () => {
    const list = users.map(u => {
       const stats = getLeaderboardData(u.id);
       return {
          id: u.id,
          name: u.fullName || u.username,
          role: u.role,
          earnings: stats.earnings,
          bsSales: stats.bsSales,
          klSales: stats.klSales
       };
    });
    
    return list.sort((a, b) => {
       if (activeTab === 'earnings') return b.earnings - a.earnings;
       if (activeTab === 'bs') return b.bsSales - a.bsSales;
       if (activeTab === 'kl') return b.klSales - a.klSales;
       return 0;
    });
  };

  const list = getLeaderboardList().filter(item => {
      // Filter out admins if needed, or keep everyone who has > 0
      if (activeTab === 'earnings') return item.earnings > 0;
      if (activeTab === 'bs') return item.bsSales > 0;
      if (activeTab === 'kl') return item.klSales > 0;
      return false;
  });

  const formatValue = (val) => {
    if (activeTab === 'earnings') return formatCurrency(val);
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

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="leaderboard__list">
        {list.length > 0 ? (
          list.map((item, index) => (
            <div key={item.id} className={`leaderboard__item ${index < 3 ? medalClasses[index] : ''}`}>
              <div className="leaderboard__rank">
                {index < 3 ? <span className="leaderboard__medal">{medals[index]}</span> : <span className="leaderboard__rank-num">#{index + 1}</span>}
              </div>
              <div className="leaderboard__name">{item.name}</div>
              <div className="leaderboard__value">
                {formatValue(activeTab === 'earnings' ? item.earnings : activeTab === 'bs' ? item.bsSales : item.klSales)}
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
