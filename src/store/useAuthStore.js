import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

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

      refreshUser: async () => {
        const currentUser = get().user;
        if (!currentUser?.id) return;
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
          
        if (!error && data) {
          set({ user: data });
        }
      },
    }),
    {
      name: 'alfasvk-auth',
    }
  )
);
