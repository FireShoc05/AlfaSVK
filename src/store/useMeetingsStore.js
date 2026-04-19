import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMeetingsStore = create(
  persist(
    (set, get) => ({
      // Все завершённые встречи
      meetings: [],

      // Добавить завершённую встречу
      addMeeting: (meeting) => set((s) => ({
        meetings: [meeting, ...s.meetings],
      })),

      // Получить встречи за сегодня
      getTodayMeetings: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().meetings.filter(
          (m) => m.meeting_timestamp.startsWith(today)
        );
      },

      // Получить встречи за текущий месяц
      getMonthMeetings: () => {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return get().meetings.filter(
          (m) => m.meeting_timestamp.startsWith(yearMonth)
        );
      },

      // Сумма заработка за сегодня
      getTodayEarnings: () => {
        return get().getTodayMeetings().reduce((sum, m) => sum + m.total_earned, 0);
      },

      // Сумма заработка за месяц
      getMonthEarnings: () => {
        return get().getMonthMeetings().reduce((sum, m) => sum + m.total_earned, 0);
      },

      // Подсчёт продуктов для таблиц
      getProductStats: () => {
        const meetings = get().meetings;
        const mainStats = {};
        const crossStats = {};

        meetings.forEach((m) => {
          (m.products || []).forEach((p) => {
            const stats = p.type === 'main' ? mainStats : crossStats;
            if (!stats[p.name]) {
              stats[p.name] = { name: p.name, count: 0, earned: 0 };
            }
            stats[p.name].count += p.quantity || 1;
            stats[p.name].earned += p.earned;
          });
        });

        return {
          main: Object.values(mainStats),
          cross: Object.values(crossStats),
        };
      },

      // Данные для лидерборда
      getLeaderboardData: () => {
        const meetings = get().meetings;
        const totalEarned = meetings.reduce((sum, m) => sum + m.total_earned, 0);

        // Подсчёт БС и КЛ
        let bsCount = 0;
        let klCount = 0;
        meetings.forEach((m) => {
          (m.products || []).forEach((p) => {
            if (p.type === 'service' && p.name === 'БС') bsCount++;
            if (p.type === 'service' && p.name === 'КЛ') klCount++;
          });
        });

        return {
          earnings: totalEarned,
          bsSales: bsCount,
          klSales: klCount,
        };
      },

      // Данные для графика по дням месяца
      getMonthlyChartData: () => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const dailyData = Array(daysInMonth).fill(0);
        get().meetings
          .filter((m) => m.meeting_timestamp.startsWith(yearMonth))
          .forEach((m) => {
            const day = new Date(m.meeting_timestamp).getDate() - 1;
            dailyData[day] += m.total_earned;
          });

        return dailyData;
      },

      // Очистить все данные
      clearAll: () => set({ meetings: [] }),
    }),
    {
      name: 'alfasvk-meetings',
    }
  )
);
