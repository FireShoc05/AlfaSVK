import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_LINKS = {
  max_url: '',
  sfago_url: '',
};

export const useSettingsStore = create((set, get) => ({
  links: { ...DEFAULT_LINKS },
  loaded: false,

  fetchLinks: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'quick_links')
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
    }
    
    if (data?.value) {
      set({ links: { ...DEFAULT_LINKS, ...data.value }, loaded: true });
    } else {
      set({ loaded: true });
    }
  },

  saveLinks: async (newLinks) => {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'quick_links')
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('settings')
        .update({ value: newLinks })
        .eq('key', 'quick_links'));
    } else {
      ({ error } = await supabase
        .from('settings')
        .insert([{ key: 'quick_links', value: newLinks }]));
    }

    if (error) {
      console.error('Error saving settings:', error);
      return false;
    }

    set({ links: newLinks });
    return true;
  },
}));
