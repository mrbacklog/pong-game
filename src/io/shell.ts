import type { Mode, Scene } from "../types";
import { type Rect, computeLayout } from "./viewport";

/**
 * Owns the mobile display shell: it positions the game canvas and the thumb-rails
 * using the SAME computeLayout the touch layer maps pointers against (single source of
 * truth), toggles the pause button / action bar / portrait overlay per scene, and
 * collects one-shot edge actions from the on-screen buttons.
 *
 * It deliberately does not touch the game render or sim — it only places DOM and reads
 * button taps, which are merged into InputState alongside keyboard + touch.
 */
export interface Shell {
  /** recompute + apply the layout (call on load and on resize/orientation change). */
  applyLayout(): void;
  /** reflect the current scene/mode in the shell (pause button, action bar, rails). */
  update(scene: Scene, mode: Mode): void;
  /** read + consume the one-shot edge actions produced by the on-screen buttons. */
  samplePending(): { pause: boolean; confirm: boolean; back: boolean };
  dispose(): void;
}

function place(el: HTMLElement, r: Rect): void {
  el.style.left = `${r.left}px`;
  el.style.top = `${r.top}px`;
  el.style.width = `${r.width}px`;
  el.style.height = `${r.height}px`;
}

export function createShell(): Shell {
  const shell = document.getElementById("shell") as HTMLDivElement;
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const railL = document.getElementById("rail-left") as HTMLDivElement;
  const railR = document.getElementById("rail-right") as HTMLDivElement;
  const btnPause = document.getElementById("btn-pause") as HTMLButtonElement;
  const actions = document.getElementById("actions") as HTMLDivElement;

  let pause = false;
  let confirm = false;
  let back = false;

  // Buttons listen on pointerdown + stopPropagation so they (a) fire reliably even though
  // the shell suppresses default touch behaviour, and (b) are never seen as gutter/menu taps.
  const onPauseDown = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    pause = true;
  };
  const onActionDown = (e: Event): void => {
    const act = (e.target as HTMLElement | null)?.dataset?.act;
    if (!act) return;
    e.preventDefault();
    e.stopPropagation();
    if (act === "resume") pause = true;
    else if (act === "restart" || act === "rematch") confirm = true;
    else if (act === "menu") back = true;
  };

  function applyLayout(): void {
    const layout = computeLayout(window.innerWidth, window.innerHeight);
    shell.classList.toggle("portrait", layout.orientation === "portrait");
    place(canvas, layout.field);

    const inset = 6;
    const railOf = (g: Rect): Rect => ({
      left: g.left + inset,
      top: g.top + g.height * 0.12,
      width: Math.max(0, g.width - 2 * inset),
      height: g.height * 0.76,
    });
    place(railL, railOf(layout.leftGutter));
    place(railR, railOf(layout.rightGutter));
  }

  // Fullscreen toggle (best-effort): works on Android/desktop, unsupported on iOS Safari.
  // The button is only shown where document.fullscreenEnabled is true, so there is never a
  // dead control; on entering fullscreen we also try to lock landscape (Android only).
  const btnFs = document.getElementById("btn-fs") as HTMLButtonElement;
  const fsSupported = !!document.fullscreenEnabled;
  shell.classList.toggle("fs-ok", fsSupported);

  const syncFsIcon = (): void => {
    btnFs.textContent = document.fullscreenElement ? "⤢" : "⛶";
  };
  const onFsChange = (): void => {
    syncFsIcon();
    applyLayout(); // entering/leaving fullscreen resizes the viewport
  };
  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(
        () => {
          const orient = screen.orientation as unknown as { lock?: (o: string) => Promise<void> };
          orient.lock?.("landscape")?.catch(() => {});
        },
        () => {},
      );
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  const onFsDown = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  };

  btnPause.addEventListener("pointerdown", onPauseDown);
  actions.addEventListener("pointerdown", onActionDown);
  if (fsSupported) btnFs.addEventListener("pointerdown", onFsDown);
  document.addEventListener("fullscreenchange", onFsChange);
  syncFsIcon();

  return {
    applyLayout,

    update(scene: Scene, mode: Mode): void {
      shell.classList.remove("menu", "playing", "paused", "over");
      shell.classList.add(scene === "gameover" ? "over" : scene);
      shell.classList.toggle("dual", mode === "2p");
    },

    samplePending(): { pause: boolean; confirm: boolean; back: boolean } {
      const pending = { pause, confirm, back };
      pause = false;
      confirm = false;
      back = false;
      return pending;
    },

    dispose(): void {
      btnPause.removeEventListener("pointerdown", onPauseDown);
      actions.removeEventListener("pointerdown", onActionDown);
      btnFs.removeEventListener("pointerdown", onFsDown);
      document.removeEventListener("fullscreenchange", onFsChange);
    },
  };
}
