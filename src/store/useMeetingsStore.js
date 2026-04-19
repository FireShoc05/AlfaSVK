import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMeetingsStore = create(
  persist(
    (set, get) => ({
      // Встречи, хранятся по userId: { [userId]: [...meetings] }
      meetingsByUser: {},

      // Для обратной совместимости (старые данные)
      meetings: [],

      // Получить встречи конкретного пользователя
      _getUserMeetings: (userId) => {
        const state = get();
        // Если есть данные в новом формате — берём оттуда
        if (userId && state.meetingsByUser[userId]) {
          return state.meetingsByUser[userId];
        }
        // Фоллбэк на старый формат (для первого запуска / миграции)
        return [];
      },

      // Добавить завершённую встречу
      addMeeting: (meeting, userId) => set((s) => {
        const userMeetings = s.meetingsByUser[userId] || [];
        return {
          meetingsByUser: {
            ...s.meetingsByUser,
            [userId]: [meeting, ...userMeetings],
          },
        };
      }),

      // Получить встречи за сегодня
      getTodayMeetings: (userId) => {
        const today = new Date().toISOString().split('T')[0];
        return get()._getUserMeetings(userId).filter(
          (m) => m && m?.meeting_timestamp?.startsWith(today)
        );
      },

      // Получить встречи за текущий месяц
      getMonthMeetings: (userId) => {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return get()._getUserMeetings(userId).filter(
          (m) => m && m?.meeting_timestamp?.startsWith(yearMonth)
        );
      },

      // Сумма заработка за сегодня
      getTodayEarnings: (userId) => {
        return get().getTodayMeetings(userId).reduce((sum, m) => sum + (m?.total_earned || 0), 0);
      },

      // Сумма заработка за месяц
      getMonthEarnings: (userId) => {
        return get().getMonthMeetings(userId).reduce((sum, m) => sum + (m?.total_earned || 0), 0);
      },

      // Подсчёт продуктов для таблиц
      getProductStats: (period = 'month', userId) => {
        let meetings;
        if (period === 'today') {
           meetings = get().getTodayMeetings(userId);
        } else {
           meetings = get().getMonthMeetings(userId);
        }

        const mainStats = {};
        const crossStats = {};

        try {
          meetings.forEach((m) => {
            (m?.products || []).forEach((p) => {
              if (!p || !p.name) return;
              const stats = p.type === 'main' ? mainStats : crossStats;
              if (!stats[p.name]) {
                stats[p.name] = { name: p.name, count: 0, earned: 0 };
              }
              stats[p.name].count += p.quantity || 1;
              stats[p.name].earned += p.earned || 0;
            });
          });
        } catch (error) {
          console.error("Failed to parse product stats", error);
        }

        return {
          main: Object.values(mainStats),
          cross: Object.values(crossStats),
        };
      },

      // Данные для лидерборда (все пользователи)
      getLeaderboardData: (userId) => {
        const meetings = get()._getUserMeetings(userId);
        const totalEarned = meetings.reduce((sum, m) => sum + (m?.total_earned || 0), 0);

        let bsCount = 0;
        let klCount = 0;
        meetings.forEach((m) => {
          (m?.products || []).forEach((p) => {
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
      getMonthlyChartData: (userId) => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const dailyData = Array(daysInMonth).fill(0);
        get()._getUserMeetings(userId)
          .filter((m) => m?.meeting_timestamp?.startsWith(yearMonth))
          .forEach((m) => {
            const day = new Date(m.meeting_timestamp).getDate() - 1;
            if (!isNaN(day)) {
              dailyData[day] += (m.total_earned || 0);
            }
          });

        return dailyData;
      },

      // Очистить данные пользователя
      clearAll: (userId) => {
        if (userId) {
          set((s) => ({
            meetingsByUser: {
              ...s.meetingsByUser,
              [userId]: [],
            },
          }));
        } else {
          set({ meetingsByUser: {}, meetings: [] });
        }
      },
    }),
    {
      name: 'alfasvk-meetings',
    }
  )
);
