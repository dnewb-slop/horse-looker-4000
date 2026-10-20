// @ts-check
// Every tunable number from docs/IMPLEMENTATION_PLAN.md lives here. Values marked (tune) in the
// plan are starting points to adjust after playtesting.

/** Logic update rate. Rendering may run faster or slower; rules never depend on it. */
export const TICK_HZ = 60;

/** The pasture, in world units. */
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 2500;

/**
 * Deepest zoom, as a multiple of the zoom that fits the whole pasture on screen. (tune)
 * 64 makes a horse a ~5 px dot at ×1 and ~40% of an 800 px tall view at the maximum, so the
 * 15–30% look threshold is reachable.
 */
export const MAX_ZOOM_FACTOR = 64;

/** How fast zoom eases toward its target, per second. Higher is snappier. (tune) */
export const ZOOM_EASE_RATE = 12;

/**
 * Zoom change per normalized wheel pixel: target *= exp(-deltaY * k). (tune)
 * Set so the full ×1–×64 range takes about the same scrolling as the earlier ×1–×24 did.
 */
export const WHEEL_ZOOM_SPEED = 0.002;

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

/** A horse's size in world units. Every creature's sprite box is this size. */
export const HORSE_WIDTH = 24;
export const HORSE_HEIGHT = 16;

/** Scenery sizes in world units. (tune) */
export const BARN_WIDTH = 120; // about 5 horses
export const BARN_HEIGHT = 80;
export const OAK_WIDTH = 96; // about 4 horses wide, 3.5 tall
export const OAK_HEIGHT = 56;
export const DATACENTER_WIDTH = 240; // about 10 horses: at least twice a barn
export const DATACENTER_HEIGHT = 70;

/**
 * Sprite tiers are chosen by how tall a horse is on screen, in CSS pixels. (tune)
 * Below DOT_MAX_PX animals are drawn as colored blobs.
 */
export const DOT_MAX_PX = 8;
export const FAR_MAX_PX = 32;
export const MID_MAX_PX = 128;
