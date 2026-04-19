/* Конфигурация всех продуктов, услуг и кросс-продуктов */

export const MAIN_PRODUCTS = [
  {
    id: 'dk',
    name: 'ДК',
    price: 250,
    type: 'card',
    options: [
      { id: 'tr', label: 'ТР', bonus: 70 },
      { id: 'ak', label: 'АК', bonus: 0 },
    ],
  },
  {
    id: 'x5',
    name: 'X5',
    price: 250,
    type: 'card',
    options: [
      { id: 'tr', label: 'ТР', bonus: 70 },
      { id: 'ak', label: 'АК', bonus: 0 },
    ],
  },
  {
    id: 'kk1',
    name: 'КК1',
    price: 450,
    type: 'card',
    options: [
      { id: 'tr', label: 'ТР', bonus: 70 },
      { id: 'ak', label: 'АК', bonus: 0 },
    ],
  },
  {
    id: 'kk2',
    name: 'КК2',
    price: 450,
    type: 'card',
    options: [
      { id: 'tr', label: 'ТР', bonus: 70 },
      { id: 'ak', label: 'АК', bonus: 0 },
    ],
  },
  {
    id: 'mp',
    name: 'МП',
    price: 310,
    type: 'toggle',
    options: [],
  },
];

export const CROSS_PRODUCTS = [
  {
    id: 'cross_dk',
    name: 'Кросс ДК',
    price: 0,
    hasStepper: false,
    options: [
      { id: 'tr_150', label: 'ТР от 150 руб', bonus: 270 },
      { id: 'ak', label: 'АК', bonus: 0 },
    ],
  },
  {
    id: 'cross_det',
    name: 'Кросс Дет',
    price: 0,
    hasStepper: true,
    maxQty: 5,
    options: [
      { id: 'tr_150', label: 'ТР от 150 руб', bonus: 270 },
      { id: 'ak', label: 'АК', bonus: 0 },
    ],
  },
];

export const SERVICES = [
  {
    id: 'apay',
    name: 'A-Pay',
    type: 'toggle',
    bonus: 10,
  },
  {
    id: 'bs',
    name: 'БС',
    type: 'expandable',
    bonus: 0,
    options: [
      { id: 'tr_1000', label: 'ТР от 1000 руб', bonus: 270 },
    ],
  },
  {
    id: 'ks',
    name: 'КС',
    type: 'toggle',
    bonus: 100,
  },
  {
    id: 'kl',
    name: 'КЛ',
    type: 'expandable',
    bonus: 0,
    options: [
      { id: 'tr_1', label: 'ТР от 1 руб', bonus: 570 },
    ],
  },
];
