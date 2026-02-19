/** Signal Run – main loop: runner (tiles/obstacles/portals), chasers, collision, maze. Per docs/SIGNAL_RUN_VERIFY. */

import type { GameState, TileKind, AbilityId } from './state';
import {
  createInitialState,
  LANES,
  BEAT_INTERVAL_MS,
  BEAT_WINDOW_MS,
  PORTAL_INTERVAL_MS,
  MAZE_DURATION_MS,
  ABILITY_COOLDOWN_MS,
  ROAD_SPEED,
  CHASE_DISTANCE_MAX,
  CHASE_DECAY_PER_MS,
  CHASE_STUN_RESTORE,
} from './state';
import type { InputAction } from './input';
import { loadBestScore, saveBestScore, loadStats, saveStats } from './persistence';
import { addScore as calcScore, tickBeat, isInBeatWindow } from './scoring';
import {
  addToInventory,
  findMatch3,
  removeMatch3,
  MATCH_EFFECT,
  MATCH_SCORE,
} from './match3';
import { updateRunner } from './runner';
import {
  updateChasers,
  maybeSpawnChaser,
  checkRunnerCollision,
} from './enemies';
import {
  createMaze,
  moveInMaze,
  updateMazeChaser,
  mazePlayerExited,
  mazeChaserHit,
} from './maze';

let lastRunnerSpawn = 0;
let lastChaserSpawn = 0;
let runStartTime = 0;

function applyInput(state: GameState, action: InputAction, now: number): GameState {
  if (state.phase === 'start') {
    if (action.type === 'confirm') return { ...state, phase: 'playing' };
    return state;
  }
  if (state.phase === 'paused') {
    if (action.type === 'pause' || action.type === 'confirm') return { ...state, phase: 'playing' };
    return state;
  }
  if (state.phase === 'ended') return state;

  if (action.type === 'pause') return { ...state, phase: 'paused' };

  if (state.segment === 'runner') {
    if (action.type === 'lane_left') {
      return {
        ...state,
        playerLane: Math.max(0, state.playerLane - 1),
        lastLaneSwitchAt: now,
      };
    }
    if (action.type === 'lane_right') {
      return {
        ...state,
        playerLane: Math.min(LANES - 1, state.playerLane + 1),
        lastLaneSwitchAt: now,
      };
    }
  }

  if (state.segment === 'maze' && state.maze) {
    if (action.type === 'move_left') return { ...state, maze: moveInMaze(state.maze, -1, 0) };
    if (action.type === 'move_right') return { ...state, maze: moveInMaze(state.maze, 1, 0) };
    if (action.type === 'move_up') return { ...state, maze: moveInMaze(state.maze, 0, -1) };
    if (action.type === 'move_down') return { ...state, maze: moveInMaze(state.maze, 0, 1) };
  }

  if (action.type === 'ability') {
    const id = action.id as AbilityId;
    const ab = state.abilities[id];
    if (ab.cooldownUntil > now || state.energy < ab.energyCost) return state;
    return {
      ...state,
      energy: Math.max(0, state.energy - ab.energyCost),
      abilities: {
        ...state.abilities,
        [id]: { ...ab, cooldownUntil: now + ABILITY_COOLDOWN_MS[id] },
      },
    };
  }

  return state;
}

function applyMatchEffect(state: GameState, kind: TileKind): GameState {
  const effect = MATCH_EFFECT[kind];
  let next: GameState = {
    ...state,
    inventory: removeMatch3(state.inventory, kind),
    score: state.score + MATCH_SCORE[kind] * state.multiplier,
  };
  if (effect === 'boost_multiplier') next = { ...next, multiplier: Math.min(5, next.multiplier + 0.5) };
  if (effect === 'restore_energy') next = { ...next, energy: Math.min(next.energyMax, next.energy + 25) };
  if (effect === 'stun_chaser') {
    const stunUntil = Date.now() + 3000;
    next = {
      ...next,
      chasers: next.chasers.map((c) => ({ ...c, stunnedUntil: stunUntil })),
      chaseDistance: Math.min(CHASE_DISTANCE_MAX, next.chaseDistance + CHASE_STUN_RESTORE),
    };
  }
  return next;
}

