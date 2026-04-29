import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useRejectionsStore = create((set) => ({
  rejections: [],

  fetchRejections: async () => {
    const { data, error } = await supabase
      .from('rejections')
      .select('*, users(fullName)')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching rejections:', error);
    else set({ rejections: data || [] });
  },

  addRejection: async (rejection) => {
    const { data, error } = await supabase
      .from('rejections')
      .insert([rejection])
      .select('*, users(fullName)')
      .single();
    if (error) {
      console.error('Error adding rejection:', error);
      return false;
    }
    set((state) => ({ rejections: [data, ...state.rejections] }));
    return true;
  },
}));
