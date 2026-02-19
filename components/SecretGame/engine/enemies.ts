/** Signal Run – chaser AI (z-space) and runner collision (z band + lane) */

import type { GameState, Chaser, RunnerLaneEntity } from './state';
import { LANES, CHASER_SPAWN_Z, HIT_ZONE_Z } from './state';

/** World units per ms; chaser closes faster than road. */
const CHASER_SPEED = 0.6;
const CHASER_SPAWN_INTERVAL_MS = 8000;

export function updateChasers(
  state: GameState,
  dt: number,
  now: number
): { chasers: Chaser[]; hit: boolean } {
  let hit = false;
  const chasers: Chaser[] = [];
  const { roadOffset, playerLane } = state;
  for (const c of state.chasers) {
    if (c.stunnedUntil > now) {
      chasers.push(c);
      continue;
    }
    const newZ = c.z - CHASER_SPEED * (1 + state.runTimeMs / 20000) * (dt / 16);
    if (newZ < roadOffset - 5) continue;
    let lane = c.lane;
    const inRange = newZ >= roadOffset && newZ <= roadOffset + HIT_ZONE_Z;
    if (inRange) {
      const dl = playerLane - lane;
      if (Math.abs(dl) <= 0.5) hit = true;
      if (dl > 0) lane = Math.min(LANES - 1, lane + 0.02);
      else if (dl < 0) lane = Math.max(0, lane - 0.02);
    }
    chasers.push({ ...c, z: newZ, lane });
  }
  return { chasers, hit };
}

export function maybeSpawnChaser(
  state: GameState,
  lastChaserSpawn: number,
  now: number
): { chasers: Chaser[]; lastSpawn: number; spawned: boolean } {
  let lastSpawn = lastChaserSpawn;
  const interval = Math.max(4000, CHASER_SPAWN_INTERVAL_MS - state.runTimeMs / 10);
  if (now - lastSpawn < interval) return { chasers: state.chasers, lastSpawn, spawned: false };
  lastSpawn = now;
  const lane = Math.floor(Math.random() * LANES);
  const spawnZ = state.roadOffset + CHASER_SPAWN_Z;
  const chasers = [
    ...state.chasers,
    { id: state.entityIdNext, lane, z: spawnZ, stunnedUntil: 0 },
  ];
  return { chasers, lastSpawn, spawned: true };
}

/** Collision: same lane and entity.z in [roadOffset, roadOffset + HIT_ZONE_Z]. */
export function checkRunnerCollision(
  playerLane: number,
  entities: RunnerLaneEntity[],
  roadOffset: number
): { collected: RunnerLaneEntity[]; hitObstacle: boolean } {
  const collected: RunnerLaneEntity[] = [];
  let hitObstacle = false;
  for (const e of entities) {
    const inZone = e.z >= roadOffset && e.z <= roadOffset + HIT_ZONE_Z;
    const sameLane = Math.abs(e.lane - playerLane) < 0.5;
    if (inZone && sameLane) {
      if (e.type === 'obstacle') hitObstacle = true;
      else collected.push(e);
    }
  }
  return { collected, hitObstacle };
}
