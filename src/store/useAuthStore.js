import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: true, // АДМИН всегда авторизован для тестирования
      user: {
        id: 'admin_001',
        fullName: 'АДМИН',
        username: '@Admin',
        role: 'admin',
        joinDate: '2026-04-19',
        lastActivity: new Date().toISOString(),
      },

      login: (userData) => set({
        isAuthenticated: true,
        user: userData,
      }),

      logout: () => set({
        isAuthenticated: false,
        user: null,
      }),

      updateUser: (updates) => set((s) => ({
        user: { ...s.user, ...updates },
      })),
    }),
    {
      name: 'alfasvk-auth',
    }
  )
);
