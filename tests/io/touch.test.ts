import { describe, expect, it, vi } from "vitest";
import { FIELD_H } from "../../src/config";
import { createTouchManager, dirToTarget } from "../../src/io/touch";
import { computeLayout } from "../../src/io/viewport";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal mock HTMLElement that captures pointer event handlers. */
function makeMockTarget(clientWidth = 1600, clientHeight = 900) {
  const handlers: Record<string, ((e: unknown) => void)[]> = {};
  const removedHandlers: Record<string, number> = {};

  const target = {
    clientWidth,
    clientHeight,
    addEventListener(type: string, fn: (e: unknown) => void) {
      if (!handlers[type]) handlers[type] = [];
      handlers[type].push(fn);
    },
    removeEventListener(type: string, _fn: (e: unknown) => void) {
      removedHandlers[type] = (removedHandlers[type] ?? 0) + 1;
    },
    _fire(type: string, event: unknown) {
      for (const h of handlers[type] ?? []) h(event);
    },
    _removedCount(type: string) {
      return removedHandlers[type] ?? 0;
    },
    _hasHandler(type: string) {
      return (handlers[type]?.length ?? 0) > 0;
    },
  };
  return target;
}

function makePointerEvent(
  pointerId: number,
  clientX: number,
  clientY: number,
): { pointerId: number; clientX: number; clientY: number; preventDefault: () => void } {
  return { pointerId, clientX, clientY, preventDefault: vi.fn() };
}

// ── dirToTarget ───────────────────────────────────────────────────────────────

describe("dirToTarget", () => {
  it("returns 1 when target is well below center", () => {
    expect(dirToTarget(300, 200)).toBe(1);
  });

  it("returns -1 when target is well above center", () => {
    expect(dirToTarget(100, 250)).toBe(-1);
  });

  it("returns 0 when within default dead-zone (distance 5)", () => {
    expect(dirToTarget(205, 200)).toBe(0);
  });

  it("returns 0 when exactly on dead-zone boundary (distance === deadZone)", () => {
    expect(dirToTarget(210, 200)).toBe(0); // distance = 10 = defaultDeadZone
  });

  it("returns 1 just outside dead-zone (distance 11)", () => {
    expect(dirToTarget(211, 200)).toBe(1);
  });

  it("returns -1 just above dead-zone (distance 11)", () => {
    expect(dirToTarget(189, 200)).toBe(-1);
  });

  it("respects custom dead-zone", () => {
    // distance = 5, deadZone = 3 → should move
    expect(dirToTarget(205, 200, 3)).toBe(1);
    // distance = 5, deadZone = 5 → on boundary → 0
    expect(dirToTarget(205, 200, 5)).toBe(0);
  });

  it("returns 0 when targetY === paddleCenter", () => {
    expect(dirToTarget(200, 200)).toBe(0);
  });
});

// ── createTouchManager ────────────────────────────────────────────────────────

describe("createTouchManager – setup", () => {
  it("registers pointer event listeners on the target", () => {
    const target = makeMockTarget();
    createTouchManager(target as unknown as HTMLElement);
    expect(target._hasHandler("pointerdown")).toBe(true);
    expect(target._hasHandler("pointermove")).toBe(true);
    expect(target._hasHandler("pointerup")).toBe(true);
    expect(target._hasHandler("pointercancel")).toBe(true);
  });

  it("dispose() removes all listeners", () => {
    const target = makeMockTarget();
    const mgr = createTouchManager(target as unknown as HTMLElement);
    mgr.dispose();
    expect(target._removedCount("pointerdown")).toBeGreaterThanOrEqual(1);
    expect(target._removedCount("pointermove")).toBeGreaterThanOrEqual(1);
    expect(target._removedCount("pointerup")).toBeGreaterThanOrEqual(1);
    expect(target._removedCount("pointercancel")).toBeGreaterThanOrEqual(1);
  });
});

