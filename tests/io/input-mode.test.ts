import { describe, expect, it } from "vitest";
import { type WindowLike, createInputModeTracker } from "../../src/io/input-mode";

/** a fake window that records handlers and lets a test fire events at them. */
function fakeWindow(coarse: boolean) {
  const handlers = new Map<string, (e: Event) => void>();
  const removed: string[] = [];
  const win: WindowLike = {
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
    removeEventListener(type) {
      removed.push(type);
    },
    matchMedia(query: string) {
      return { matches: query.includes("coarse") ? coarse : false };
    },
  };
  const fire = (type: string, e: Partial<Event>): void => {
    handlers.get(type)?.(e as Event);
  };
  return { win, fire, removed };
}

describe("createInputModeTracker", () => {
  it("initial guess: keyboard when the primary pointer is not coarse", () => {
    const { win } = fakeWindow(false);
    expect(createInputModeTracker(win).get()).toBe("keyboard");
  });

  it("initial guess: touch when the primary pointer is coarse", () => {
    const { win } = fakeWindow(true);
    expect(createInputModeTracker(win).get()).toBe("touch");
  });

  it("a keydown switches to keyboard", () => {
    const { win, fire } = fakeWindow(true); // start touch
    const t = createInputModeTracker(win);
    fire("keydown", {});
    expect(t.get()).toBe("keyboard");
  });

  it("a touch pointerdown switches to touch", () => {
    const { win, fire } = fakeWindow(false); // start keyboard
    const t = createInputModeTracker(win);
    fire("pointerdown", { pointerType: "touch" } as unknown as Event);
    expect(t.get()).toBe("touch");
  });

  it("a mouse pointerdown counts as keyboard", () => {
    const { win, fire } = fakeWindow(true); // start touch
    const t = createInputModeTracker(win);
    fire("pointerdown", { pointerType: "mouse" } as unknown as Event);
    expect(t.get()).toBe("keyboard");
  });

  it("a pen pointerdown leaves the current mode unchanged", () => {
    const { win, fire } = fakeWindow(true); // start touch
    const t = createInputModeTracker(win);
    fire("pointerdown", { pointerType: "pen" } as unknown as Event);
    expect(t.get()).toBe("touch");
  });

  it("dispose removes both listeners", () => {
    const { win, removed } = fakeWindow(false);
    createInputModeTracker(win).dispose();
    expect(removed).toContain("keydown");
    expect(removed).toContain("pointerdown");
  });
});
