/** Signal Run – touch/swipe + keyboard input */

export type InputAction =
  | { type: 'lane_left' }
  | { type: 'lane_right' }
  | { type: 'move_up' }
  | { type: 'move_down' }
  | { type: 'move_left' }
  | { type: 'move_right' }
  | { type: 'ability'; id: 'drop' | 'vocal' | 'mix' | 'master' }
  | { type: 'pause' }
  | { type: 'confirm' };

const SWIPE_THRESHOLD_PX = 40;

export function createInputHandler(
  onAction: (action: InputAction) => void,
  getElement: () => HTMLElement | null
): { bind: () => void; unbind: () => void } {
  let touchStartX = 0;
  let touchStartY = 0;
  let bound = false;

  function onKeyDown(e: KeyboardEvent) {
    const active = document.activeElement;
    const el = getElement();
    if (active && active !== document.body) {
      const tag = active.tagName && active.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable;
      if (isInput && (!el || !el.contains(active))) return;
    }
    if (e.repeat) return;
    if (e.key === 'ArrowLeft') {
      onAction({ type: 'lane_left' });
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight') {
      onAction({ type: 'lane_right' });
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowUp') {
      onAction({ type: 'move_up' });
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      onAction({ type: 'move_down' });
      e.preventDefault();
      return;
    }
    if (e.key === ' ') {
      onAction({ type: 'confirm' });
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') {
      onAction({ type: 'pause' });
      e.preventDefault();
    }
  }

  function onTouchStart(e: TouchEvent) {
    if (e.changedTouches.length === 0) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx >= SWIPE_THRESHOLD_PX || ady >= SWIPE_THRESHOLD_PX) {
      if (adx > ady) {
        onAction(dx < 0 ? { type: 'lane_right' } : { type: 'lane_left' });
      } else {
        onAction(dy < 0 ? { type: 'move_up' } : { type: 'move_down' });
      }
    }
  }

  function bind() {
    if (bound) return;
    bound = true;
    window.addEventListener('keydown', onKeyDown);
    const el = getElement();
    if (el) {
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchend', onTouchEnd, { passive: true });
    }
  }

  function unbind() {
    if (!bound) return;
    bound = false;
    window.removeEventListener('keydown', onKeyDown);
    const el = getElement();
    if (el) {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    }
  }

  return { bind, unbind };
}
