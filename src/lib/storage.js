import { bridgeStorageGet, bridgeStorageSet } from "./vk.js";

const HISTORY_KEY = "linear_cut_history_v1";
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
