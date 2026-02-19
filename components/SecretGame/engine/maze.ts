/** Signal Run – maze segment (Pac-Man style grid) */

import type { MazeState, MazeCell } from './state';

const W = 9;
const H = 7;

function buildGrid(): MazeCell[][] {
  const grid: MazeCell[][] = [];
  for (let y = 0; y < H; y++) {
    const row: MazeCell[] = [];
    for (let x = 0; x < W; x++) {
      const wall =
        y === 0 ||
        y === H - 1 ||
        x === 0 ||
        x === W - 1 ||
        (y === 2 && x !== 1 && x !== 4 && x !== 7) ||
        (y === 4 && x !== 1 && x !== 4 && x !== 7);
      row.push({
        x,
        y,
        walkable: !wall,
        pellet: !wall,
        powerPellet: !wall && y === 3 && (x === 2 || x === 6),
      });
    }
    grid.push(row);
  }
  return grid;
}

export function createMaze(): MazeState {
  const grid = buildGrid();
  return {
    grid,
    playerX: 1,
    playerY: 1,
    chaserX: W - 2,
    chaserY: H - 2,
    exitX: W - 2,
    exitY: 1,
    width: W,
    height: H,
  };
}

export function moveInMaze(
  maze: MazeState,
  dx: number,
  dy: number
): MazeState {
  const nx = Math.max(0, Math.min(maze.width - 1, maze.playerX + dx));
  const ny = Math.max(0, Math.min(maze.height - 1, maze.playerY + dy));
  const cell = maze.grid[ny]?.[nx];
  if (!cell?.walkable) return maze;
  const grid = maze.grid.map((row, cy) =>
    row.map((c, cx) => {
      if (cy === ny && cx === nx) return { ...c, pellet: false, powerPellet: false };
      return c;
    })
  );
  return {
    ...maze,
    grid,
    playerX: nx,
    playerY: ny,
  };
}

export function updateMazeChaser(maze: MazeState): MazeState {
  let cx = maze.chaserX;
  let cy = maze.chaserY;
  const dx = Math.sign(maze.playerX - cx);
  const dy = Math.sign(maze.playerY - cy);
  const nextX = cx + dx;
  const nextY = cy + dy;
  const cell = maze.grid[nextY]?.[nextX];
  if (cell?.walkable) {
    cx = nextX;
    cy = nextY;
  } else {
    const altX = cx + dx;
    const altY = cy + dy;
    if (maze.grid[cy]?.[altX]?.walkable) cx = altX;
    else if (maze.grid[altY]?.[cx]?.walkable) cy = altY;
  }
  return { ...maze, chaserX: cx, chaserY: cy };
}

export function mazePlayerExited(maze: MazeState): boolean {
  return maze.playerX === maze.exitX && maze.playerY === maze.exitY;
}

export function mazeChaserHit(maze: MazeState): boolean {
  return maze.playerX === maze.chaserX && maze.playerY === maze.chaserY;
}
