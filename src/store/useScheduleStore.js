import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export const useScheduleStore = create((set, get) => ({
  schedules: [], // All fetched schedules
  locks: [], // Locks for the currently viewed month

  // Fetch schedules for a specific month (format 'YYYY-MM')
  // If userId is provided, fetch only for that user
  fetchSchedules: async (month, userId = null, groupId = null) => {
    let query = supabase.from('schedules').select('*, users!inner(fullName, username, group_id)');
    
    // Filter by month using precise date bounds
    const [year, m] = month.split('-');
    const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
    query = query.gte('date', `${month}-01`).lte('date', `${month}-${lastDay}`);
    
    if (userId) {
      query = query.eq('userId', userId);
    }
    
    if (groupId) {
      query = query.eq('users.group_id', groupId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching schedules:', error);
    } else {
      set({ schedules: data || [] });
    }
  },

  fetchLocks: async (month) => {
    const { data, error } = await supabase
      .from('schedule_locks')
      .select('*')
      .eq('month', month);
      
    if (error) {
      console.error('Error fetching locks:', error);
    } else {
      set({ locks: data || [] });
    }
  },

  // Save employee's schedule for a month and lock it
  saveMonthSchedule: async (userId, month, shiftsToUpsert, datesToDelete) => {
    try {
      // Delete all non-extra shifts for this user in this month
      const [year, m] = month.split('-');
      const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
      
      const { error: delError } = await supabase
        .from('schedules')
        .delete()
        .eq('userId', userId)
        .gte('date', `${month}-01`)
        .lte('date', `${month}-${lastDay}`)
        .eq('is_extra', false);

      if (delError) {
        console.error('Error deleting old shifts:', delError);
        return false;
      }

      // 2. Insert new shifts
      if (shiftsToUpsert.length > 0) {
        // Find group_id for this user
        const { data: userData } = await supabase.from('users').select('group_id').eq('id', userId).single();
        const payload = shiftsToUpsert.map(shift => ({
          userId,
          group_id: userData?.group_id || null,
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          is_extra: false
        }));
        
        const { error: insError } = await supabase
          .from('schedules')
          .insert(payload);
          
        if (insError) {
          console.error('Error inserting new shifts:', insError);
          return false;
        }
      }

      // 3. Lock the month
      const { error: lockError } = await supabase
        .from('schedule_locks')
        .upsert([{ userId, month }], { onConflict: '"userId", month' })
        .select()
        .single();
        
      if (lockError) {
        // If "userId", month fails, try without quotes
        const { error: lockError2 } = await supabase
          .from('schedule_locks')
          .upsert([{ userId, month }], { onConflict: 'userId, month' });
        if (lockError2) {
          console.error('Error locking month:', lockError2);
        }
      }
        
      return true;
    } catch (err) {
      console.error('Error saving month schedule:', err);
      return false;
    }
  },

  adminSaveShift: async (userId, date, start_time, end_time, is_extra) => {
    // 1. Delete existing shift for this user and date
    await supabase
      .from('schedules')
      .delete()
      .eq('userId', userId)
      .eq('date', date);

    const { data: userData } = await supabase.from('users').select('group_id').eq('id', userId).single();

    // 2. Insert new shift
    const payload = {
      userId,
      group_id: userData?.group_id || null,
      date,
      start_time,
      end_time,
      is_extra
    };
    const { error } = await supabase
      .from('schedules')
      .insert([payload]);
      
    if (error) {
      console.error('Error admin saving shift:', error);
      return false;
    }
    
    // Set notification flag
    await supabase.from('users').update({ schedule_changed: true }).eq('id', userId);
    return true;
  },

  adminDeleteShift: async (userId, date) => {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('userId', userId)
      .eq('date', date);
      
    if (error) {
      console.error('Error admin deleting shift:', error);
      return false;
    }
    
    // Set notification flag
    await supabase.from('users').update({ schedule_changed: true }).eq('id', userId);
    return true;
  },

  acknowledgeScheduleChange: async (userId) => {
    const { error } = await supabase
      .from('users')
      .update({ schedule_changed: false })
      .eq('id', userId);
      
    if (error) {
      console.error('Error acknowledging schedule change:', error);
    } else {
      // Also update the local auth user if needed, though we manage it via a fetch
      const authUser = useAuthStore.getState().user;
      if (authUser && authUser.id === userId) {
        useAuthStore.setState({ user: { ...authUser, schedule_changed: false } });
      }
    }
  }
}));
