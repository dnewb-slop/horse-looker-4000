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
 * look threshold is reachable.
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

/** Scenery per level. (tune) */
export const BARN_COUNT = 3;
export const OAK_COUNT = 6;
export const DATACENTER_COUNT = 1;

/**
 * Horses spawned until milestone 5 brings the level table: all three breeds, no look-alikes.
 */
export const SANDBOX_HORSE_COUNT = 30;

/** Closest two animals may spawn, center to center, in world units. (tune) */
export const ANIMAL_MIN_SPACING = 36;

/**
 * How far an animal's feet stay from the ridge above (its own hill's crest) and below (the next
 * hill's crest, which would hide it), in world units. Keeps every animal fully visible until
 * milestone 7 adds valleys.
 */
export const SLOPE_MARGIN_TOP = 4;
export const SLOPE_MARGIN_BOTTOM = 2;

/**
 * Depth of the ground strip at a scenery object's base that animals don't walk through, in world
 * units. Animals pass behind scenery (further up the slope) or in front of it, never through it.
 */
export const SCENERY_FOOTPRINT_DEPTH = 10;

/** Grazing: seconds an animal stands still between walks. (tune) */
export const GRAZE_IDLE_MIN_S = 2;
export const GRAZE_IDLE_MAX_S = 7;

/** Grazing: how far one walk goes, in world units, and how fast. (tune) */
export const GRAZE_WALK_MIN = 10;
export const GRAZE_WALK_MAX = 60;
export const GRAZE_WALK_SPEED = 8;

/** Walks are mostly sideways: up-or-down-slope movement is scaled by this. (tune) */
export const GRAZE_DEPTH_SCALE = 0.4;

/**
 * Look threshold: how tall an animal must be on screen, as a fraction of the viewport height.
 * Each animal draws its own from a triangular distribution with this range and peak. (tune)
 */
export const LOOK_THRESHOLD_MIN = 0.08;
export const LOOK_THRESHOLD_PEAK = 0.1;
export const LOOK_THRESHOLD_MAX = 0.15;

/** Seconds of qualifying view to fill a look meter, and how much faster it drains. (tune) */
export const LOOK_FILL_S = 0.5;
export const LOOK_DRAIN_MULTIPLIER = 2;

/** Horses to look at to finish a level, and levels to win. Rules from DESIGN.md. */
export const HORSES_PER_LEVEL = 10;
export const LEVEL_COUNT = 3;

/** Non-horses that end the game. Rule from DESIGN.md. */
export const MAX_STRIKES = 5;
