import {
  ViewWidth,
  getViewHeightByViewportHeight,
  getViewWidthByViewportWidth
} from "@vkontakte/vkui";

export function transformVKBridgeAdaptivity(adaptivity) {
  if (!adaptivity) {
    return {};
  }

  const { type, viewportWidth, viewportHeight } = adaptivity;

  switch (type) {
    case "adaptive":
      return {
        viewWidth: getViewWidthByViewportWidth(viewportWidth),
        viewHeight: getViewHeightByViewportHeight(viewportHeight)
      };
    case "force_mobile":
      return {
        viewWidth: ViewWidth.MOBILE,
        sizeX: "compact",
        sizeY: "regular"
      };
    case "force_mobile_compact":
      return {
        viewWidth: ViewWidth.MOBILE,
        sizeX: "compact",
        sizeY: "compact"
      };
    default:
      return {};
  }
}
