import { describe, expect, it } from "vitest";
import { FIELD_H, FIELD_W } from "../../src/config";
import { clientToField, clientYToFieldY, computeLayout, zoneAt } from "../../src/io/viewport";

describe("computeLayout", () => {
  it("wide (2000×900 ≈ 20:9): height-fit → fieldH=900, fieldW=1600, gutters 200 each, landscape", () => {
    const layout = computeLayout(2000, 900);
    expect(layout.orientation).toBe("landscape");
    expect(layout.field.height).toBeCloseTo(900);
    expect(layout.field.width).toBeCloseTo(1600);
    expect(layout.leftGutter.width).toBeCloseTo(200);
    expect(layout.rightGutter.width).toBeCloseTo(200);
    expect(layout.leftGutter.width).toBeGreaterThanOrEqual(56);
    expect(layout.rightGutter.width).toBeGreaterThanOrEqual(56);
  });

  it("exact 16:9 (1600×900): gutterMin=56 forces fieldW=1488, gutters 56 each", () => {
    const layout = computeLayout(1600, 900);
    expect(layout.orientation).toBe("landscape");
    // maxFieldW = 1600 - 2*56 = 1488; fieldW would be 900*16/9=1600 > 1488 → clamped to 1488
    expect(layout.field.width).toBeCloseTo(1488);
    expect(layout.leftGutter.width).toBeCloseTo(56);
    expect(layout.rightGutter.width).toBeCloseTo(56);
    // fieldH = 1488 * 9/16 = 837 ≤ 900, so no vertical clamp
    expect(layout.field.height).toBeCloseTo(1488 * (9 / 16));
    expect(layout.field.height).toBeLessThanOrEqual(900);
  });

  it("portrait (900×1600): orientation is portrait", () => {
    const layout = computeLayout(900, 1600);
    expect(layout.orientation).toBe("portrait");
  });

  it("portrait layout field is within viewport", () => {
    const layout = computeLayout(900, 1600);
    expect(layout.field.left).toBeGreaterThanOrEqual(0);
    expect(layout.field.top).toBeGreaterThanOrEqual(0);
    expect(layout.field.left + layout.field.width).toBeLessThanOrEqual(900 + 0.001);
    expect(layout.field.top + layout.field.height).toBeLessThanOrEqual(1600 + 0.001);
  });

  it("gutter left + field width + gutter right = viewportW", () => {
    const layout = computeLayout(1920, 1080);
    const total = layout.leftGutter.width + layout.field.width + layout.rightGutter.width;
    expect(total).toBeCloseTo(1920);
  });

  it("square viewport (800×800): landscape, gutters ≥ 56", () => {
    const layout = computeLayout(800, 800);
    expect(layout.orientation).toBe("landscape"); // not portrait because H not > W
    expect(layout.leftGutter.width).toBeGreaterThanOrEqual(56 - 0.001);
    expect(layout.rightGutter.width).toBeGreaterThanOrEqual(56 - 0.001);
  });
});

describe("clientToField", () => {
  it("point inside field maps to correct field coords", () => {
    const layout = computeLayout(2000, 900);
    const field = layout.field;
    // field is centered: left=200, top=0, width=1600, height=900
    // clientX=200+800=1000 (midpoint) → fieldX = 800/1600*1280 = 640
    // clientY=450 (midpoint) → fieldY = 450/900*720 = 360
    const result = clientToField(1000, 450, field);
    expect(result).not.toBeNull();
    expect(result?.x).toBeCloseTo(640);
    expect(result?.y).toBeCloseTo(360);
  });

  it("point at top-left corner of field → {x:0, y:0}", () => {
    const layout = computeLayout(2000, 900);
    const field = layout.field;
    const result = clientToField(field.left, field.top, field);
    expect(result).not.toBeNull();
    expect(result?.x).toBeCloseTo(0);
    expect(result?.y).toBeCloseTo(0);
  });

  it("point outside field (in left gutter) → null", () => {
    const layout = computeLayout(2000, 900);
    const field = layout.field;
    // field.left = 200, so clientX=100 is in the gutter
    const result = clientToField(100, 450, field);
    expect(result).toBeNull();
  });

  it("point outside field (below field) → null", () => {
    // portrait case where field doesn't fill full height
    const layout = computeLayout(900, 1600);
    const field = layout.field;
    // below the field
    const result = clientToField(field.left + 10, field.top + field.height + 10, field);
    expect(result).toBeNull();
  });

  it("point clamped at field boundary gives FIELD_W/FIELD_H", () => {
    const field = { left: 0, top: 0, width: 1600, height: 900 };
    // exactly at right/bottom edge
    const result = clientToField(1600, 900, field);
    expect(result).not.toBeNull();
    expect(result?.x).toBeCloseTo(FIELD_W);
    expect(result?.y).toBeCloseTo(FIELD_H);
  });
});

describe("clientYToFieldY", () => {
  it("above field.top → clamped to 0", () => {
    const field = { left: 100, top: 50, width: 1600, height: 900 };
    expect(clientYToFieldY(0, field)).toBeCloseTo(0);
    expect(clientYToFieldY(49, field)).toBeCloseTo(0);
  });

  it("below field bottom → clamped to FIELD_H", () => {
    const field = { left: 100, top: 50, width: 1600, height: 900 };
    expect(clientYToFieldY(950 + 1, field)).toBeCloseTo(FIELD_H);
    expect(clientYToFieldY(9999, field)).toBeCloseTo(FIELD_H);
  });

  it("midpoint → FIELD_H/2", () => {
    const field = { left: 100, top: 50, width: 1600, height: 900 };
    // midpoint clientY = 50 + 450 = 500
    expect(clientYToFieldY(500, field)).toBeCloseTo(FIELD_H / 2);
  });
});

describe("zoneAt", () => {
  it("point left of field → 'left'", () => {
    const layout = computeLayout(2000, 900);
    // field.left = 200, so clientX=100 is left
    expect(zoneAt(100, 450, layout)).toBe("left");
  });

  it("point right of field → 'right'", () => {
    const layout = computeLayout(2000, 900);
    // field.left+width = 1800, so clientX=1900 is right
    expect(zoneAt(1900, 450, layout)).toBe("right");
  });

  it("point inside field → 'field'", () => {
    const layout = computeLayout(2000, 900);
    // center of field
    expect(zoneAt(1000, 450, layout)).toBe("field");
  });

  it("point above field but in field x-range → 'outside'", () => {
    // portrait: field doesn't fill full height
    const layout = computeLayout(900, 1600);
    const field = layout.field;
    // x is within field range, y is above field top
    if (field.top > 0) {
      expect(zoneAt(field.left + 10, field.top - 10, layout)).toBe("outside");
    }
  });

  it("point below field but in field x-range → 'outside'", () => {
    const layout = computeLayout(900, 1600);
    const field = layout.field;
    if (field.top + field.height < 1600) {
      expect(zoneAt(field.left + 10, field.top + field.height + 10, layout)).toBe("outside");
    }
  });
});
