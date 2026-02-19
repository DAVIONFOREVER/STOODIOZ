/** Signal Run – inventory and 3-of-a-kind matching (counts) */

import type { TileKind } from './state';

const MAX_PER_KIND = 9;

export function addToInventory(
  inventory: Record<TileKind, number>,
  kind: TileKind
): Record<TileKind, number> {
  const count = inventory[kind] ?? 0;
  if (count >= MAX_PER_KIND) return inventory;
  return { ...inventory, [kind]: count + 1 };
}

export function findMatch3(inventory: Record<TileKind, number>): TileKind | null {
  if ((inventory.beat ?? 0) >= 3) return 'beat';
  if ((inventory.vocal ?? 0) >= 3) return 'vocal';
  if ((inventory.fx ?? 0) >= 3) return 'fx';
  if ((inventory.sample ?? 0) >= 3) return 'sample';
  return null;
}

export function removeMatch3(
  inventory: Record<TileKind, number>,
  kind: TileKind
): Record<TileKind, number> {
  const count = Math.max(0, (inventory[kind] ?? 0) - 3);
  return { ...inventory, [kind]: count };
}

export type MatchEffect =
  | 'clear_blockers'
  | 'stun_chaser'
  | 'boost_multiplier'
  | 'restore_energy';

export const MATCH_EFFECT: Record<TileKind, MatchEffect> = {
  beat: 'boost_multiplier',
  vocal: 'stun_chaser',
  fx: 'clear_blockers',
  sample: 'restore_energy',
};

export const MATCH_SCORE: Record<TileKind, number> = {
  beat: 50,
  vocal: 60,
  fx: 70,
  sample: 80,
};
