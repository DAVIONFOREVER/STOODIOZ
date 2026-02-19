/** Signal Run – forward scroll visuals; no ctx.arc for gameplay entities (player, chasers, portals, tiles, obstacles). */

import type { GameState, RunnerLaneEntity, Chaser, MazeState } from './state';
import { LANES, SPAWN_Z } from './state';

const PLAYER_BOTTOM_PCT = 0.88;
const DIVIDER_PERIOD = 60;
const SPEED_LINE_PERIOD = 35;
const PARALLAX_FACTOR = 0.3;
const GRID_PERIOD = 50;

/** World z to screen y: player at bottom (roadOffset), far at top. relativeZ = entity.z - roadOffset. */
function worldToScreenY(relativeZ: number, height: number): number {
  const t = 1 - relativeZ / SPAWN_Z;
  return height * (0.15 + 0.75 * t);
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number
): void {
  ctx.fillStyle = '#07080B';
  ctx.fillRect(0, 0, width, height);

  if (state.segment === 'maze' && state.maze) {
    renderMaze(ctx, state.maze, width, height);
    return;
  }

  const { roadOffset } = state;
  const laneW = width / LANES;
  const scale = Math.min(laneW, height * 0.06) * 0.5;

  // --- Parallax grid: scroll DOWN (road moves backward = you run forward) ---
  const gridOffset = (roadOffset * PARALLAX_FACTOR) % GRID_PERIOD;
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let y = gridOffset - GRID_PERIOD * 2; y < height + GRID_PERIOD; y += GRID_PERIOD) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let x = 0; x < width + GRID_PERIOD; x += GRID_PERIOD) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // --- Lane dividers: scroll DOWN (road rushing backward under you) ---
  const divOffset = roadOffset % DIVIDER_PERIOD;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  for (let i = 1; i < LANES; i++) {
    const x = i * laneW;
    for (let y = divOffset - DIVIDER_PERIOD * 3; y < height + DIVIDER_PERIOD; y += DIVIDER_PERIOD) {
      const segLen = Math.min(28, DIVIDER_PERIOD);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + segLen);
      ctx.stroke();
    }
  }

  // --- Speed lines: scroll DOWN ---
  const lineOffset = roadOffset % SPEED_LINE_PERIOD;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < LANES; i++) {
    const cx = (i + 0.5) * laneW;
    for (let y = lineOffset - SPEED_LINE_PERIOD * 2; y < height + SPEED_LINE_PERIOD; y += SPEED_LINE_PERIOD) {
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + 6, y + 14);
      ctx.stroke();
    }
  }

  // --- Runner entities (z -> screenY); NO ctx.arc for entities ---
  for (const e of state.runnerEntities) {
    const relativeZ = e.z - roadOffset;
    if (relativeZ < -10 || relativeZ > SPAWN_Z + 10) continue;
    const x = (e.lane + 0.5) * laneW;
    const y = worldToScreenY(relativeZ, height);
    if (e.type === 'obstacle') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(x - scale, y - scale, scale * 2, scale * 2);
    } else if (e.type === 'portal') {
      drawPortalGate(ctx, x, y, scale);
    } else {
      drawDiamond(ctx, x, y, scale, tileColor(e.tileKind ?? 'beat'));
    }
  }

  // --- Chasers: triangle/chevron (NO circles) ---
  for (const c of state.chasers) {
    const relativeZ = c.z - roadOffset;
    if (relativeZ < -10 || relativeZ > SPAWN_Z + 10) continue;
    const x = (c.lane + 0.5) * laneW;
    const y = worldToScreenY(relativeZ, height);
    ctx.fillStyle = c.stunnedUntil > Date.now() ? 'rgba(156, 163, 175, 0.7)' : 'rgba(239, 68, 68, 0.9)';
    drawChevron(ctx, x, y, scale * 1.2);
  }

  // --- Player: rounded rectangle (NO circle) ---
  const playerX = (state.playerLane + 0.5) * laneW;
  const playerY = height * PLAYER_BOTTOM_PCT;
  const playerW = laneW * 0.5;
  const playerH = 22;
  const radius = 6;
  ctx.fillStyle = 'rgba(249, 115, 22, 0.95)';
  ctx.strokeStyle = 'rgba(251, 146, 60, 0.9)';
  ctx.lineWidth = 2;
  roundRect(ctx, playerX - playerW / 2, playerY - playerH / 2, playerW, playerH, radius);
  ctx.fill();
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChevron(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(cx + size, cy);
  ctx.lineTo(cx - size * 0.6, cy - size);
  ctx.lineTo(cx - size * 0.6, cy + size);
  ctx.closePath();
  ctx.fill();
}

function drawPortalGate(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const w = size * 1.8;
  const h = size * 1.4;
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
  ctx.lineWidth = Math.max(2, size * 0.25);
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
  ctx.setLineDash([]);
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
}

function tileColor(type: string): string {
  const colors: Record<string, string> = {
    beat: 'rgba(34, 197, 94, 0.95)',
    vocal: 'rgba(59, 130, 246, 0.95)',
    fx: 'rgba(249, 115, 22, 0.95)',
    sample: 'rgba(168, 85, 247, 0.95)',
  };
  return colors[type] ?? 'rgba(255,255,255,0.8)';
}

/** Dev guard: if any runner entity draw used ctx.arc, throw. We do not call arc for player, chasers, portals, tiles, obstacles. */
function assertNoCirclesForEntities(): void {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
    throw new Error('CIRCLES NOT ALLOWED');
  }
}
void assertNoCirclesForEntities;

function renderMaze(ctx: CanvasRenderingContext2D, maze: MazeState, width: number, height: number): void {
  const cellW = width / maze.width;
  const cellH = height / maze.height;
  const pelletR = Math.min(cellW, cellH) * 0.12;
  const powerR = pelletR * 1.8;
  const actorR = Math.min(cellW, cellH) * 0.35;
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = maze.grid[y]?.[x];
      if (!cell) continue;
      const px = x * cellW;
      const py = y * cellH;
      if (!cell.walkable) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.fillRect(px, py, cellW, cellH);
        continue;
      }
      if (cell.pellet) {
        ctx.fillStyle = cell.powerPellet ? 'rgba(251, 191, 36, 0.95)' : 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.arc(px + cellW / 2, py + cellH / 2, cell.powerPellet ? powerR : pelletR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const playerPx = (maze.playerX + 0.5) * cellW;
  const playerPy = (maze.playerY + 0.5) * cellH;
  ctx.fillStyle = 'rgba(249, 115, 22, 0.95)';
  ctx.beginPath();
  ctx.arc(playerPx, playerPy, actorR, 0, Math.PI * 2);
  ctx.fill();
  const chaserPx = (maze.chaserX + 0.5) * cellW;
  const chaserPy = (maze.chaserY + 0.5) * cellH;
  ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
  ctx.beginPath();
  ctx.arc(chaserPx, chaserPy, actorR, 0, Math.PI * 2);
  ctx.fill();
}
