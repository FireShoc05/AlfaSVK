

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
export function generateMeetingJSON(wizardState, agentName, meetingId, mainProducts, crossProducts, services) {
  const MAIN_PRODUCTS = mainProducts || [];
  const CROSS_PRODUCTS = crossProducts || [];
  const SERVICES = services || [];

  const products = [];

  // Main products
  MAIN_PRODUCTS.forEach((product) => {
    const selected = wizardState.mainProducts[product.id];
    if (selected?.selected) {
      // Stepper main product: each card is a separate entry
      if (product.hasStepper) {
        const cards = selected.cards || [];
        cards.forEach((card, i) => {
          let earned = product.price;
          const options = {};
          product.options.forEach((opt) => {
            const isChecked = !!card[opt.id];
            options[opt.label] = isChecked;
            if (isChecked) earned += opt.bonus;
          });

          products.push({
            type: 'main',
            name: `${product.name} #${i + 1}`,
            quantity: 1,
            options,
            earned,
          });
        });
      } else {
        // Non-stepper main product
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
      if (service.hasStepper) {
        // Toggle service with stepper: multiple instances
        const state = wizardState.services[service.id];
        if (state?.active) {
          const count = state.quantity || 1;
          for (let i = 0; i < count; i++) {
            products.push({
              type: 'service',
              name: count > 1 ? `${service.name} #${i + 1}` : service.name,
              quantity: 1,
              options: {},
              earned: service.bonus,
            });
          }
        }
      } else {
        // Simple toggle service
        if (wizardState.services[service.id]) {
          products.push({
            type: 'service',
            name: service.name,
            options: {},
            earned: service.bonus,
          });
        }
      }
    } else if (service.type === 'expandable') {
      const state = wizardState.services[service.id];
      if (state?.active) {
        if (service.hasStepper) {
          // Expandable with stepper: each card is a separate entry
          const cards = state.cards || [];
          cards.forEach((card, i) => {
            let earned = service.bonus;
            const options = {};
            service.options?.forEach((opt) => {
              const isChecked = !!card[opt.id];
              options[opt.label] = isChecked;
              if (isChecked) earned += opt.bonus;
            });
            products.push({
              type: 'service',
              name: cards.length > 1 ? `${service.name} #${i + 1}` : service.name,
              quantity: 1,
              options,
              earned,
            });
          });
        } else {
          // Expandable without stepper (original behavior)
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
export function calculateTotal(wizardState, mainProducts, crossProducts, services) {
  const MAIN_PRODUCTS = mainProducts || [];
  const CROSS_PRODUCTS = crossProducts || [];
  const SERVICES = services || [];

  let total = 0;

  // Main
  MAIN_PRODUCTS.forEach((product) => {
    const selected = wizardState.mainProducts[product.id];
    if (selected?.selected) {
      if (product.hasStepper) {
        // Stepper: each card contributes base price + checked options
        const cards = selected.cards || [];
        cards.forEach((card) => {
          total += product.price;
          product.options.forEach((opt) => {
            if (card[opt.id]) total += opt.bonus;
          });
        });
      } else {
        total += product.price;
        product.options.forEach((opt) => {
          if (selected.options[opt.id]) total += opt.bonus;
        });
      }
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
      if (service.hasStepper) {
        const state = wizardState.services[service.id];
        if (state?.active) {
          const count = state.quantity || 1;
          total += service.bonus * count;
        }
      } else {
        if (wizardState.services[service.id]) {
          total += service.bonus;
        }
      }
    } else if (service.type === 'expandable') {
      const state = wizardState.services[service.id];
      if (state?.active) {
        if (service.hasStepper) {
          // Stepper: base bonus per card + card options
          const cards = state.cards || [];
          cards.forEach((card) => {
            total += service.bonus;
            service.options?.forEach((opt) => {
              if (card[opt.id]) total += opt.bonus;
            });
          });
        } else {
          total += service.bonus; // базовая (0)
          service.options?.forEach((opt) => {
            if (state.options?.[opt.id]) total += opt.bonus;
          });
        }
      }
    }
  });

  return total;
}
