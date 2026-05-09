/**
 * configIO.js — Export / Import group configuration
 *
 * File format: .alfacfg
 *   The file content is a Base64-encoded JSON string.
 *   Structure of the decoded JSON:
 *   {
 *     version: 1,
 *     exportedAt: ISO string,
 *     sections: {
 *       products?: { main: [], cross: [], services: [] },
 *       leaderboard?: [],
 *       links?: { quick_links: {}, custom_links: [] }
 *     }
 *   }
 */

const CONFIG_VERSION = 1;
const FILE_EXTENSION = '.alfacfg';

/**
 * Build and download a config file.
 *
 * @param {Object} data              Full data object
 * @param {Array}  data.productsMain
 * @param {Array}  data.productsCross
 * @param {Array}  data.productsServices
 * @param {Array}  data.leaderboardTabs
 * @param {Object} data.links           quick_links object
 * @param {Array}  data.customLinks
 * @param {Object} selectedSections     { products: bool, leaderboard: bool, links: bool }
 */
export function exportConfig(data, selectedSections) {
  const payload = {
    version: CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    sections: {},
  };

  if (selectedSections.products) {
    payload.sections.products = {
      main: data.productsMain || [],
      cross: data.productsCross || [],
      services: data.productsServices || [],
    };
  }

  if (selectedSections.leaderboard) {
    payload.sections.leaderboard = data.leaderboardTabs || [];
  }

  if (selectedSections.links) {
    payload.sections.links = {
      quick_links: data.links || {},
      custom_links: data.customLinks || [],
    };
  }

  // Encode to Base64
  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));

  // Trigger download
  const blob = new Blob([base64], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `config_${timestamp}${FILE_EXTENSION}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read and parse a .alfacfg file.
 *
 * @param {File} file  The file selected by the user
 * @returns {Promise<Object>}  Parsed config object with `sections` key
 * @throws {Error} on invalid file
 */
export async function importConfig(file) {
  if (!file) throw new Error('Файл не выбран');

  // Validate extension
  if (!file.name.endsWith(FILE_EXTENSION)) {
    throw new Error(`Неверный формат файла. Ожидается ${FILE_EXTENSION}`);
  }

  const base64 = await file.text();

  let jsonStr;
  try {
    jsonStr = decodeURIComponent(escape(atob(base64.trim())));
  } catch {
    throw new Error('Файл повреждён или не является конфигурацией AlfaSVK');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Не удалось разобрать содержимое файла');
  }

  // Validate structure
  if (!parsed.version || parsed.version > CONFIG_VERSION) {
    throw new Error(`Неподдерживаемая версия конфигурации (v${parsed.version})`);
  }

  if (!parsed.sections || typeof parsed.sections !== 'object') {
    throw new Error('Файл не содержит секций конфигурации');
  }

  const hasSomething =
    parsed.sections.products ||
    parsed.sections.leaderboard ||
    parsed.sections.links;

  if (!hasSomething) {
    throw new Error('Файл пуст — ни одна секция не найдена');
  }

  return parsed;
}

/**
 * Summarise what sections are available in a parsed config.
 *
 * @param {Object} parsed  The object returned by importConfig()
 * @returns {Object}  { products: { available, mainCount, crossCount, servicesCount },
 *                      leaderboard: { available, count },
 *                      links: { available, quickLinksCount, customLinksCount } }
 */
export function summariseConfig(parsed) {
  const s = parsed.sections;
  return {
    products: {
      available: !!s.products,
      mainCount: s.products?.main?.length || 0,
      crossCount: s.products?.cross?.length || 0,
      servicesCount: s.products?.services?.length || 0,
    },
    leaderboard: {
      available: !!s.leaderboard,
      count: Array.isArray(s.leaderboard) ? s.leaderboard.length : 0,
    },
    links: {
      available: !!s.links,
      quickLinksCount: s.links?.quick_links ? Object.keys(s.links.quick_links).filter((k) => s.links.quick_links[k]).length : 0,
      customLinksCount: s.links?.custom_links?.length || 0,
    },
  };
}
