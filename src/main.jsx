import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdaptivityProvider, AppRoot, ConfigProvider } from "@vkontakte/vkui";
import { useAdaptivity, useAppearance, useInsets } from "@vkontakte/vk-bridge-react";
import "@vkontakte/vkui/dist/vkui.css";
import App from "./App.jsx";
import "./styles.css";
import { transformVKBridgeAdaptivity } from "./lib/transformVKBridgeAdaptivity.js";
import { getLaunchPlatform, initBridge, isVkWebView } from "./lib/vk.js";

initBridge();

function AppShell() {
  const appearance = useAppearance() || undefined;
  const insets = useInsets() || undefined;
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity());
  const launchPlatform = getLaunchPlatform();

  return (
    <ConfigProvider
      colorScheme={appearance}
      platform={launchPlatform === "desktop_web" ? "vkcom" : undefined}
      isWebView={isVkWebView()}
      hasCustomPanelHeaderAfter
    >
      <AdaptivityProvider {...adaptivity}>
        <AppRoot mode="full" safeAreaInsets={insets}>
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppShell />
  </StrictMode>
);
