/** Signal Run – score, multiplier, energy, beat timing */

import type { GameState } from './state';
import { BEAT_INTERVAL_MS } from './state';

export function addScore(state: GameState, basePoints: number, onBeat: boolean): number {
  const mult = onBeat ? state.multiplier * 1.2 : state.multiplier;
  return Math.floor(basePoints * mult);
}

export function tickBeat(state: GameState, now: number): { onBeat: boolean; newPhase: number } {
  const elapsed = now - state.lastBeatAt;
  const phase = (elapsed % BEAT_INTERVAL_MS) / BEAT_INTERVAL_MS;
  const onBeat = state.beatPhase < 0.25 && phase >= 0.25;
  return { onBeat, newPhase: phase };
}

export function isInBeatWindow(phase: number, windowSize: number): boolean {
  return phase < windowSize || phase > 1 - windowSize;
}
