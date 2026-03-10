# VK Mini App: Оптимальный линейный раскрой

Мини-приложение ВКонтакте на `JavaScript + React + VKUI + VK Bridge` для расчёта оптимального линейного раскроя по эвристике `FFD (First Fit Decreasing)`.

## Что уже сделано

- настроена обвязка VK Mini Apps через `@vkontakte/vk-bridge` и `@vkontakte/vk-bridge-react`;
- сделаны экраны:
  - стартовый экран с шаблонами;
  - ввод материала;
  - ввод деталей;
  - результаты;
  - история расчётов;
- история сохраняется через `VKWebAppStorageGet` / `VKWebAppStorageSet` с fallback на `localStorage`;
- реализовано получение профиля пользователя через `VKWebAppGetUserInfo`;
- реализовано копирование сводки расчёта через `VKWebAppCopyText`.

## Структура

```text
src/
  App.jsx
  main.jsx
  styles.css
  components/
    BoardScheme.jsx
  data/
    presets.js
  lib/
    optimizer.js
    storage.js
    transformVKBridgeAdaptivity.js
    vk.js
scripts/
  verify-optimizer.mjs
```

## Запуск

```bash
npm install
npm run dev
```

## Проверка алгоритма без UI

Даже без установки фронтенд-зависимостей можно быстро проверить перенос логики:

```bash
node ./scripts/verify-optimizer.mjs
```

или

```bash
npm run verify:optimizer
```


