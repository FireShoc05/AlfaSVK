import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useMeetingsStore = create((set, get) => ({
  meetingsByUser: {},
  meetings: [],

  _getUserMeetings: (userId) => {
    const state = get();
    if (userId && state.meetingsByUser[userId]) {
      return state.meetingsByUser[userId];
    }
    return [];
  },

  fetchUserMeetings: async (userId) => {
    if (!userId || userId === 'admin_root') return;
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false });
      
    if (error) console.error('Error fetching meetings:', error);
    else {
      set((s) => ({
        meetingsByUser: { ...s.meetingsByUser, [userId]: data || [] }
      }));
    }
  },

  fetchAllMeetings: async () => {
    const { data, error } = await supabase.from('meetings').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching all meetings:', error);
    else {
      const grouped = {};
      data.forEach(m => {
          if (!grouped[m.userId]) grouped[m.userId] = [];
          grouped[m.userId].push(m);
      });
      set({ meetingsByUser: grouped });
    }
  },

  addMeeting: async (meeting, userId) => {
    const dbMeeting = {
      userId,
      clientName: meeting.clientName,
      meeting_timestamp: meeting.meeting_timestamp,
      total_earned: meeting.total_earned,
      products: meeting.products
    };
    const { data, error } = await supabase.from('meetings').insert([dbMeeting]).select().single();
    if (error) console.error('Error adding meeting:', error);
    else {
      set((s) => {
        const userMeetings = s.meetingsByUser[userId] || [];
        return {
          meetingsByUser: {
            ...s.meetingsByUser,
            [userId]: [data, ...userMeetings],
          },
        };
      });
    }
  },

  getTodayMeetings: (userId) => {
    const today = new Date().toISOString().split('T')[0];
    return get()._getUserMeetings(userId).filter(
      (m) => m && m?.meeting_timestamp?.startsWith(today)
    );
  },

  getMonthMeetings: (userId) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return get()._getUserMeetings(userId).filter(
      (m) => m && m?.meeting_timestamp?.startsWith(yearMonth)
    );
  },

  getTodayEarnings: (userId) => {
    return get().getTodayMeetings(userId).reduce((sum, m) => sum + (Number(m?.total_earned) || 0), 0);
  },

  getMonthEarnings: (userId) => {
    return get().getMonthMeetings(userId).reduce((sum, m) => sum + (Number(m?.total_earned) || 0), 0);
  },

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

  getLeaderboardData: (userId) => {
    const meetings = get()._getUserMeetings(userId);
    const totalEarned = meetings.reduce((sum, m) => sum + (Number(m?.total_earned) || 0), 0);

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
          dailyData[day] += (Number(m.total_earned) || 0);
        }
      });

    return dailyData;
  },

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
}));
