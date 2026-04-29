import { MAIN_PRODUCTS, CROSS_PRODUCTS, SERVICES } from '../data/products';

/**
 * Форматирует число как валюту (рубли)
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(Number(amount))) return '0 ₽';
  return `${Number(amount).toLocaleString('ru-RU')} ₽`;
}

/**
 * Генерирует JSON встречи для отправки на бэкенд
 */
export function generateMeetingJSON(wizardState, agentName, meetingId) {
  const products = [];

  // Main products
  MAIN_PRODUCTS.forEach((product) => {
    const selected = wizardState.mainProducts[product.id];
    if (selected?.selected) {
      let earned = product.price;
      const options = {};

      product.options.forEach((opt) => {
        const isChecked = !!selected.options[opt.id];
        options[opt.label] = isChecked;
        if (isChecked) earned += opt.bonus;
      });

      products.push({
        type: 'main',
        name: product.name,
        options,
        earned,
      });
    }
  });

  // Cross products
  CROSS_PRODUCTS.forEach((product) => {
    const selected = wizardState.crossProducts[product.id];
    if (selected?.selected) {
      if (product.hasStepper) {
        // Каждая карта — отдельная запись
        const cards = selected.cards || [];
        cards.forEach((card, i) => {
          let earned = 0;
          const options = {};
          product.options.forEach((opt) => {
            const isChecked = !!card[opt.id];
            options[opt.label] = isChecked;
            if (isChecked) earned += opt.bonus;
          });

          products.push({
            type: 'cross',
            name: `${product.name} #${i + 1}`,
            quantity: 1,
            options,
            earned,
          });
        });
      } else {
        // Обычный кросс — без степпера
        let earned = 0;
        const options = {};
        product.options.forEach((opt) => {
          const isChecked = !!selected.options[opt.id];
          options[opt.label] = isChecked;
          if (isChecked) earned += opt.bonus;
        });

        products.push({
          type: 'cross',
          name: product.name,
          quantity: 1,
          options,
          earned,
        });
      }
    }
  });

  // Services
  SERVICES.forEach((service) => {
    if (service.type === 'toggle') {
      if (wizardState.services[service.id]) {
        products.push({
          type: 'service',
          name: service.name,
          options: {},
          earned: service.bonus,
        });
      }
    } else if (service.type === 'expandable') {
      const state = wizardState.services[service.id];
      if (state?.active) {
        let earned = service.bonus;
        const options = {};
        service.options?.forEach((opt) => {
          const isChecked = !!state.options?.[opt.id];
          options[opt.label] = isChecked;
          if (isChecked) earned += opt.bonus;
        });
        products.push({
          type: 'service',
          name: service.name,
          options,
          earned,
        });
      }
    }
  });

  const totalEarned = products.reduce((sum, p) => sum + p.earned, 0);

  return {
    meetingId: meetingId || null,
    agent_name: agentName,
    meeting_timestamp: new Date().toISOString(),
    total_earned: totalEarned,
    products,
  };
}

/**
 * Рассчитывает итоговую сумму из стейта визарда
 */
export function calculateTotal(wizardState) {
  let total = 0;

  // Main
  MAIN_PRODUCTS.forEach((product) => {
    const selected = wizardState.mainProducts[product.id];
    if (selected?.selected) {
      total += product.price;
      product.options.forEach((opt) => {
        if (selected.options[opt.id]) total += opt.bonus;
      });
    }
  });

  // Cross
  CROSS_PRODUCTS.forEach((product) => {
    const selected = wizardState.crossProducts[product.id];
    if (selected?.selected) {
      if (product.hasStepper) {
        // Считаем по каждой карте отдельно
        const cards = selected.cards || [];
        cards.forEach((card) => {
          product.options.forEach((opt) => {
            if (card[opt.id]) total += opt.bonus;
          });
        });
      } else {
        // Обычный кросс
        product.options.forEach((opt) => {
          if (selected.options?.[opt.id]) total += opt.bonus;
        });
      }
    }
  });

  // Services
  SERVICES.forEach((service) => {
    if (service.type === 'toggle') {
      if (wizardState.services[service.id]) {
        total += service.bonus;
      }
    } else if (service.type === 'expandable') {
      const state = wizardState.services[service.id];
      if (state?.active) {
        total += service.bonus; // базовая (0)
        service.options?.forEach((opt) => {
          if (state.options?.[opt.id]) total += opt.bonus;
        });
      }
    }
  });

  return total;
}
