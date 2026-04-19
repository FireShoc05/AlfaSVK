import '../styles/leaderboard.css';
import { useState } from 'react';
import { Tabs } from '../components/ui';
import { Trophy } from 'lucide-react';
import { useMeetingsStore } from '../store/useMeetingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../utils/formatters';

const tabs = [
  { id: 'earnings', label: 'Заработок' },
  { id: 'bs', label: 'Продажи БС' },
  { id: 'kl', label: 'Продажи КЛ' },
];

const medals = ['🥇', '🥈', '🥉'];
const medalClasses = ['gold', 'silver', 'bronze'];

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('earnings');
  const user = useAuthStore((s) => s.user);
  const mStore = useMeetingsStore();
  const leaderData = mStore.getLeaderboardData(user?.id);

  const getValue = () => {
    switch (activeTab) {
      case 'earnings': return leaderData.earnings;
      case 'bs': return leaderData.bsSales;
      case 'kl': return leaderData.klSales;
      default: return 0;
    }
  };

  const formatValue = (val) => {
    if (activeTab === 'earnings') return formatCurrency(val);
    return val;
  };

  const value = getValue();

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
        {value > 0 ? (
          <div className={`leaderboard__item leaderboard__item--gold`}>
            <div className="leaderboard__rank">
              <span className="leaderboard__medal">{medals[0]}</span>
            </div>
            <div className="leaderboard__name">{user?.fullName || 'АДМИН'}</div>
            <div className="leaderboard__value">{formatValue(value)}</div>
          </div>
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
