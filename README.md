# VK Mini App: Оптимальный линейный раскрой

[![CI](https://github.com/Gubitell/vk-linear-cut-mini-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Gubitell/vk-linear-cut-mini-app/actions/workflows/ci.yml)

Мини-приложение для расчёта оптимального линейного раскроя. Стек: `React`, `VKUI`, `VK Bridge`, `Vite`.

## Что умеет

- хранить один проект с несколькими заготовками;
- сохранять пользовательские шаблоны заготовок;
- считать раскрой с учётом длины, пропила и стоимости;
- показывать текстовую и графическую схему раскроя;
- сохранять историю расчётов;
- экспортировать результат в `TXT` и `PDF`;
- работать с собственными единицами длины и обозначением валюты.

## VK API

- `VKWebAppInit`
- `VKWebAppGetUserInfo`
- `VKWebAppStorageGet`
- `VKWebAppStorageSet`
- `VKWebAppSetSwipeSettings`

## Структура

```text
src/
  components/
    BoardScheme.jsx
  lib/
    export.js
    optimizer.js
    storage.js
    transformVKBridgeAdaptivity.js
    vk.js
  App.jsx
  main.jsx
  styles.css
scripts/
  verify-optimizer.mjs
.github/
  workflows/
    ci.yml
vk-hosting-config.json
```

## Локальный запуск

```bash
npm install
npm run dev
```

Для Windows PowerShell, если `npm` блокируется политикой выполнения:

```powershell
npm.cmd run dev
```

## Проверки

Сборка:

```bash
npm run build
```

Проверка алгоритма:

```bash
npm run verify:optimizer
```

## CI

В `GitHub Actions` настроен workflow `CI`, который запускается:

- на `push` в `main` и рабочие ветки (`feature/**`, `feat/**`, `fix/**`, `chore/**`);
- на `pull_request` в `main`.

Pipeline делает:

- `npm ci`
- `npm run verify:optimizer`
- `npm run build`

## Экспорт

### Браузер

- `TXT` скачивается файлом;
- `PDF` скачивается файлом;
- для `PDF` доступен выбор ориентации;
- опция размеров от нуля применяется и к `TXT`, и к `PDF`.

### Мобильное приложение VK

- вместо `TXT` доступна кнопка `Скопировать данные расчёта`;
- `PDF` в приложении не скачивается, пользователь видит сообщение, что этот формат доступен через браузер;
- элементы, не работающие в `VK WebView`, скрыты.

## Хранение данных

- история расчётов и шаблоны заготовок сохраняются через `VKWebAppStorageGet` / `VKWebAppStorageSet`;
- если `VK Storage` недоступен, используется `localStorage`.

## Деплой

1. Указать `app_id` в `vk-hosting-config.json`.
2. Собрать проект:

```bash
npm run build
```

3. Выполнить деплой:

```bash
npm run deploy
```

Используется `@vkontakte/vk-miniapps-deploy`.

## Базовые сценарии проверки

- создание проекта;
- добавление нескольких заготовок;
- сохранение и удаление шаблонов;
- добавление, удаление и очистка деталей;
- расчёт раскроя;
- сохранение и удаление записей истории;
- экспорт `TXT` / `PDF` в браузере;
- копирование данных расчёта в мобильном приложении VK;
- масштабирование и перемещение схемы мышью, тачпадом и на смартфоне.
