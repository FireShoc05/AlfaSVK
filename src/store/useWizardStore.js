import { create } from 'zustand';

const INITIAL_STATE = {
  currentStep: 1,
  mainProducts: {},
  crossProducts: {},
  // crossProducts example for stepper products:
  // { cross_det: { selected: true, quantity: 2, cards: [ { tr_150: false, ak: false }, { tr_150: true, ak: false } ] } }
  // For non-stepper products:
  // { cross_dk: { selected: true, options: { tr_150: true, ak: false } } }
  services: {},
};

export const useWizardStore = create((set) => ({
  ...INITIAL_STATE,

  // Navigation
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 4) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  // Step 1: Main products
  toggleMainProduct: (productId) => set((s) => {
    const current = s.mainProducts[productId];
    if (current?.selected) {
      const updated = { ...s.mainProducts };
      delete updated[productId];
      return { mainProducts: updated };
    }
    return {
      mainProducts: {
        ...s.mainProducts,
        [productId]: { selected: true, options: {} },
      },
    };
  }),

  setMainProductOption: (productId, optionId, value) => set((s) => ({
    mainProducts: {
      ...s.mainProducts,
      [productId]: {
        ...s.mainProducts[productId],
        options: {
          ...s.mainProducts[productId]?.options,
          [optionId]: value,
        },
      },
    },
  })),

  // Step 2: Cross products
  toggleCrossProduct: (productId, hasStepper) => set((s) => {
    const current = s.crossProducts[productId];
    if (current?.selected) {
      const updated = { ...s.crossProducts };
      delete updated[productId];
      return { crossProducts: updated };
    }
    return {
      crossProducts: {
        ...s.crossProducts,
        [productId]: hasStepper
          ? { selected: true, quantity: 1, cards: [{}] }
          : { selected: true, options: {} },
      },
    };
  }),

  // Для обычных кросс-продуктов (без степпера)
  setCrossProductOption: (productId, optionId, value) => set((s) => ({
    crossProducts: {
      ...s.crossProducts,
      [productId]: {
        ...s.crossProducts[productId],
        options: {
          ...s.crossProducts[productId]?.options,
          [optionId]: value,
        },
      },
    },
  })),

  // Для кросс-продуктов со степпером — опция конкретной карты
  setCrossCardOption: (productId, cardIndex, optionId, value) => set((s) => {
    const product = s.crossProducts[productId];
    if (!product) return {};
    const cards = [...(product.cards || [])];
    cards[cardIndex] = { ...cards[cardIndex], [optionId]: value };
    return {
      crossProducts: {
        ...s.crossProducts,
        [productId]: { ...product, cards },
      },
    };
  }),

  setCrossProductQuantity: (productId, quantity) => set((s) => {
    const product = s.crossProducts[productId];
    if (!product) return {};
    const oldCards = product.cards || [];
    let cards;
    if (quantity > oldCards.length) {
      // Добавляем пустые карточки
      cards = [...oldCards, ...Array(quantity - oldCards.length).fill(null).map(() => ({}))];
    } else {
      // Обрезаем лишние
      cards = oldCards.slice(0, quantity);
    }
    return {
      crossProducts: {
        ...s.crossProducts,
        [productId]: { ...product, quantity, cards },
      },
    };
  }),

  // Step 3: Services
  // For toggle services: { apay: true }
  // For expandable services: { bs: { active: true, options: { tr_1000: true } } }
  toggleService: (serviceId, value) => set((s) => ({
    services: {
      ...s.services,
      [serviceId]: value,
    },
  })),

  // Для expandable-сервисов (БС, КЛ) — переключение
  toggleExpandableService: (serviceId) => set((s) => {
    const current = s.services[serviceId];
    if (current?.active) {
      const updated = { ...s.services };
      delete updated[serviceId];
      return { services: updated };
    }
    return {
      services: {
        ...s.services,
        [serviceId]: { active: true, options: {} },
      },
    };
  }),

  setServiceOption: (serviceId, optionId, value) => set((s) => ({
    services: {
      ...s.services,
      [serviceId]: {
        ...s.services[serviceId],
        options: {
          ...s.services[serviceId]?.options,
          [optionId]: value,
        },
      },
    },
  })),

  // Reset wizard
  resetWizard: () => set({ ...INITIAL_STATE }),
}));
