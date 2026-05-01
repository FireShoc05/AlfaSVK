import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useUsersStore = create((set, get) => ({
  users: [],
  
  fetchUsers: async (groupId) => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching users:', error);
    else set({ users: data || [] });
  },

  addUser: async (user, groupId) => {
    if (!groupId) return;
    const dbUser = {
      fullName: user.fullName,
      username: user.username,
      tempPassword: user.tempPassword,
      role: user.role,
      status: user.status,
      group_id: groupId,
      joinDate: user.joinDate || new Date().toISOString().split('T')[0]
    };
    const { data, error } = await supabase.from('users').insert([dbUser]).select().single();
    if (error) console.error('Error adding user:', error);
    else set((state) => ({ users: [data, ...state.users] }));
  },

  deleteUser: async (userId) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) console.error('Error deleting user:', error);
    else set((state) => ({ users: state.users.filter(u => u.id !== userId) }));
  },

  regeneratePassword: async (userId, newTempPassword) => {
    const { data, error } = await supabase.from('users').update({ tempPassword: newTempPassword }).eq('id', userId).select().single();
    if (error) console.error('Error regenerating pass:', error);
    else set((state) => ({
      users: state.users.map(u => u.id === userId ? data : u)
    }));
  },

  updateUser: async (userId, updates) => {
    const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if (error) console.error('Error updating user:', error);
    else set((state) => ({
      users: state.users.map(u => u.id === userId ? data : u)
    }));
  },

  findUserByCredentials: async (login, password) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', login) // case-insensitive
      .eq('tempPassword', password)
      .maybeSingle(); // maybeSingle so it doesn't throw if not found
    
    if (error) {
      console.error('Auth error:', error);
      return null;
    }
    return data;
  }
}));
