export type InputMode = "keyboard" | "touch";

export interface InputModeTracker {
  /** the input modality the player most recently used. */
  get(): InputMode;
  dispose(): void;
}

/** minimal window surface we depend on (so the tracker is unit-testable without a DOM). */
export interface WindowLike {
  addEventListener(type: string, handler: (e: Event) => void, capture?: boolean): void;
  removeEventListener(type: string, handler: (e: Event) => void, capture?: boolean): void;
  matchMedia?(query: string): { matches: boolean };
}

/**
 * Tracks the *current* input modality. Best practice (what-input / Pointer Events
 * `pointerType`): react to the last-used input instead of sniffing device capability,
 * which is what matters on hybrid devices (touch laptops, desktops with a touchscreen).
 * Initial guess comes from a coarse-pointer media query; it is then refined live on
 * `keydown` (→ keyboard) and `pointerdown` (touch → touch, mouse → keyboard).
 */
export function createInputModeTracker(win: WindowLike = window): InputModeTracker {
  let mode: InputMode = win.matchMedia?.("(pointer: coarse)").matches ? "touch" : "keyboard";

  const onKey = (): void => {
    mode = "keyboard";
  };
  const onPointer = (e: Event): void => {
    const type = (e as PointerEvent).pointerType;
    if (type === "touch") mode = "touch";
    else if (type === "mouse") mode = "keyboard";
    // "pen" and anything else: leave the current mode unchanged.
  };

  win.addEventListener("keydown", onKey, true);
  win.addEventListener("pointerdown", onPointer, true);

  return {
    get: (): InputMode => mode,
    dispose: (): void => {
      win.removeEventListener("keydown", onKey, true);
      win.removeEventListener("pointerdown", onPointer, true);
    },
  };
}
