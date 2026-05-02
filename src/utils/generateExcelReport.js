import * as XLSX from 'xlsx';

/**
 * Убирает суффикс " #N" из имени продукта (для агрегации степпер-продуктов)
 */
function getBaseName(name) {
  if (!name) return '';
  return name.replace(/ #\d+$/, '');
}

/**
 * Находит конфиг продукта по имени (базовому) из списка конфигов
 */
function findProductConfig(baseName, productsMain, productsCross, productsServices) {
  const all = [
    ...(productsMain || []),
    ...(productsCross || []),
    ...(productsServices || []),
  ];
  return all.find((p) => p.name === baseName) || null;
}

/**
 * Маппинг типа продукта в категорию для Excel
 */
function getCategoryLabel(type) {
  if (type === 'main') return 'Продукты';
  if (type === 'cross') return 'Доп. продукты';
  if (type === 'service') return 'Услуги';
  return type;
}

/**
 * Агрегирует массив products[] из meetings в структуру для Excel.
 * Возвращает массив объектов { category, name, quantity, price, sum, options: [...] }
 */
function aggregateProducts(meetings, productsMain, productsCross, productsServices) {
  // Ключ: "type::baseName", значение: агрегат
  const map = new Map();

  meetings.forEach((meeting) => {
    (meeting.products || []).forEach((p) => {
      const baseName = getBaseName(p.name);
      const key = `${p.type}::${baseName}`;

      if (!map.has(key)) {
        const config = findProductConfig(baseName, productsMain, productsCross, productsServices);
        map.set(key, {
          type: p.type,
          category: getCategoryLabel(p.type),
          name: baseName,
          quantity: 0,
          price: config?.price ?? config?.bonus ?? 0,
          sum: 0,
          optionsMap: new Map(), // label -> { count, bonus, sum }
          config,
        });
      }

      const agg = map.get(key);
      agg.quantity += p.quantity || 1;
      agg.sum += p.earned || 0;

      // Aggregate options
      if (p.options && typeof p.options === 'object') {
        Object.entries(p.options).forEach(([label, isChecked]) => {
          if (!agg.optionsMap.has(label)) {
            // Find bonus for this option from config
            let bonus = 0;
            if (agg.config?.options) {
              const optConfig = agg.config.options.find((o) => o.label === label);
              if (optConfig) bonus = optConfig.bonus || 0;
            }
            agg.optionsMap.set(label, { count: 0, bonus, sum: 0 });
          }
          const optAgg = agg.optionsMap.get(label);
          if (isChecked) {
            optAgg.count += p.quantity || 1;
            optAgg.sum += optAgg.bonus * (p.quantity || 1);
          }
        });
      }
    });
  });

  // Convert to sorted array, grouped by category
  const order = ['Продукты', 'Услуги', 'Доп. продукты'];
  const result = Array.from(map.values()).sort((a, b) => {
    const ia = order.indexOf(a.category);
    const ib = order.indexOf(b.category);
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name, 'ru');
  });

  return result;
}

/**
 * Строит массив строк для одного листа (формат "Общая статистика" / индивидуальный лист)
 * Колонки: Категория, Элемент, Количество, Цена, Сумма
 */
function buildSheetRows(aggregated, totalMeetings) {
  const rows = [];
  rows.push(['Категория', 'Элемент', 'Количество', 'Цена', 'Сумма']);

  let totalSum = 0;

  aggregated.forEach((item) => {
    // Product row
    rows.push([item.category, item.name, item.quantity, item.price, item.sum]);
    totalSum += item.sum;

    // Option rows
    item.optionsMap.forEach((optAgg, label) => {
      if (optAgg.count > 0 || optAgg.bonus === 0) {
        rows.push(['  ↳ Опция', `    ${label}`, optAgg.count, optAgg.bonus, optAgg.sum]);
      }
    });
  });

  // Empty row + totals
  rows.push([]);
  rows.push(['ИТОГО', '', '', '', totalSum]);
  rows.push(['Всего встреч', '', '', '', totalMeetings]);

  return rows;
}

/**
 * Строит массив строк для "Сводная по сотрудникам"
 * Колонки: Сотрудник, Категория, Элемент, Количество, Цена, Сумма
 */
