import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { MAIN_PRODUCTS, CROSS_PRODUCTS, SERVICES } from '../data/products';

const DEFAULT_LINKS = {
  max_url: '',
  sfago_url: '',
};

// Default leaderboard tabs
const DEFAULT_LEADERBOARD_TABS = [
  { id: 'earnings', label: 'Заработок', type: 'earnings' },
  { id: 'bs', label: 'Продажи БС', type: 'product', productName: 'БС' },
  { id: 'kl', label: 'Продажи КЛ', type: 'product', productName: 'КЛ' },
];

/**
 * Generic helper: upsert a key-value pair into the `settings` table.
 */
async function upsertSetting(key, value, groupId) {
  if (!groupId) return false;

  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .eq('key', key)
    .eq('group_id', groupId)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase.from('settings').update({ value }).eq('id', existing.id));
  } else {
    ({ error } = await supabase.from('settings').insert([{ key, value, group_id: groupId }]));
  }

  if (error) {
    console.error(`Error saving setting "${key}":`, error);
    return false;
  }
  return true;
}

export const useSettingsStore = create((set, get) => ({
  links: { ...DEFAULT_LINKS },
  customLinks: [],
  loaded: false,

  // Products (dynamic, with hardcoded fallback)
  productsMain: [...MAIN_PRODUCTS],
  productsCross: [...CROSS_PRODUCTS],
  productsServices: [...SERVICES],
  productsLoaded: false,

  // Leaderboard config
  leaderboardTabs: [...DEFAULT_LEADERBOARD_TABS],
  leaderboardLoaded: false,

  // ─── Links ────────────────────────────────────

  fetchLinks: async (groupId) => {
    if (!groupId) return;
    const { data: qlData, error: qlError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'quick_links')
      .eq('group_id', groupId)
      .maybeSingle();

    if (qlError) console.error('Error fetching quick_links:', qlError);

    const { data: clData, error: clError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'custom_links')
      .eq('group_id', groupId)
      .maybeSingle();

    if (clError) console.error('Error fetching custom_links:', clError);

    set({
      links: qlData?.value ? { ...DEFAULT_LINKS, ...qlData.value } : { ...DEFAULT_LINKS },
      customLinks: clData?.value || [],
      loaded: true,
    });
  },

  saveLinks: async (newLinks, groupId) => {
    const ok = await upsertSetting('quick_links', newLinks, groupId);
    if (ok) set({ links: newLinks });
    return ok;
  },

  saveCustomLinks: async (newCustomLinks, groupId) => {
    const ok = await upsertSetting('custom_links', newCustomLinks, groupId);
    if (ok) set({ customLinks: newCustomLinks });
    return ok;
  },

  // ─── Products ─────────────────────────────────

  fetchProducts: async (groupId) => {
    if (!groupId) return;
    const keys = ['products_main', 'products_cross', 'products_services'];
    const results = {};

    for (const key of keys) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .eq('group_id', groupId)
        .maybeSingle();
      if (error) console.error(`Error fetching ${key}:`, error);
      results[key] = data?.value || null;
    }

    set({
      productsMain: results['products_main'] || [],
      productsCross: results['products_cross'] || [],
      productsServices: results['products_services'] || [],
      productsLoaded: true,
    });
  },

  saveProductsMain: async (products, groupId) => {
    const ok = await upsertSetting('products_main', products, groupId);
    if (ok) set({ productsMain: products });
    return ok;
  },

  saveProductsCross: async (products, groupId) => {
    const ok = await upsertSetting('products_cross', products, groupId);
    if (ok) set({ productsCross: products });
    return ok;
  },

  saveProductsServices: async (products, groupId) => {
    const ok = await upsertSetting('products_services', products, groupId);
    if (ok) set({ productsServices: products });
    return ok;
  },

  // ─── Leaderboard Config ───────────────────────

  fetchLeaderboardTabs: async (groupId) => {
    if (!groupId) return;
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'leaderboard_tabs')
      .eq('group_id', groupId)
      .maybeSingle();

    if (error) console.error('Error fetching leaderboard_tabs:', error);

    set({ leaderboardTabs: data?.value || [] });
    set({ leaderboardLoaded: true });
  },

  saveLeaderboardTabs: async (tabs, groupId) => {
    const ok = await upsertSetting('leaderboard_tabs', tabs, groupId);
    if (ok) set({ leaderboardTabs: tabs });
    return ok;
  },
}));
