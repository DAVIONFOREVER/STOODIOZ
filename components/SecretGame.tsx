import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from './icons';
import { createGameLoop } from './SecretGame/engine/loop';
import { createInputHandler, type InputAction } from './SecretGame/engine/input';
import { render } from './SecretGame/engine/render';
import type { GameState, AbilityId, TileKind } from './SecretGame/engine/state';
import { loadStats } from './SecretGame/engine/persistence';
import { findMatch3 } from './SecretGame/engine/match3';

interface SecretGameProps {
  onExit: () => void;
}

const ABILITY_LABELS: Record<AbilityId, string> = {
  drop: 'DROP',
  vocal: 'VOCAL',
  mix: 'MIX',
  master: 'MASTER',
};

const SecretGame: React.FC<SecretGameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const gameLoopRef = useRef<ReturnType<typeof createGameLoop> | null>(null);
  const inputHandlerRef = useRef<ReturnType<typeof createInputHandler> | null>(null);
  const resizeAttachedRef = useRef(false);

  useEffect(() => {
    console.log('[SIGNAL RUN MOUNT]', { file: 'SecretGame.tsx', version: 'forward-scroll' });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const gameLoop = createGameLoop({
      onStateChange: setState,
      onFrame: (s) => {
        const canvas = canvasRef.current;
        const gameArea = gameAreaRef.current;
        if (!canvas || !s) return;
        let w = Math.floor(canvas.width / dpr);
        let h = Math.floor(canvas.height / dpr);
        if (w <= 0 || h <= 0) {
          if (!gameArea) return;
          const rect = gameArea.getBoundingClientRect();
          w = Math.max(1, Math.floor(rect.width));
          h = Math.max(1, Math.floor(rect.height));
          if (w <= 0 || h <= 0) return;
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.save();
        ctx.scale(dpr, dpr);
        render(ctx, s, w, h);
        ctx.restore();
      },
    });
    gameLoopRef.current = gameLoop;

    const inputHandler = createInputHandler(
      (action: InputAction) => gameLoop.dispatch(action),
      () => containerRef.current
    );
    inputHandlerRef.current = inputHandler;

    gameLoop.start();
    inputHandler.bind();

    return () => {
      inputHandler.unbind();
      gameLoop.stop();
      gameLoopRef.current = null;
      inputHandlerRef.current = null;
    };
  }, []);

  const handleAction = useCallback((action: InputAction) => {
    gameLoopRef.current?.dispatch(action);
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const gameArea = gameAreaRef.current;
    if (!canvas || !gameArea) return;
    const rect = gameArea.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    const s = gameLoopRef.current?.getState();
    if (ctx && s) {
      ctx.save();
      ctx.scale(dpr, dpr);
      render(ctx, s, w, h);
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!state) return;
    if (resizeAttachedRef.current) return;
    const gameArea = gameAreaRef.current;
    if (!gameArea || typeof ResizeObserver === 'undefined') return;
    resizeAttachedRef.current = true;
    handleResize();
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(gameArea);
    return () => {
      resizeAttachedRef.current = false;
      ro.disconnect();
    };
  }, [state, handleResize]);

  if (!state) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-zinc-500">Loading Signal Run…</div>
      </div>
    );
  }

  const energyPct = Math.round((state.energy / state.energyMax) * 100);
  const beatHighlight = state.beatPhase < 0.25 || state.beatPhase > 0.75;
  const stats = loadStats();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col overflow-hidden z-[100]"
      data-signal-run
      style={{
        background: 'var(--signal-run-bg, #07080B)',
        color: 'var(--signal-run-text, inherit)',
        ['--signal-run-bg' as string]: '#07080B',
        ['--signal-run-panel' as string]: 'rgba(255,255,255,0.06)',
        ['--signal-run-stroke' as string]: 'rgba(255,255,255,0.10)',
        ['--signal-run-violet' as string]: '#7C5CFF',
        ['--signal-run-cyan' as string]: '#00E5FF',
        ['--signal-run-radius' as string]: '16px',
      }}
    >
      {/* Top HUD */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0 backdrop-blur-sm rounded-b-[var(--signal-run-radius)]"
        style={{ background: 'var(--signal-run-panel)', borderColor: 'var(--signal-run-stroke)' }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => onExit()}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--signal-run-radius)] border-2 transition-colors shrink-0"
            style={{ borderColor: 'var(--signal-run-stroke)' }}
            aria-label="Exit game"
          >
            <CloseIcon className="w-5 h-5 text-slate-300 hover:text-[var(--signal-run-cyan)]" />
            <span className="text-sm font-semibold text-slate-300">Exit</span>
          </button>
          <span className="text-slate-200 font-bold tabular-nums">Score: {state.score}</span>
          <span className="font-bold" style={{ color: 'var(--signal-run-violet)' }}>×{state.multiplier.toFixed(1)}</span>
          <span className="text-slate-400 text-sm">
            Energy: <span className="font-semibold" style={{ color: 'var(--signal-run-cyan)' }}>{energyPct}%</span>
          </span>
          <span className="text-zinc-500 text-sm">
            Best: {state.bestScore}
          </span>
          {state.segment === 'runner' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">CHASE</span>
              <div
                className="w-20 h-2 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700"
                role="progressbar"
                aria-valuenow={state.chaseDistance}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full transition-all duration-150 rounded-full"
                  style={{
                    width: `${Math.max(0, state.chaseDistance)}%`,
                    background: state.chaseDistance > 25 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(239, 68, 68, 0.6)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleAction({ type: 'pause' })}
          className="px-3 py-1.5 rounded-[var(--signal-run-radius)] border text-sm transition-colors"
          style={{ borderColor: 'var(--signal-run-stroke)' }}
        >
          Pause
        </button>
      </div>

      {/* Tile inventory row: 4 slots BEAT / VOCAL / FX / SAMPLE with counts; flash on 3-of-a-kind */}
      <div
        className="flex items-center justify-center gap-4 py-2 px-4 shrink-0 border-b"
        style={{ background: 'var(--signal-run-panel)', borderColor: 'var(--signal-run-stroke)' }}
      >
        {(['beat', 'vocal', 'fx', 'sample'] as TileKind[]).map((kind) => {
          const count = state.inventory[kind] ?? 0;
          const isMatch3 = findMatch3(state.inventory) === kind;
          return (
            <div
              key={kind}
              className={`flex flex-col items-center px-3 py-1.5 rounded-lg border tabular-nums transition-all ${isMatch3 ? 'animate-pulse' : ''}`}
              style={{
                borderColor: isMatch3 ? 'var(--signal-run-cyan)' : 'var(--signal-run-stroke)',
                background: isMatch3 ? 'rgba(0,229,255,0.12)' : 'transparent',
              }}
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-500">{kind}</span>
              <span className="text-sm font-bold text-slate-200">{count}</span>
            </div>
          );
        })}
      </div>

      {/* On-beat PERFECT indicator */}
      {state.phase === 'playing' && beatHighlight && (
        <div
          className="absolute top-14 left-1/2 -translate-x-1/2 z-40 text-lg font-bold animate-pulse pointer-events-none"
          style={{ color: 'var(--signal-run-cyan)' }}
        >
          PERFECT
        </div>
      )}

      {/* Canvas – size from this div so we don't include HUD */}
      <div ref={gameAreaRef} className="flex-1 min-h-0 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Lane controls: visible way to play (tap or use arrow keys) */}
      {state.phase === 'playing' && (
        <div className="shrink-0 flex justify-center gap-8 py-3 px-4" style={{ background: 'var(--signal-run-panel)', borderColor: 'var(--signal-run-stroke)', borderTopWidth: 1 }}>
          <button
            type="button"
            onClick={() => handleAction({ type: 'lane_left' })}
            className="px-8 py-4 rounded-xl border-2 font-bold text-lg transition-colors active:scale-95"
            style={{ borderColor: 'var(--signal-run-stroke)', color: 'var(--signal-run-cyan)' }}
          >
            ← LEFT
          </button>
          <button
            type="button"
            onClick={() => handleAction({ type: 'lane_right' })}
            className="px-8 py-4 rounded-xl border-2 font-bold text-lg transition-colors active:scale-95"
            style={{ borderColor: 'var(--signal-run-stroke)', color: 'var(--signal-run-cyan)' }}
          >
            RIGHT →
          </button>
        </div>
      )}

      {/* Bottom HUD: Beat meter + abilities */}
      <div
        className="shrink-0 px-4 py-3 border-t rounded-t-[var(--signal-run-radius)] backdrop-blur-sm"
        style={{ background: 'var(--signal-run-panel)', borderColor: 'var(--signal-run-stroke)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xs text-slate-500 mr-2">Beat</span>
          <div
            className="w-24 h-2 rounded-full overflow-hidden bg-zinc-800"
            role="progressbar"
            aria-valuenow={state.beatPhase * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${state.beatPhase * 100}%`,
                background: beatHighlight ? 'var(--signal-run-cyan)' : 'rgb(82 82 82)',
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          {(['drop', 'vocal', 'mix', 'master'] as const).map((id) => {
            const ab = state.abilities[id];
            const now = Date.now();
            const onCooldown = ab.cooldownUntil > now;
            const canUse = state.energy >= ab.energyCost && !onCooldown && state.phase === 'playing';
            return (
              <button
                key={id}
                type="button"
                disabled={!canUse}
                onClick={() => handleAction({ type: 'ability', id })}
                className={`px-3 py-2 rounded-[var(--signal-run-radius)] border text-xs font-bold transition-colors ${
                  canUse ? 'cursor-pointer' : 'cursor-not-allowed text-slate-500'
                }`}
                style={{
                  borderColor: canUse ? 'var(--signal-run-violet)' : 'rgb(82 82 82)',
                  color: canUse ? 'var(--signal-run-cyan)' : undefined,
                }}
              >
                {ABILITY_LABELS[id]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start overlay: card only so the game (road/canvas) stays visible behind it */}
      {state.phase === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-zinc-900/95 border-2 border-orange-500/50 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-xl shadow-orange-500/20 ring-2 ring-orange-500/20">
            <h1 className="text-3xl font-bold text-orange-400 mb-1 tracking-tight">Signal Run</h1>
            <p className="text-zinc-400 text-sm mb-4">Collect tiles, match 3, avoid chasers. Road scrolls toward you.</p>
            <p className="text-zinc-500 text-xs mb-6">After Play: tap LEFT / RIGHT below or use ← → keys to change lanes.</p>
            <button
              type="button"
              onClick={() => {
                (document.activeElement as HTMLElement)?.blur?.();
                handleAction({ type: 'confirm' });
              }}
              className="w-full py-4 rounded-xl bg-orange-500 text-white font-bold text-lg hover:bg-orange-600 transition-colors"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="w-full mt-3 py-2 rounded-xl border border-orange-500/40 text-orange-400 text-sm hover:bg-orange-500/10"
            >
              Leaderboard
            </button>
            <button type="button" onClick={onExit} className="w-full mt-2 py-2 text-zinc-500 text-sm hover:text-zinc-300">
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Modal: Paused */}
      {state.phase === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-50">
          <div className="bg-zinc-900/95 border border-orange-500/30 rounded-xl p-8 max-w-sm w-full mx-4 text-center">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Paused</h2>
            <button
              type="button"
              onClick={() => handleAction({ type: 'pause' })}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600"
            >
              Resume
            </button>
            <button type="button" onClick={onExit} className="w-full mt-3 py-2 text-zinc-400 text-sm hover:text-zinc-200">
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Modal: End (Run Complete) */}
      {state.phase === 'ended' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-50">
          <div className="bg-zinc-900/95 border border-orange-500/30 rounded-xl p-8 max-w-sm w-full mx-4 text-center">
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Run Complete</h2>
            <p className="text-orange-400 font-semibold mb-4">Score: {state.score}</p>
            {state.score >= state.bestScore && state.score > 0 && (
              <p className="text-green-400 text-sm font-semibold mb-4">New best!</p>
            )}
            <button
              type="button"
              onClick={() => {
                gameLoopRef.current?.reset();
                setShowLeaderboard(false);
              }}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="w-full mt-3 py-2 rounded-xl border border-orange-500/40 text-orange-400 text-sm"
            >
              Leaderboard
            </button>
            <button type="button" onClick={onExit} className="w-full mt-2 py-2 text-zinc-500 text-sm hover:text-zinc-300">
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Modal: Leaderboard (local) */}
      {showLeaderboard && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-50">
          <div className="bg-zinc-900/95 border border-orange-500/30 rounded-xl p-8 max-w-sm w-full mx-4 text-center">
            <h2 className="text-xl font-bold text-orange-400 mb-4">Leaderboard</h2>
            <p className="text-zinc-300 font-bold">Best: {stats.bestScore}</p>
            <p className="text-zinc-500 text-sm mt-1">Runs: {stats.runsCompleted}</p>
            <button
              type="button"
              onClick={() => setShowLeaderboard(false)}
              className="w-full mt-6 py-3 rounded-xl border border-orange-500/40 text-orange-400 font-semibold hover:bg-orange-500/10"
            >
              Back
            </button>
          </div>
        </div>
      )}

      <div
        className="shrink-0 px-4 py-1 text-center text-xs border-t"
        style={{ color: 'var(--signal-run-stroke)' }}
      >
        ← → or swipe lanes · Arrows in maze · Abilities use energy
      </div>
    </div>
  );
};

export default SecretGame;
