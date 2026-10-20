// @ts-check
// A tiny pixel grid for drawing art in code. Pure: no canvas, so art can be unit-tested.
// Cells hold palette keys; '.' is transparent.

/**
 * @typedef {object} Raster
 * @property {number} width
 * @property {number} height
 * @property {(x: number, y: number) => string} get
 * @property {(x: number, y: number, key: string) => void} set
 * @property {(x0: number, y0: number, x1: number, y1: number, key: string) => void} fillRect
 *   fills [x0, x1) × [y0, y1), clipped to the grid
 * @property {(test: (x: number, y: number) => boolean, key: string) => void} fillWhere
 *   fills every cell whose center (x + 0.5, y + 0.5) passes the test
 * @property {(key: string) => void} outline adds `key` around every filled cell (4-neighbors)
 * @property {() => string[]} rows
 */

/**
 * @param {number} width
 * @param {number} height
 * @returns {Raster}
 */
export function createRaster(width, height) {
  const cells = Array.from({ length: height }, () => Array(width).fill('.'));
  /** @type {Raster} */
  const r = {
    width,
    height,
    get: (x, y) => (x >= 0 && y >= 0 && x < width && y < height ? cells[y][x] : '.'),
    set(x, y, key) {
      if (x >= 0 && y >= 0 && x < width && y < height) cells[y][x] = key;
    },
    fillRect(x0, y0, x1, y1, key) {
      for (let y = Math.max(0, Math.round(y0)); y < Math.min(height, Math.round(y1)); y++) {
        for (let x = Math.max(0, Math.round(x0)); x < Math.min(width, Math.round(x1)); x++) {
          cells[y][x] = key;
        }
      }
    },
    fillWhere(test, key) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) if (test(x + 0.5, y + 0.5)) cells[y][x] = key;
      }
    },
    outline(key) {
      const edge = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (cells[y][x] !== '.') continue;
          const touches = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([dx, dy]) => {
            const v = r.get(x + dx, y + dy);
            return v !== '.' && v !== key;
          });
          if (touches) edge.push([x, y]);
        }
      }
      for (const [x, y] of edge) cells[y][x] = key;
    },
    rows: () => cells.map((row) => row.join('')),
  };
  return r;
}

/**
 * Point-in-polygon test (even-odd rule).
 * @param {number} x
 * @param {number} y
 * @param {[number, number][]} points
 */
export function inPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 */
export function inEllipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
}

/**
 * Deterministic 0–1 noise for dithering art. Not for game rules.
 * @param {number} x
 * @param {number} y
 */
export function noise(x, y) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
