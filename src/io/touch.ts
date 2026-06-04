import { menuHitTest } from "../render/menu-hit";
import type { Mode, Scene } from "../types";
import { clientToField, clientYToFieldY, computeLayout, zoneAt } from "./viewport";

/** Pure: richting waarin de paddle moet bewegen om naar targetY te jagen (dead-zone tegen jitter). */
export function dirToTarget(targetY: number, paddleCenter: number, deadZone = 10): -1 | 0 | 1 {
  const d = targetY - paddleCenter;
  if (Math.abs(d) <= deadZone) return 0;
  return d > 0 ? 1 : -1;
}

export interface TouchFrame {
  p1Dir: -1 | 0 | 1;
  p2Dir: -1 | 0 | 1;
  menuSelect: number | null;
  navLeft: boolean;
  navRight: boolean;
  confirm: boolean;
}

export interface TouchManager {
  /** lees+consumeer de touch-bijdrage voor deze tick. paddleCenters in veld-coords (paddle.y + PADDLE_H/2). */
  sample(scene: Scene, mode: Mode, p1Center: number, p2Center: number): TouchFrame;
  dispose(): void;
}

export function createTouchManager(target: HTMLElement): TouchManager {
  // Live pointers: pointerId → last known {x, y} in client coords
  const live = new Map<number, { x: number; y: number }>();
  // Tap queue: pointerdown events pending consumption
  const taps: { x: number; y: number }[] = [];

  const onPointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    live.set(e.pointerId, { x: e.clientX, y: e.clientY });
    taps.push({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (live.has(e.pointerId)) {
      live.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
  };

  const onPointerUp = (e: PointerEvent): void => {
    live.delete(e.pointerId);
  };

  const onPointerCancel = (e: PointerEvent): void => {
    live.delete(e.pointerId);
  };

  target.addEventListener("pointerdown", onPointerDown as EventListener, { passive: false });
  target.addEventListener("pointermove", onPointerMove as EventListener);
  target.addEventListener("pointerup", onPointerUp as EventListener);
  target.addEventListener("pointercancel", onPointerCancel as EventListener);

  return {
    sample(scene: Scene, mode: Mode, p1Center: number, p2Center: number): TouchFrame {
      const layout = computeLayout(target.clientWidth, target.clientHeight);
      const field = layout.field;

      const frame: TouchFrame = {
        p1Dir: 0,
        p2Dir: 0,
        menuSelect: null,
        navLeft: false,
        navRight: false,
        confirm: false,
      };

      if (scene === "playing") {
        let leftTarget = 0;
        let leftActive = false;
        let rightTarget = 0;
        let rightActive = false;

        // First pointer (earliest down) per gutter wins; a second finger in the same
        // gutter does not yank the paddle to its position.
        for (const { x, y } of live.values()) {
          const zone = zoneAt(x, y, layout);
          if (zone === "left" && !leftActive) {
            leftTarget = clientYToFieldY(y, field);
            leftActive = true;
          } else if (zone === "right" && !rightActive) {
            rightTarget = clientYToFieldY(y, field);
            rightActive = true;
          }
        }

        frame.p1Dir = leftActive ? dirToTarget(leftTarget, p1Center) : 0;
        frame.p2Dir = mode === "2p" && rightActive ? dirToTarget(rightTarget, p2Center) : 0;
      } else if (scene === "menu") {
        for (const tap of taps) {
          const f = clientToField(tap.x, tap.y, field);
          if (f) {
            const hit = menuHitTest(f.x, f.y);
            if (hit) {
              frame.menuSelect = hit.row;
              if (hit.action === "left") frame.navLeft = true;
              else if (hit.action === "right") frame.navRight = true;
              else frame.confirm = true;
              break;
            }
          }
        }
      }

      // Always consume taps
      taps.length = 0;

      return frame;
    },

    dispose(): void {
      target.removeEventListener("pointerdown", onPointerDown as EventListener);
      target.removeEventListener("pointermove", onPointerMove as EventListener);
      target.removeEventListener("pointerup", onPointerUp as EventListener);
      target.removeEventListener("pointercancel", onPointerCancel as EventListener);
    },
  };
}
