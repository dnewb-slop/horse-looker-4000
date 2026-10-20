// @ts-check
// Bootstrap: size the canvas to the window and draw the (still empty) pasture.

const PASTURE_GREEN = '#5f8f3e';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('pasture'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** Match the backing store to the CSS size so pixel art stays crisp on high-DPI screens. */
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  ctx.imageSmoothingEnabled = false;
  render();
}

function render() {
  ctx.fillStyle = PASTURE_GREEN;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();
