import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

export const useScheduleStore = create((set, get) => ({
  schedules: [], // All fetched schedules
  locks: [], // Locks for the currently viewed month

  // Fetch schedules for a specific month (format 'YYYY-MM')
  // If userId is provided, fetch only for that user
  fetchSchedules: async (month, userId = null) => {
    let query = supabase.from('schedules').select('*, users(fullName, username)');
    
    // Filter by month using like (since date is YYYY-MM-DD)
    query = query.like('date', `${month}-%`);
    
    if (userId) {
      query = query.eq('userId', userId);
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
      // 1. Delete removed shifts (only if they are not extra)
      if (datesToDelete.length > 0) {
        await supabase
          .from('schedules')
          .delete()
          .eq('userId', userId)
          .in('date', datesToDelete)
          .eq('is_extra', false); // Employees cannot delete admin's extra shifts
      }

      // 2. Upsert new/modified shifts
      if (shiftsToUpsert.length > 0) {
        const payload = shiftsToUpsert.map(shift => ({
          userId,
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          is_extra: shift.is_extra || false
        }));
        
        await supabase
          .from('schedules')
          .upsert(payload, { onConflict: 'userId, date' });
      }

      // 3. Lock the month
      await supabase
        .from('schedule_locks')
        .upsert([{ userId, month }], { onConflict: 'userId, month' });
        
      return true;
    } catch (err) {
      console.error('Error saving month schedule:', err);
      return false;
    }
  },

  // Admin functions
  adminSaveShift: async (userId, date, start_time, end_time, is_extra) => {
    const payload = {
      userId,
      date,
      start_time,
      end_time,
      is_extra
    };
    const { error } = await supabase
      .from('schedules')
      .upsert([payload], { onConflict: 'userId, date' });
      
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
