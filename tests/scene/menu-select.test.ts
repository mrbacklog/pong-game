import { describe, expect, it } from "vitest";
import { MENU_ROWS, initMachine, reduceMachine } from "../../src/scene/machine";
import type { InputState } from "../../src/types";

const noInput: InputState = {
  p1Dir: 0,
  p2Dir: 0,
  confirm: false,
  pause: false,
  back: false,
  mute: false,
  navUp: false,
  navDown: false,
  navLeft: false,
  navRight: false,
};

describe("menuSelect", () => {
  it("menuSelect:2 jumps cursor to matchLength row and navRight cycles the value", () => {
    const m = initMachine(); // cursor starts at 0
    const result = reduceMachine(m, { ...noInput, menuSelect: 2, navRight: true });
    // cursor must have moved to row 2 (matchLength)
    expect(result.menuCursor).toBe(2);
    // matchLength should have been cycled (navRight applied after direct select)
    expect(result.settings.matchLength).not.toBe(m.settings.matchLength);
    // row index 2 = matchLength
    expect(MENU_ROWS[2]).toBe("matchLength");
  });

  it("menuSelect:4 + confirm → scene 'playing' (START row)", () => {
    const m = initMachine();
    const result = reduceMachine(m, { ...noInput, menuSelect: 4, confirm: true });
    expect(result.scene).toBe("playing");
  });

  it("menuSelect clamps out-of-range values to valid range", () => {
    const m = initMachine();
    const highResult = reduceMachine(m, { ...noInput, menuSelect: 999 });
    expect(highResult.menuCursor).toBe(MENU_ROWS.length - 1);

    const lowResult = reduceMachine(m, { ...noInput, menuSelect: -5 });
    expect(lowResult.menuCursor).toBe(0);
  });

  it("menuSelect:2 ignores navUp/navDown (direct select wins)", () => {
    const m = { ...initMachine(), menuCursor: 0 };
    // navDown would normally move cursor to 1; menuSelect:2 should win
    const result = reduceMachine(m, { ...noInput, menuSelect: 2, navDown: true });
    expect(result.menuCursor).toBe(2);
  });

  it("undefined menuSelect falls back to normal nav (existing behavior unaffected)", () => {
    const m = initMachine(); // cursor at 0
    const result = reduceMachine(m, { ...noInput, navDown: true });
    expect(result.menuCursor).toBe(1);
  });

  it("null menuSelect falls back to normal nav", () => {
    const m = initMachine();
    const result = reduceMachine(m, { ...noInput, menuSelect: null, navDown: true });
    expect(result.menuCursor).toBe(1);
  });
});
