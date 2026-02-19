/** Signal Run – localStorage persistence (reuse existing key for best score) */

export const HIGH_SCORE_KEY = 'stoodioz_secret_game_best';
export const SIGNAL_RUN_STATS_KEY = 'stoodioz_signal_run_stats';

export interface StoredStats {
  bestScore: number;
  runsCompleted: number;
  totalPlayTimeMs: number;
}

export function loadBestScore(): number {
  try {
    const v = localStorage.getItem(HIGH_SCORE_KEY);
    if (v == null) return 0;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // ignore
  }
}

export function loadStats(): StoredStats {
  try {
    const raw = localStorage.getItem(SIGNAL_RUN_STATS_KEY);
    if (!raw) return { bestScore: loadBestScore(), runsCompleted: 0, totalPlayTimeMs: 0 };
    const parsed = JSON.parse(raw) as Partial<StoredStats>;
    return {
      bestScore: Number(parsed.bestScore) || loadBestScore(),
      runsCompleted: Number(parsed.runsCompleted) || 0,
      totalPlayTimeMs: Number(parsed.totalPlayTimeMs) || 0,
    };
  } catch {
    return { bestScore: loadBestScore(), runsCompleted: 0, totalPlayTimeMs: 0 };
  }
}

export function saveStats(stats: StoredStats): void {
  try {
    localStorage.setItem(SIGNAL_RUN_STATS_KEY, JSON.stringify(stats));
    saveBestScore(stats.bestScore);
  } catch {
    // ignore
  }
}
