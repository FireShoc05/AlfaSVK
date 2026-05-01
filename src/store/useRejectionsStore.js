import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useRejectionsStore = create((set) => ({
  rejections: [],

  fetchRejections: async (groupId) => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from('rejections')
      .select('*, users(fullName)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching rejections:', error);
    else set({ rejections: data || [] });
  },

  addRejection: async (rejection, groupId) => {
    if (!groupId) return false;
    const { data, error } = await supabase
      .from('rejections')
      .insert([{ ...rejection, group_id: groupId }])
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
