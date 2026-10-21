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

/**
 * Scenery on each level, in level order. (tune)
 * Levels 2 and 3 are busier: more barns and live oaks to hide behind.
 * @type {{barns: number, oaks: number, datacenters: number}[]}
 */
export const SCENERY_PER_LEVEL = [
  { barns: 3, oaks: 6, datacenters: 1 },
  { barns: 5, oaks: 12, datacenters: 1 },
  { barns: 5, oaks: 12, datacenters: 1 },
];

/** Closest two animals may spawn, center to center, in world units. (tune) */
export const ANIMAL_MIN_SPACING = 36;

/**
 * How far feet stay below their own hill's crest while grazing, and how far scenery stays above
 * the next hill's crest so it is never in a valley, in world units.
 */
export const SLOPE_MARGIN_TOP = 4;
export const SLOPE_MARGIN_BOTTOM = 2;

/** Closest two neighboring ridges may come at any x, in world units. (tune) */
export const MIN_RIDGE_GAP = 150;

/**
 * Depth of the hidden valley behind each crest, in world units: about 1.5 horse-heights, so an
 * animal at the bottom is fully out of sight. (tune)
 */
export const VALLEY_DEPTH = 24;

/** Chance that a grazing animal's next walk heads over a ridge instead. (tune) */
export const CROSS_CHANCE = 0.2;

/** How far past the crest a crossing walks onto the new slope, in world units. (tune) */
export const CROSS_OVERSHOOT = 10;

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

/** Walking swaps between two frames this many times a second. (tune) */
export const WALK_FRAME_RATE = 4;

/** Chance that an animal stopping for a rest puts its head down to graze. (tune) */
export const GRAZE_CHANCE = 0.7;

/** A grazing animal lifts its head this many seconds before it walks off. (tune) */
export const GRAZE_LOOK_UP_S = 1;

/**
 * The earliest a look can start: as soon as an animal is drawn with its Mid sprite, the tier
 * where look-alike telltales first show, so the player has to judge it quickly. (tune)
 */
export const LOOK_MIN_PX = FAR_MAX_PX;

/**
 * Each animal needs its own amount of zoom before its look starts: from LOOK_MIN_PX up to this
 * much more (0.2 = 20% more zoom), spread evenly across animals. (tune)
 */
export const LOOK_ZOOM_SPREAD = 0.2;

/**
 * Seconds an animal reacts to being looked at: it stops where it is, says its line in a speech
 * bubble, and a horse rears up for the first REAR_S of it. (tune)
 */
export const REACTION_S = 2.5;
export const REAR_S = 1;

/**
 * A looked-at horse suit's front man waits UNMASK_DELAY_S, then holds the horse head off his own
 * for UNMASK_S before putting it back on for the rest of the reaction. (tune)
 */
export const UNMASK_DELAY_S = 0.3;
export const UNMASK_S = 1.6;

/**
 * A looked-at robot horse fires red lasers from its eye at the grass in front of it for the first
 * LASER_S of its reaction; the fire they start burns until the reaction ends. (tune)
 */
export const LASER_S = 0.8;
/** How far in front of the robot horse's feet the lasers hit, in world units. (tune) */
export const LASER_REACH = 20;
/** The fire's size in world units. (tune) */
export const FIRE_WIDTH = 7;
export const FIRE_HEIGHT = 7;

/** Seconds of qualifying view to fill a look meter, and how much faster it drains. (tune) */
export const LOOK_FILL_S = 0.5;
export const LOOK_DRAIN_MULTIPLIER = 2;

/** Horses to look at to finish a level, and levels to win. Rules from DESIGN.md. */
export const HORSES_PER_LEVEL = 5;
export const LEVEL_COUNT = 3;

/** Non-horses that end the game. Rule from DESIGN.md. */
export const MAX_STRIKES = 3;

/**
 * Seconds between the last allowed imposter and the lose screen. The pasture drains of color
 * meanwhile and no more looks count. (tune)
 */
export const LOSE_PAUSE_S = 2;

/** Seconds the "Level n complete" card shows before the next level. (tune) */
export const LEVEL_CARD_S = 2.5;

/** Opening sequence: seconds each line fades in (and out). (tune) */
export const INTRO_FADE_S = 0.6;

/**
 * Seconds each opening line holds between its fades, in order. (tune)
 * The first is a quick setup; the joke needs time to land in the other two.
 */
export const INTRO_HOLDS_S = [1.2, 3.2, 3];

/** Seconds one level's music takes to crossfade into the next. (tune) */
export const MUSIC_CROSSFADE_S = 2;

/** Music volume at full fade, from 0 to 1. Calm background, not the main event. (tune) */
export const MUSIC_VOLUME = 0.6;

/**
 * Grass around each live oak: how many tufts, how far they spread from the trunk sideways and
 * up or down the slope, and how tall they are, in world units. Taller than the open pasture's
 * 5-unit tufts, so the patches show from farther out. (tune)
 */
export const OAK_GRASS_TUFTS = 100;
export const OAK_GRASS_SPREAD_X = 64;
export const OAK_GRASS_SPREAD_Y = 14;
export const OAK_GRASS_HEIGHT = 8;
