import vkBridge, { parseURLSearchParamsForGetLaunchParams } from "@vkontakte/vk-bridge";

let initialized = false;

export function initBridge() {
  if (initialized) {
    return;
  }

  initialized = true;
  vkBridge.send("VKWebAppInit").catch(() => undefined);
}

export function getLaunchPlatform() {
  try {
    const { vk_platform: vkPlatform } = parseURLSearchParamsForGetLaunchParams(window.location.search);
    return vkPlatform;
  } catch {
    return undefined;
  }
}

export async function getUserInfoSafe() {
  try {
    return await vkBridge.send("VKWebAppGetUserInfo");
  } catch {
    return null;
  }
}

export async function setSwipeSettings(isFirstPanel) {
  try {
    await vkBridge.send("VKWebAppSetSwipeSettings", {
      history: isFirstPanel
    });
  } catch {
    return undefined;
  }

  return undefined;
}

export async function bridgeStorageGet(key) {
  try {
    const response = await vkBridge.send("VKWebAppStorageGet", {
      keys: [key]
    });

    return response.keys?.[0]?.value ?? "";
  } catch {
    return "";
  }
}

export async function bridgeStorageSet(key, value) {
  try {
    await vkBridge.send("VKWebAppStorageSet", {
      key,
      value
    });

    return true;
  } catch {
    return false;
  }
}

export async function copyText(text) {
  try {
    await vkBridge.send("VKWebAppCopyText", {
      text
    });

    return true;
  } catch {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    return false;
  }
}

export function isVkWebView() {
  return vkBridge.isWebView();
}