function buildSummaryByEmployeesRows(employeeDataList) {
  const rows = [];
  rows.push(['Сотрудник', 'Категория', 'Элемент', 'Количество', 'Цена', 'Сумма']);

  employeeDataList.forEach((emp, idx) => {
    const { name, aggregated, meetingsCount } = emp;
    let empSum = 0;

    aggregated.forEach((item) => {
      rows.push([name, item.category, item.name, item.quantity, item.price, item.sum]);
      empSum += item.sum;

      item.optionsMap.forEach((optAgg, label) => {
        if (optAgg.count > 0 || optAgg.bonus === 0) {
          rows.push([name, '  ↳ Опция', `    ${label}`, optAgg.count, optAgg.bonus, optAgg.sum]);
        }
      });
    });

    rows.push([`ИТОГО по ${name}`, '', '', meetingsCount, '', empSum]);

    // Empty separator row between employees (except last)
    if (idx < employeeDataList.length - 1) {
      rows.push([]);
    }
  });

  return rows;
}

/**
 * Обрезает имя листа до 31 символа (лимит Excel)
 */
function truncateSheetName(name) {
  if (name.length <= 31) return name;
  return name.slice(0, 28) + '...';
}

/**
 * Устанавливает ширину колонок
 */
function setColumnWidths(ws, colWidths) {
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));
}

/**
 * Главная функция генерации Excel отчёта.
 *
 * @param {Array} meetings — все встречи (массив из meetingsByUser)
 * @param {Array} users — все пользователи
 * @param {Array} productsMain — конфиг основных продуктов
 * @param {Array} productsCross — конфиг кросс-продуктов
 * @param {Array} productsServices — конфиг услуг
 * @param {string} selectedDate — дата в формате YYYY-MM-DD
 * @param {Array} rejections — массив отказов (для подсчёта неудачных встреч)
 */
export function generateExcelReport(
  meetings,
  users,
  productsMain,
  productsCross,
  productsServices,
  selectedDate,
  rejections = []
) {
  // Filter meetings by selected date
  const dailyMeetings = meetings.filter(
    (m) => m?.meeting_timestamp?.startsWith(selectedDate)
  );

  // Group meetings by userId
  const meetingsByUser = {};
  dailyMeetings.forEach((m) => {
    if (!meetingsByUser[m.userId]) meetingsByUser[m.userId] = [];
    meetingsByUser[m.userId].push(m);
  });

  // Build employee data list (sorted alphabetically)
  const employeeDataList = users
    .map((user) => {
      const userMeetings = meetingsByUser[user.id] || [];
      if (userMeetings.length === 0) return null;

      const lastName = (user.fullName || user.username || '').split(' ')[0] || 'Без имени';
      const aggregated = aggregateProducts(userMeetings, productsMain, productsCross, productsServices);

      return {
        name: lastName,
        fullName: user.fullName || user.username || '',
        aggregated,
        meetingsCount: userMeetings.length,
        meetings: userMeetings,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  // ── Sheet 1: Общая статистика ──
  const allAggregated = aggregateProducts(dailyMeetings, productsMain, productsCross, productsServices);
  const sheet1Rows = buildSheetRows(allAggregated, dailyMeetings.length);
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
  setColumnWidths(ws1, [18, 25, 14, 10, 14]);

  // ── Sheet 2: Сводная по сотрудникам ──
  const sheet2Rows = buildSummaryByEmployeesRows(employeeDataList);
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
  setColumnWidths(ws2, [20, 18, 25, 14, 10, 14]);

  // ── Create workbook ──
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Общая статистика');
  XLSX.utils.book_append_sheet(wb, ws2, 'Сводная по сотрудникам');

  // ── Sheets 3+: Individual employee sheets ──
  const usedNames = new Set(['Общая статистика', 'Сводная по сотрудникам']);

  employeeDataList.forEach((emp) => {
    const empAggregated = aggregateProducts(emp.meetings, productsMain, productsCross, productsServices);
    const empRows = buildSheetRows(empAggregated, emp.meetingsCount);
    const wsEmp = XLSX.utils.aoa_to_sheet(empRows);
    setColumnWidths(wsEmp, [18, 25, 14, 10, 14]);

    let sheetName = truncateSheetName(`${emp.name}...`);
    // Ensure unique sheet name
    let counter = 2;
    while (usedNames.has(sheetName)) {
      sheetName = truncateSheetName(`${emp.name} (${counter})...`);
      counter++;
    }
    usedNames.add(sheetName);

    XLSX.utils.book_append_sheet(wb, wsEmp, sheetName);
  });

  // ── Generate file ──
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Create filename with date
  const dateStr = selectedDate.replace(/-/g, '');
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const filename = `statistics_${dateStr}_${timeStr}.xlsx`;

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