function tick(state: GameState, nowMs: number): GameState {
  if (state.phase !== 'playing') return state;

  let next: GameState = { ...state };

  if (runStartTime === 0) runStartTime = nowMs;
  next.runTimeMs = nowMs - runStartTime;

  if (state.segment === 'maze' && state.maze) {
    next = { ...next, maze: updateMazeChaser(next.maze!) };
    if (mazeChaserHit(next.maze!)) {
      next = { ...next, phase: 'ended' };
      if (next.score > next.bestScore) {
        next.bestScore = next.score;
        saveBestScore(next.score);
        const stats = loadStats();
        saveStats({ ...stats, bestScore: next.score, runsCompleted: stats.runsCompleted + 1, totalPlayTimeMs: stats.totalPlayTimeMs + next.runTimeMs });
      }
      return next;
    }
    if (mazePlayerExited(next.maze!)) {
      next = { ...next, segment: 'runner', maze: null, mazeUntilMs: 0 };
    }
    if (next.mazeUntilMs > 0 && nowMs >= next.mazeUntilMs) {
      next = { ...next, segment: 'runner', maze: null, mazeUntilMs: 0 };
    }
    return next;
  }

  const { onBeat, newPhase } = tickBeat(state, nowMs);
  next.beatPhase = newPhase;
  if (onBeat) next.lastBeatAt = nowMs;

  if (state.lastLaneSwitchAt > 0 && nowMs - state.lastLaneSwitchAt <= 150) {
    const windowSize = BEAT_WINDOW_MS / BEAT_INTERVAL_MS;
    if (isInBeatWindow(state.beatPhase, windowSize) || isInBeatWindow(newPhase, windowSize)) {
      next = {
        ...next,
        perfectFlashUntil: nowMs + 600,
        multiplier: Math.min(5, next.multiplier + 0.15),
        lastLaneSwitchAt: 0,
      };
    } else {
      next = { ...next, lastLaneSwitchAt: 0 };
    }
  } else if (state.lastLaneSwitchAt > 0) {
    next = { ...next, lastLaneSwitchAt: 0 };
  }

  if (onBeat) {
    next.energy = Math.min(next.energyMax, next.energy + 2);
  }

  next.roadOffset = next.roadOffset + ROAD_SPEED * 16;
  next.chaseDistance = Math.max(0, next.chaseDistance - CHASE_DECAY_PER_MS * 16);
  if (next.chaseDistance <= 0) {
    next = { ...next, phase: 'ended' };
    if (next.score > next.bestScore) {
      next.bestScore = next.score;
      saveBestScore(next.score);
      const stats = loadStats();
      saveStats({ ...stats, bestScore: next.score, runsCompleted: stats.runsCompleted + 1, totalPlayTimeMs: stats.totalPlayTimeMs + next.runTimeMs });
    }
    return next;
  }

  const runnerResult = updateRunner(next, nowMs, lastRunnerSpawn);
  lastRunnerSpawn = runnerResult.lastSpawn;
  next = {
    ...next,
    runnerEntities: runnerResult.runnerEntities,
    entityIdNext: runnerResult.entityIdNext,
  };

  const chaserResult = updateChasers(next, 16, nowMs);
  next = { ...next, chasers: chaserResult.chasers };
  if (chaserResult.hit) {
    next = { ...next, phase: 'ended' };
    if (next.score > next.bestScore) {
      next.bestScore = next.score;
      saveBestScore(next.score);
      const stats = loadStats();
      saveStats({ ...stats, bestScore: next.score, runsCompleted: stats.runsCompleted + 1, totalPlayTimeMs: stats.totalPlayTimeMs + next.runTimeMs });
    }
    return next;
  }

  const spawnChaserResult = maybeSpawnChaser(next, lastChaserSpawn, nowMs);
  lastChaserSpawn = spawnChaserResult.lastSpawn;
  next = { ...next, chasers: spawnChaserResult.chasers };
  if (spawnChaserResult.spawned) next = { ...next, entityIdNext: next.entityIdNext + 1 };

  const { collected, hitObstacle } = checkRunnerCollision(next.playerLane, next.runnerEntities, next.roadOffset);
  if (hitObstacle) {
    next = { ...next, phase: 'ended' };
    if (next.score > next.bestScore) {
      next.bestScore = next.score;
      saveBestScore(next.score);
      const stats = loadStats();
      saveStats({ ...stats, bestScore: next.score, runsCompleted: stats.runsCompleted + 1, totalPlayTimeMs: stats.totalPlayTimeMs + next.runTimeMs });
    }
    return next;
  }

  const collectedIds = new Set(collected.map((e) => e.id));
  next = { ...next, runnerEntities: next.runnerEntities.filter((e) => !collectedIds.has(e.id)) };

  const portalHit = collected.find((e) => e.type === 'portal');
  if (portalHit) {
    next = { ...next, segment: 'maze', maze: createMaze(), mazeUntilMs: nowMs + MAZE_DURATION_MS };
    return next;
  }

  for (const e of collected) {
    if (e.type === 'tile' && e.tileKind) {
      next = { ...next, inventory: addToInventory(next.inventory, e.tileKind) };
      const pts = e.tileKind === 'beat' ? 10 : e.tileKind === 'vocal' ? 15 : e.tileKind === 'fx' ? 20 : 25;
      const inWindow = isInBeatWindow(next.beatPhase, BEAT_WINDOW_MS / BEAT_INTERVAL_MS);
      next = { ...next, score: next.score + calcScore(next, pts, inWindow) };
    }
  }

  const match = findMatch3(next.inventory);
  if (match) next = applyMatchEffect(next, match);

  return next;
}

export type GameLoopState = GameState;

export interface GameLoopCallbacks {
  onStateChange: (state: GameState) => void;
  onFrame?: (state: GameState) => void;
}

let rafId = 0;

export function createGameLoop(callbacks: GameLoopCallbacks): {
  start: () => void;
  stop: () => void;
  reset: () => void;
  dispatch: (action: InputAction) => void;
  getState: () => GameState;
} {
  let state: GameState = createInitialState(loadBestScore());
  callbacks.onStateChange(state);

  function dispatch(action: InputAction) {
    state = applyInput(state, action, Date.now());
    callbacks.onStateChange(state);
  }

  function getState() {
    return state;
  }

  function loop(nowMs: number) {
    state = tick(state, nowMs);
    callbacks.onStateChange(state);
    callbacks.onFrame?.(state);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    runStartTime = 0;
    lastRunnerSpawn = 0;
    lastChaserSpawn = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function reset() {
    state = createInitialState(loadBestScore());
    runStartTime = 0;
    lastRunnerSpawn = 0;
    lastChaserSpawn = 0;
    callbacks.onStateChange(state);
  }

  return { start, stop, reset, dispatch, getState };
}
