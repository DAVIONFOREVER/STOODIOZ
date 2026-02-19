# Signal Run – Plan and Verification

## What was found (existing game feature)

- **Component:** `SecretGame` in `components/SecretGame.tsx` (default export).
- **Props:** `{ onExit: () => void }` only.
- **Mounted in:** `App.tsx` at `case AppView.SECRET_GAME` → `<SecretGame onExit={goBack} />` inside `Suspense` (lazy-loaded).
- **Open/close:** Navigation opens the game (`navigate(AppView.SECRET_GAME)`). Closing is `onExit` which is `goBack` (history back). No `isOpen`/context.
- **Entrypoints:** Two Header instances (desktop + mobile) pass `onSecretUnlock={() => onNavigate(AppView.SECRET_GAME)}`. UniversalSearch triggers on secret phrase match and calls `onSecretUnlock`.
- **Persistence:** `stoodioz_secret_game_best` (localStorage) for best score; `stoodioz_signal_run_stats` for runs/time.

## What was kept (unchanged)

- Component name and file: `SecretGame`, `components/SecretGame.tsx`.
- Prop signature: `SecretGameProps = { onExit: () => void }`.
- App routing: no changes to `App.tsx` (same case, same lazy import and `onExit={goBack}`).
- Triggers: UniversalSearch and Header unchanged.
- Persistence keys: reused for best score; added stats key for Signal Run.

## What was replaced / added

- **Internal implementation** of `SecretGame.tsx`: now mounts canvas, top HUD (Back, Score, Multiplier, Energy %, Pause), bottom HUD (Beat Meter, DROP/VOCAL/MIX/MASTER), modals (Start, Pause, End, Leaderboard), and wires input to the engine. Cleanup on unmount: stop RAF, unbind input.
- **Engine** under `components/SecretGame/engine/`:
  - `state.ts` – types, initial state, constants
  - `persistence.ts` – load/save best score and stats
  - `input.ts` – keyboard + touch/swipe → actions
  - `scoring.ts` – score, multiplier, beat timing
  - `match3.ts` – inventory, 3-of-a-kind, effects
  - `enemies.ts` – chaser update/spawn, runner collision
  - `runner.ts` – 3-lane runner, tiles/portals/obstacles
  - `maze.ts` – grid maze, move, chaser, exit
  - `loop.ts` – RAF loop, input → state, reset
  - `render.ts` – canvas 2D (runner + maze, proportional scaling)
  - `match3-harness.mjs` – runnable match3 tests (`npm run test:match3`)

## Final file tree (game-related)

```
components/
  SecretGame.tsx          # React wrapper: canvas + HUD + modals, same export/props
  SecretGame/
    engine/
      state.ts
      persistence.ts
      input.ts
      scoring.ts
      match3.ts
      enemies.ts
      runner.ts
      maze.ts
      loop.ts
      render.ts
      match3-harness.mjs
```

## How to verify

1. **Entry**
   - Open the app, focus search, type **the blues is alright** (or press Enter with that phrase).
   - You should navigate to the game overlay and see the **Signal Run** Start modal (title “Signal Run”, Play / Leaderboard / Exit).

2. **HUD**
   - With the Start modal closed (after clicking Play): top bar shows Back, Score, Multiplier, Energy %, Best, **CHASE** bar (runner only), Pause. Bottom bar shows Beat meter and DROP, VOCAL, MIX, MASTER buttons.

3. **Gameplay**
   - **Runner (forward scroll):** The world scrolls toward the player via `roadOffset`; nothing spawns at the top and falls. Use ←/→ (or swipe) to change lanes. Collect **diamond** tiles (green/blue/orange/purple), avoid red obstacles. **Rectangular gate** (dashed) portals enter the maze. **Chevron/triangle** chasers move toward you; collision or **CHASE bar reaching zero** ends the run. **CHASE** bar in the top HUD shrinks over time; VOCAL stun expands it visibly.
   - **Visuals:** Moving lane dividers, speed lines, and subtle parallax grid animate with the road. Player is a **rounded rectangle**; chasers are **triangles/chevrons**; portals a **rect gate**; tiles **diamonds**. No circles for gameplay entities.
   - **Beat meter:** Pulse every ~0.6s. Actions (e.g. lane switch) within ±120ms show “PERFECT” and boost multiplier/energy; off-beat gives reduced/no boost.
   - **Maze:** After a portal, use arrow keys (or swipe) to move. Reach the exit (top-right) to return to the runner. Avoid the red chaser.
   - **Match-3:** Collect 3 of the same tile type for an automatic effect (e.g. stun chaser, boost multiplier, restore energy).
   - **Abilities:** Use DROP/VOCAL/MIX/MASTER when enabled (energy + cooldown). VOCAL stuns chasers and restores CHASE distance; MASTER can trigger match effect.

4. **Modals**
   - Pause: Pause button or Escape → Paused modal; Resume or Exit.
   - End: Run completes (time up) or collision → Run Complete modal; Play again, Leaderboard, Exit.
   - Leaderboard: From Start or End → local best score and run count; Back.

5. **Exit**
   - Back/Close or Exit in any modal calls `onExit` and returns to the previous app view.

6. **Build and tests**
   - `npm run build` – completes with no errors.
   - `npm run test:match3` – match3 harness passes.

7. **No regressions**
   - App still navigates and shows Header/UniversalSearch as before. No changes to `App.tsx` routing or trigger wiring.

## Before/after summary (forward-scroll refactor)

- **runner.ts:** Before: spawn at `y: -8`, `e.y += speed`. After: spawn at `z: roadOffset + SPAWN_Z` (world z), entities fixed in world; remove when `z < roadOffset - margin`; no y.
- **enemies.ts:** Before: `c.y += …`, spawn `y: -5`, collision on y. After: `c.z` decreased each tick, spawn `z: roadOffset + CHASER_SPAWN_Z`, collision on z band + lane.
- **loop.ts:** Before: no roadOffset, no chase bar, end on collision only. After: `roadOffset += ROAD_SPEED*dt`, `chaseDistance` decay each tick and VOCAL stun restores it; end when `chaseDistance <= 0` or chaser/obstacle collision.
- **render.ts:** Before: static dividers, circles for player/portals/chasers. After: moving lane dividers, speed lines, parallax grid; player = rounded rect; chasers = chevron; portals = rect gate; tiles = diamonds; dev guard forbids ctx.arc for entities.
