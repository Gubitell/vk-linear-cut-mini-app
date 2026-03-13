import { bridgeStorageGet, bridgeStorageSet } from "./vk.js";

const HISTORY_KEY = "linear_cut_history_v1";
const TEMPLATES_KEY = "material_templates_v1";
const HISTORY_LIMIT = 20;

function parseHistory(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLocalHistory() {
  try {
    return parseHistory(window.localStorage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

function setLocalHistory(history) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    return undefined;
  }

  return undefined;
}

export async function loadHistory() {
  const fromBridge = parseHistory(await bridgeStorageGet(HISTORY_KEY));

  if (fromBridge.length > 0) {
    setLocalHistory(fromBridge);
    return fromBridge;
  }

  return getLocalHistory();
}

export async function saveHistoryEntry(entry) {
  const nextHistory = [entry, ...getLocalHistory()]
    .slice(0, HISTORY_LIMIT)
    .sort((left, right) => new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime());

  setLocalHistory(nextHistory);
  await bridgeStorageSet(HISTORY_KEY, JSON.stringify(nextHistory));

  return nextHistory;
}

export async function deleteHistoryEntry(entryId) {
  const nextHistory = getLocalHistory().filter((item) => item.id !== entryId);

  setLocalHistory(nextHistory);
  await bridgeStorageSet(HISTORY_KEY, JSON.stringify(nextHistory));

  return nextHistory;
}

function getLocalTemplates() {
  try {
    return parseHistory(window.localStorage.getItem(TEMPLATES_KEY));
  } catch {
    return [];
  }
}

function setLocalTemplates(templates) {
  try {
    window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    return undefined;
  }

  return undefined;
}

export async function loadMaterialTemplates() {
  const fromBridge = parseHistory(await bridgeStorageGet(TEMPLATES_KEY));

  if (fromBridge.length > 0) {
    setLocalTemplates(fromBridge);
    return fromBridge;
  }

  return getLocalTemplates();
}

export async function saveMaterialTemplate(template) {
  const nextTemplates = [template, ...getLocalTemplates().filter((item) => item.id !== template.id)].sort((left, right) =>
    left.title.localeCompare(right.title, "ru-RU")
  );

  setLocalTemplates(nextTemplates);
  await bridgeStorageSet(TEMPLATES_KEY, JSON.stringify(nextTemplates));

  return nextTemplates;
}

export async function deleteMaterialTemplate(templateId) {
  const nextTemplates = getLocalTemplates().filter((item) => item.id !== templateId);

  setLocalTemplates(nextTemplates);
  await bridgeStorageSet(TEMPLATES_KEY, JSON.stringify(nextTemplates));

  return nextTemplates;
}