describe("createTouchManager – playing 1p", () => {
  /**
   * viewport 1600×900 → computeLayout gives us exact field rect.
   * Left gutter: x < field.left
   * Right gutter: x >= field.left + field.width
   */
  function makeAndPlay1p() {
    const VW = 1600;
    const VH = 900;
    const layout = computeLayout(VW, VH);
    const { field, leftGutter, rightGutter } = layout;

    const target = makeMockTarget(VW, VH);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    // Paddle centers in field-coords
    const p1Center = FIELD_H / 2; // 360
    const p2Center = FIELD_H / 2;

    return { target, mgr, field, leftGutter, rightGutter, p1Center, p2Center };
  }

  it("pointer in left gutter below p1Center → p1Dir === 1, p2Dir === 0", () => {
    const { target, mgr, field, leftGutter, p1Center, p2Center } = makeAndPlay1p();

    // Place pointer in left gutter: x = leftGutter.left + leftGutter.width/2,
    // y = field.top + (p1Center/FIELD_H)*field.height + 50 (well below dead-zone)
    const cx = leftGutter.left + leftGutter.width / 2;
    const targetFieldY = p1Center + 50; // 50px below center in field-coords
    const cy = field.top + (targetFieldY / FIELD_H) * field.height;

    target._fire("pointerdown", makePointerEvent(1, cx, cy));

    const frame = mgr.sample("playing", "1p", p1Center, p2Center);
    expect(frame.p1Dir).toBe(1);
    expect(frame.p2Dir).toBe(0);
  });

  it("pointer in left gutter above p1Center → p1Dir === -1", () => {
    const { target, mgr, field, leftGutter, p1Center, p2Center } = makeAndPlay1p();

    const cx = leftGutter.left + leftGutter.width / 2;
    const targetFieldY = p1Center - 50;
    const cy = field.top + (targetFieldY / FIELD_H) * field.height;

    target._fire("pointerdown", makePointerEvent(1, cx, cy));

    const frame = mgr.sample("playing", "1p", p1Center, p2Center);
    expect(frame.p1Dir).toBe(-1);
    expect(frame.p2Dir).toBe(0);
  });

  it("pointer in right gutter in 1p mode → p2Dir === 0 (AI controls P2)", () => {
    const { target, mgr, field, rightGutter, p1Center, p2Center } = makeAndPlay1p();

    const cx = rightGutter.left + rightGutter.width / 2;
    const targetFieldY = p2Center + 50;
    const cy = field.top + (targetFieldY / FIELD_H) * field.height;

    target._fire("pointerdown", makePointerEvent(2, cx, cy));

    const frame = mgr.sample("playing", "1p", p1Center, p2Center);
    expect(frame.p2Dir).toBe(0);
  });
});

describe("createTouchManager – playing 2p", () => {
  function makeAndPlay2p() {
    const VW = 1600;
    const VH = 900;
    const layout = computeLayout(VW, VH);
    const { field, leftGutter, rightGutter } = layout;

    const target = makeMockTarget(VW, VH);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    const p1Center = FIELD_H / 2;
    const p2Center = FIELD_H / 2;

    return { target, mgr, field, leftGutter, rightGutter, p1Center, p2Center };
  }

  it("pointer in right gutter below p2Center in 2p → p2Dir === 1", () => {
    const { target, mgr, field, rightGutter, p1Center, p2Center } = makeAndPlay2p();

    const cx = rightGutter.left + rightGutter.width / 2;
    const targetFieldY = p2Center + 50;
    const cy = field.top + (targetFieldY / FIELD_H) * field.height;

    target._fire("pointerdown", makePointerEvent(2, cx, cy));

    const frame = mgr.sample("playing", "2p", p1Center, p2Center);
    expect(frame.p2Dir).not.toBe(0);
  });

  it("no active pointers → p1Dir and p2Dir are 0", () => {
    const { mgr, p1Center, p2Center } = makeAndPlay2p();
    const frame = mgr.sample("playing", "2p", p1Center, p2Center);
    expect(frame.p1Dir).toBe(0);
    expect(frame.p2Dir).toBe(0);
  });
});

