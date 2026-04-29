import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_LINKS = {
  max_url: '',
  sfago_url: '',
};

export const useSettingsStore = create((set, get) => ({
  links: { ...DEFAULT_LINKS },
  customLinks: [],
  loaded: false,

  fetchLinks: async () => {
    // Fetch quick links
    const { data: qlData, error: qlError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'quick_links')
      .maybeSingle();

    if (qlError) console.error('Error fetching quick_links:', qlError);

    // Fetch custom links
    const { data: clData, error: clError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'custom_links')
      .maybeSingle();

    if (clError) console.error('Error fetching custom_links:', clError);

    set({
      links: qlData?.value ? { ...DEFAULT_LINKS, ...qlData.value } : { ...DEFAULT_LINKS },
      customLinks: clData?.value || [],
      loaded: true,
    });
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
      console.error('Error saving quick_links:', error);
      return false;
    }

    set({ links: newLinks });
    return true;
  },

  saveCustomLinks: async (newCustomLinks) => {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'custom_links')
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('settings')
        .update({ value: newCustomLinks })
        .eq('key', 'custom_links'));
    } else {
      ({ error } = await supabase
        .from('settings')
        .insert([{ key: 'custom_links', value: newCustomLinks }]));
    }

    if (error) {
      console.error('Error saving custom_links:', error);
      return false;
    }

    set({ customLinks: newCustomLinks });
    return true;
  },
}));
