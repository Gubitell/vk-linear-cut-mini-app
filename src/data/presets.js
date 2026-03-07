export const MATERIAL_PRESETS = [
  {
    id: "board_6000",
    title: "Доска 6000 мм",
    description: "Стандарт для теста из desktop-версии",
    material: {
      name: "Доска 6000",
      length: 6000,
      cutWidth: 3,
      cost: 450
    }
  },
  {
    id: "pipe_3000",
    title: "Профиль 3000 мм",
    description: "Быстрый сценарий для мебели и каркасов",
    material: {
      name: "Профиль 3000",
      length: 3000,
      cutWidth: 2,
      cost: 220
    }
  },
  {
    id: "sheet_strip_100",
    title: "Планка 100 мм",
    description: "Короткие тесты с нулевым пропилом",
    material: {
      name: "Планка 100",
      length: 100,
      cutWidth: 0,
      cost: 0
    }
  }
];

export const DETAIL_PRESETS = [
  {
    id: "desktop_sample",
    title: "Пример из Python",
    details: [
      { length: 1200, quantity: 23 },
      { length: 2300, quantity: 12 },
      { length: 3000, quantity: 6 },
      { length: 800, quantity: 17 }
    ]
  },
  {
    id: "kitchen",
    title: "Кухонные фасады",
    details: [
      { length: 800, quantity: 2 },
      { length: 600, quantity: 4 },
      { length: 400, quantity: 2 }
    ]
  },
  {
    id: "balcony",
    title: "Балкон",
    details: [
      { length: 2400, quantity: 2 },
      { length: 1800, quantity: 3 },
      { length: 1200, quantity: 4 }
    ]
  }
];
