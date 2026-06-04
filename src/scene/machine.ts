import { DEFAULT_MATCH_LENGTH, MATCH_LENGTH_OPTIONS } from "../config";
import { clampScalar } from "../sim/vec";
import type { Difficulty, InputState, Mode, Scene, Settings } from "../types";

/** menu rows the cursor can sit on. */
export const MENU_ROWS = ["mode", "difficulty", "matchLength", "music", "start"] as const;

export interface Machine {
  scene: Scene;
  settings: Settings;
  menuCursor: number;
  /** gameover winner (1 or 2); 0 while not in gameover. */
  winner: 0 | 1 | 2;
}

export function initMachine(): Machine {
  return {
    scene: "menu",
    settings: {
      mode: "1p",
      difficulty: "normal",
      matchLength: DEFAULT_MATCH_LENGTH,
      musicOn: true,
    },
    menuCursor: 0,
    winner: 0,
  };
}

const MODES: Mode[] = ["1p", "2p"];
const DIFFS: Difficulty[] = ["easy", "normal", "hard"];

function cycleMatchLength(current: number, delta: number): number {
  const i = MATCH_LENGTH_OPTIONS.indexOf(current as (typeof MATCH_LENGTH_OPTIONS)[number]);
  const next = (i + delta + MATCH_LENGTH_OPTIONS.length) % MATCH_LENGTH_OPTIONS.length;
  return MATCH_LENGTH_OPTIONS[next] ?? DEFAULT_MATCH_LENGTH;
}

function editMenu(machine: Machine, input: InputState): Machine {
  let menuCursor = machine.menuCursor;
  if (input.menuSelect != null) {
    menuCursor = clampScalar(input.menuSelect, 0, MENU_ROWS.length - 1);
  } else {
    if (input.navUp) menuCursor = (menuCursor - 1 + MENU_ROWS.length) % MENU_ROWS.length;
    if (input.navDown) menuCursor = (menuCursor + 1) % MENU_ROWS.length;
  }

  const settings: Settings = { ...machine.settings };
  const row = MENU_ROWS[menuCursor];

  // confirm on the START row begins play. On a settings row, Enter behaves like
  // navRight (cycle the value forward / toggle); it never starts the game.
  if (input.confirm && row === "start") {
    return { ...machine, scene: "playing", settings, menuCursor, winner: 0 };
  }

  const confirmAsRight = input.confirm && row !== "start";
  const delta = input.navRight || confirmAsRight ? 1 : input.navLeft ? -1 : 0;
  if (delta !== 0) {
    if (row === "mode") {
      const i = MODES.indexOf(settings.mode);
      settings.mode = MODES[(i + delta + MODES.length) % MODES.length] ?? "1p";
    } else if (row === "difficulty") {
      const i = DIFFS.indexOf(settings.difficulty);
      settings.difficulty = DIFFS[(i + delta + DIFFS.length) % DIFFS.length] ?? "normal";
    } else if (row === "matchLength") {
      settings.matchLength = cycleMatchLength(settings.matchLength, delta);
    } else if (row === "music") {
      settings.musicOn = !settings.musicOn;
    }
  }

  return { ...machine, settings, menuCursor };
}

/**
 * True when, from PAUSED, a resume (pause) should win over a restart (confirm)
 * this tick. The loop uses this to decide whether to reset match state: when
 * both edge-keys fire on the same tick, resume wins and confirm is ignored, so
 * the running match must NOT be reset.
 */
export function pauseHasPriority(machine: Machine, input: InputState): boolean {
  return machine.scene === "paused" && input.pause && input.confirm;
}

/**
 * Pure scene reducer. `matchOver` (default false) is supplied by the loop when the
 * current match has just been won, forcing PLAYING → GAMEOVER.
 */
export function reduceMachine(machine: Machine, input: InputState, matchOver = false): Machine {
  switch (machine.scene) {
    case "menu":
      return editMenu(machine, input);
    case "playing":
      if (matchOver) return { ...machine, scene: "gameover" };
      if (input.pause) return { ...machine, scene: "paused" };
      return machine;
    case "paused":
      // resume (pause) takes priority over restart (confirm) when both edge-keys
      // fire in the same tick, so a paused game never restarts unintentionally.
      if (input.pause) return { ...machine, scene: "playing" };
      if (input.back) return { ...machine, scene: "menu" };
      // restart is signalled by confirm: stay in playing, loop resets state.
      if (input.confirm) return { ...machine, scene: "playing" };
      return machine;
    case "gameover":
      if (input.confirm) return { ...machine, scene: "playing", winner: 0 };
      if (input.back) return { ...machine, scene: "menu", winner: 0 };
      return machine;
    default:
      return machine;
  }
}
