import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useSuperAdminStore = create((set, get) => ({
  groups: [],
  managers: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('name');
      
      if (groupsError) throw groupsError;

      // Fetch all users to calculate employees count and find managers
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const managers = usersData.filter(u => u.role === 'admin');
      const employees = usersData.filter(u => u.role === 'employee');

      // Attach employee count to each group
      const enrichedGroups = groupsData.map(g => {
        const groupEmployees = employees.filter(e => e.group_id === g.id);
        const groupManager = managers.find(m => m.group_id === g.id);
        return {
          ...g,
          employeesCount: groupEmployees.length,
          manager: groupManager || null
        };
      });

      set({ groups: enrichedGroups, managers, loading: false });
    } catch (error) {
      console.error('Error fetching superadmin data:', error);
      set({ loading: false });
    }
  },

  addGroup: async (name) => {
    try {
      const { data, error } = await supabase.from('groups').insert([{ name }]).select().single();
      if (error) throw error;
      await get().fetchData();
      return { success: true, data };
    } catch (error) {
      console.error('Error adding group:', error);
      return { success: false, error };
    }
  },

  deleteGroup: async (id) => {
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
      await get().fetchData();
      return { success: true };
    } catch (error) {
      console.error('Error deleting group:', error);
      return { success: false, error };
    }
  },

  addManager: async (managerData) => {
    try {
      const dbUser = {
        fullName: managerData.fullName,
        username: managerData.username,
        tempPassword: managerData.tempPassword,
        role: 'admin',
        status: 'active',
        group_id: managerData.group_id,
        joinDate: new Date().toISOString().split('T')[0]
      };
      
      const { data, error } = await supabase.from('users').insert([dbUser]).select().single();
      if (error) throw error;
      
      // Update the group's manager_id if necessary
      if (managerData.group_id) {
        await supabase.from('groups').update({ manager_id: data.id }).eq('id', managerData.group_id);
      }
      
      await get().fetchData();
      return { success: true, data };
    } catch (error) {
      console.error('Error adding manager:', error);
      return { success: false, error };
    }
  },

  deleteManager: async (id) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      await get().fetchData();
      return { success: true };
    } catch (error) {
      console.error('Error deleting manager:', error);
      return { success: false, error };
    }
  },

  updateManagerGroup: async (managerId, newGroupId) => {
    try {
      const { error } = await supabase.from('users').update({ group_id: newGroupId }).eq('id', managerId);
      if (error) throw error;
      
      // Update old and new groups' manager_id
      // Clear old
      await supabase.from('groups').update({ manager_id: null }).eq('manager_id', managerId);
      // Set new
      if (newGroupId) {
         await supabase.from('groups').update({ manager_id: managerId }).eq('id', newGroupId);
      }

      await get().fetchData();
      return { success: true };
    } catch (error) {
      console.error('Error updating manager group:', error);
      return { success: false, error };
    }
  }
}));
