/** Signal Run – forward scroll: entities at world z, no falling. Spawn at roadOffset + SPAWN_Z. */

import type { GameState, RunnerLaneEntity, TileKind } from './state';
import { LANES, ROAD_SPEED, SPAWN_Z } from './state';

const TILE_KINDS: TileKind[] = ['beat', 'vocal', 'fx', 'sample'];
const SPAWN_INTERVAL_MS = 600;
/** Remove entity when it has passed player by this much (world z). */
const PASSED_MARGIN = 5;

export function updateRunner(
  state: GameState,
  now: number,
  lastSpawn: number
): {
  runnerEntities: RunnerLaneEntity[];
  entityIdNext: number;
  lastSpawn: number;
} {
  const { runnerEntities, entityIdNext, roadOffset } = state;
  let nextId = entityIdNext;
  let last = lastSpawn;

  const next: RunnerLaneEntity[] = [];
  for (const e of runnerEntities) {
    if (e.z < roadOffset - PASSED_MARGIN) continue;
    next.push(e);
  }

  if (state.phase === 'playing' && state.segment === 'runner' && now - last >= SPAWN_INTERVAL_MS) {
    last = now;
    const lane = Math.floor(Math.random() * LANES);
    const roll = Math.random();
    const spawnZ = roadOffset + SPAWN_Z;
    if (roll < 0.5) {
      const kind = TILE_KINDS[Math.floor(Math.random() * TILE_KINDS.length)];
      next.push({ id: nextId++, lane, z: spawnZ, type: 'tile', tileKind: kind });
    } else if (roll < 0.8) {
      next.push({ id: nextId++, lane, z: spawnZ, type: 'obstacle' });
    } else {
      next.push({ id: nextId++, lane, z: spawnZ, type: 'portal' });
    }
  }

  return {
    runnerEntities: next,
    entityIdNext: nextId,
    lastSpawn: last,
  };
}
