// @ts-check
// HTML overlays drawn over the canvas. For now: the camera-style zoom readout.

/**
 * Format a zoom factor like a camera display: "×1.0", "×4.5", "×24".
 * @param {number} factor
 */
export function formatZoom(factor) {
  const tenths = Math.round(factor * 10) / 10;
  return tenths < 10 ? `×${tenths.toFixed(1)}` : `×${Math.round(factor)}`;
}

/**
 * @param {HTMLElement} el
 */
export function createZoomReadout(el) {
  let shown = '';
  return {
    /** @param {number} factor */
    update(factor) {
      const text = formatZoom(factor);
      if (text !== shown) el.textContent = shown = text;
    },
  };
}