describe("createTouchManager – menu taps", () => {
  /**
   * MENU_TOP_Y=320, MENU_ROW_GAP=64, FIELD_W=1280, FIELD_H=720
   * Row 0 baseline = 320, band top ≈ 281.6, band bottom ≈ 345.6
   * Row 4 (START) baseline = 320 + 4*64 = 576 → confirm
   *
   * To get client coords: map field → client via computeLayout(1600,900).
   */
  function fieldToClient(fieldX: number, fieldY: number) {
    const layout = computeLayout(1600, 900);
    const { field } = layout;
    const cx = field.left + (fieldX / 1280) * field.width;
    const cy = field.top + (fieldY / 720) * field.height;
    return { cx, cy };
  }

  it("tap on row 0 right half → menuSelect===0, navRight===true", () => {
    const target = makeMockTarget(1600, 900);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    // Row 0 center: fieldY = 320, fieldX = 800 (right half, > FIELD_W/2=640)
    const { cx, cy } = fieldToClient(800, 320);
    target._fire("pointerdown", makePointerEvent(1, cx, cy));

    const frame = mgr.sample("menu", "1p", 0, 0);
    expect(frame.menuSelect).toBe(0);
    expect(frame.navRight).toBe(true);
  });

  it("tap on row 0 left half → menuSelect===0, navLeft===true", () => {
    const target = makeMockTarget(1600, 900);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    // Row 0 center: fieldY = 320, fieldX = 400 (left half, < FIELD_W/2=640)
    const { cx, cy } = fieldToClient(400, 320);
    target._fire("pointerdown", makePointerEvent(1, cx, cy));

    const frame = mgr.sample("menu", "1p", 0, 0);
    expect(frame.menuSelect).toBe(0);
    expect(frame.navLeft).toBe(true);
  });

  it("tap on START row (row 4) → confirm===true", () => {
    const target = makeMockTarget(1600, 900);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    // Row 4: fieldY = 320 + 4*64 = 576
    const { cx, cy } = fieldToClient(640, 576);
    target._fire("pointerdown", makePointerEvent(1, cx, cy));

    const frame = mgr.sample("menu", "1p", 0, 0);
    expect(frame.confirm).toBe(true);
  });

  it("taps are consumed: second sample returns empty frame", () => {
    const target = makeMockTarget(1600, 900);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    const { cx, cy } = fieldToClient(800, 320);
    target._fire("pointerdown", makePointerEvent(1, cx, cy));

    mgr.sample("menu", "1p", 0, 0); // consume
    const frame2 = mgr.sample("menu", "1p", 0, 0);
    expect(frame2.menuSelect).toBeNull();
    expect(frame2.navRight).toBe(false);
    expect(frame2.navLeft).toBe(false);
    expect(frame2.confirm).toBe(false);
  });

  it("tap outside field is ignored", () => {
    const target = makeMockTarget(1600, 900);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    // Click in left gutter (outside field rect)
    target._fire("pointerdown", makePointerEvent(1, 10, 450));

    const frame = mgr.sample("menu", "1p", 0, 0);
    expect(frame.menuSelect).toBeNull();
    expect(frame.navRight).toBe(false);
    expect(frame.confirm).toBe(false);
  });
});

describe("createTouchManager – pointermove updates live pointer", () => {
  it("pointermove after pointerdown updates the tracked position", () => {
    const VW = 1600;
    const VH = 900;
    const layout = computeLayout(VW, VH);
    const { field, leftGutter } = layout;

    const target = makeMockTarget(VW, VH);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    const p1Center = FIELD_H / 2;

    // Start pointer in left gutter at center
    const cx = leftGutter.left + leftGutter.width / 2;
    const startCy = field.top + (p1Center / FIELD_H) * field.height; // exactly at center
    target._fire("pointerdown", makePointerEvent(1, cx, startCy));

    // Move pointer well below center
    const targetFieldY = p1Center + 80;
    const newCy = field.top + (targetFieldY / FIELD_H) * field.height;
    target._fire("pointermove", makePointerEvent(1, cx, newCy));

    const frame = mgr.sample("playing", "1p", p1Center, 0);
    expect(frame.p1Dir).toBe(1);
  });

  it("pointerup removes the live pointer", () => {
    const VW = 1600;
    const VH = 900;
    const layout = computeLayout(VW, VH);
    const { field, leftGutter } = layout;

    const target = makeMockTarget(VW, VH);
    const mgr = createTouchManager(target as unknown as HTMLElement);

    const p1Center = FIELD_H / 2;
    const cx = leftGutter.left + leftGutter.width / 2;
    const cy = field.top + ((p1Center + 80) / FIELD_H) * field.height;

    target._fire("pointerdown", makePointerEvent(1, cx, cy));
    target._fire("pointerup", makePointerEvent(1, cx, cy));

    const frame = mgr.sample("playing", "1p", p1Center, 0);
    expect(frame.p1Dir).toBe(0);
  });
});
