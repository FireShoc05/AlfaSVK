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
async function upsertSetting(key, value) {
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .eq('key', key)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase.from('settings').update({ value }).eq('key', key));
  } else {
    ({ error } = await supabase.from('settings').insert([{ key, value }]));
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

  fetchLinks: async () => {
    const { data: qlData, error: qlError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'quick_links')
      .maybeSingle();

    if (qlError) console.error('Error fetching quick_links:', qlError);

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
    const ok = await upsertSetting('quick_links', newLinks);
    if (ok) set({ links: newLinks });
    return ok;
  },

  saveCustomLinks: async (newCustomLinks) => {
    const ok = await upsertSetting('custom_links', newCustomLinks);
    if (ok) set({ customLinks: newCustomLinks });
    return ok;
  },

  // ─── Products ─────────────────────────────────

  fetchProducts: async () => {
    const keys = ['products_main', 'products_cross', 'products_services'];
    const results = {};

    for (const key of keys) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      if (error) console.error(`Error fetching ${key}:`, error);
      results[key] = data?.value || null;
    }

    set({
      productsMain: results['products_main'] || [...MAIN_PRODUCTS],
      productsCross: results['products_cross'] || [...CROSS_PRODUCTS],
      productsServices: results['products_services'] || [...SERVICES],
      productsLoaded: true,
    });
  },

  saveProductsMain: async (products) => {
    const ok = await upsertSetting('products_main', products);
    if (ok) set({ productsMain: products });
    return ok;
  },

  saveProductsCross: async (products) => {
    const ok = await upsertSetting('products_cross', products);
    if (ok) set({ productsCross: products });
    return ok;
  },

  saveProductsServices: async (products) => {
    const ok = await upsertSetting('products_services', products);
    if (ok) set({ productsServices: products });
    return ok;
  },

  // ─── Leaderboard Config ───────────────────────

  fetchLeaderboardTabs: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'leaderboard_tabs')
      .maybeSingle();

    if (error) console.error('Error fetching leaderboard_tabs:', error);

    set({
      leaderboardTabs: data?.value || [...DEFAULT_LEADERBOARD_TABS],
      leaderboardLoaded: true,
    });
  },

  saveLeaderboardTabs: async (tabs) => {
    const ok = await upsertSetting('leaderboard_tabs', tabs);
    if (ok) set({ leaderboardTabs: tabs });
    return ok;
  },
}));
