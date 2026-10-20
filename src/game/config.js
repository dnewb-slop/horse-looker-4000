// @ts-check
// Every tunable number from docs/IMPLEMENTATION_PLAN.md lives here. Values marked (tune) in the
// plan are starting points to adjust after playtesting.

/** Logic update rate. Rendering may run faster or slower; rules never depend on it. */
export const TICK_HZ = 60;

/** The pasture, in world units. */
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 2500;

/** Deepest zoom, as a multiple of the zoom that fits the whole pasture on screen. (tune) */
export const MAX_ZOOM_FACTOR = 24;

/** How fast zoom eases toward its target, per second. Higher is snappier. (tune) */
export const ZOOM_EASE_RATE = 12;

/** Zoom change per normalized wheel pixel: target *= exp(-deltaY * k). (tune) */
export const WHEEL_ZOOM_SPEED = 0.0015;

/** Largest wheel delta honored from one event, so a fast flick can't jump the whole range. */
export const MAX_WHEEL_DELTA = 240;

/** Pixels per wheel "line" and the fallback page size, for mice that report lines or pages. */
export const WHEEL_LINE_PX = 16;
export const WHEEL_PAGE_PX = 800;

/** Rolling hills: how many bands from back (top) to front (bottom). (tune) */
export const HILL_COUNT = 7;

/** Size of each hill's waviness, in world units. (tune) */
export const HILL_AMPLITUDE_MIN = 40;
export const HILL_AMPLITUDE_MAX = 140;
