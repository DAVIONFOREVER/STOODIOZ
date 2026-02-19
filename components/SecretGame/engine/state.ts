/** Signal Run – game state. Forward scroll (roadOffset); entities use z (distance ahead). */

export type Segment = 'runner' | 'maze';

export type TileKind = 'beat' | 'vocal' | 'fx' | 'sample';

export type AbilityId = 'drop' | 'vocal' | 'mix' | 'master';

/** Lane entity: z = distance ahead in world. Spawn at SPAWN_Z; moves toward player as road scrolls. */
export interface RunnerLaneEntity {
  id: number;
  lane: number;
  z: number;
  type: 'tile' | 'obstacle' | 'portal';
  tileKind?: TileKind;
}

/** Chaser: z = distance ahead; collision when z in hit zone and same lane. */
export interface Chaser {
  id: number;
  lane: number;
  z: number;
  stunnedUntil: number;
}

export interface MazeCell {
  x: number;
  y: number;
  walkable: boolean;
  pellet?: boolean;
  powerPellet?: boolean;
}

export interface MazeState {
  grid: MazeCell[][];
  playerX: number;
  playerY: number;
  chaserX: number;
  chaserY: number;
  exitX: number;
  exitY: number;
  width: number;
  height: number;
}

export interface GameState {
  phase: 'start' | 'playing' | 'paused' | 'ended';
  segment: Segment;
  roadOffset: number;
  playerLane: number;
  runnerEntities: RunnerLaneEntity[];
  chasers: Chaser[];
  chaseDistance: number;
  inventory: Record<TileKind, number>;
  beatPhase: number;
  lastBeatAt: number;
  score: number;
  multiplier: number;
  energy: number;
  energyMax: number;
  runTimeMs: number;
  maze: MazeState | null;
  mazeUntilMs: number;
  abilities: Record<AbilityId, { cooldownUntil: number; energyCost: number }>;
  bestScore: number;
  entityIdNext: number;
  perfectFlashUntil: number;
  lastLaneSwitchAt: number;
}

export const BEAT_INTERVAL_MS = 600;
export const BEAT_WINDOW_MS = 120;
export const LANES = 3;
export const ENERGY_MAX = 100;
export const PORTAL_INTERVAL_MS = 12000;
export const MAZE_DURATION_MS = 5000;

/** World units per ms; roadOffset increases each tick. */
export const ROAD_SPEED = 0.5;
/** Spawn runner entities (tiles/obstacles/portals) at this z (far ahead). */
export const SPAWN_Z = 120;
/** Spawn chasers at this z. */
export const CHASER_SPAWN_Z = 100;
/** Chase bar 0–100; run ends when 0 or chaser collision. */
export const CHASE_DISTANCE_MAX = 100;
export const CHASE_DECAY_PER_MS = 0.03;
/** VOCAL stun adds this much to chaseDistance. */
export const CHASE_STUN_RESTORE = 30;
/** Entity at player when relative z in [0, HIT_ZONE_Z]. */
export const HIT_ZONE_Z = 18;

export const ABILITY_ENERGY: Record<AbilityId, number> = {
  drop: 15,
  vocal: 20,
  mix: 25,
  master: 40,
};

export const ABILITY_COOLDOWN_MS: Record<AbilityId, number> = {
  drop: 3000,
  vocal: 5000,
  mix: 6000,
  master: 12000,
};

export function createInitialState(bestScore: number): GameState {
  const now = Date.now();
  return {
    phase: 'start',
    segment: 'runner',
    roadOffset: 0,
    playerLane: 1,
    runnerEntities: [],
    chasers: [],
    chaseDistance: CHASE_DISTANCE_MAX,
    inventory: { beat: 0, vocal: 0, fx: 0, sample: 0 },
    beatPhase: 0,
    lastBeatAt: now,
    score: 0,
    multiplier: 1,
    energy: 50,
    energyMax: ENERGY_MAX,
    runTimeMs: 0,
    maze: null,
    mazeUntilMs: 0,
    abilities: {
      drop: { cooldownUntil: 0, energyCost: ABILITY_ENERGY.drop },
      vocal: { cooldownUntil: 0, energyCost: ABILITY_ENERGY.vocal },
      mix: { cooldownUntil: 0, energyCost: ABILITY_ENERGY.mix },
      master: { cooldownUntil: 0, energyCost: ABILITY_ENERGY.master },
    },
    bestScore,
    entityIdNext: 1,
    perfectFlashUntil: 0,
    lastLaneSwitchAt: 0,
  };
}
