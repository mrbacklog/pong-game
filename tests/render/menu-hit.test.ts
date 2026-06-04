import { describe, expect, it } from "vitest";
import { FIELD_W } from "../../src/config";
import { MENU_ROW_GAP, MENU_TOP_Y } from "../../src/render/menu";
import { menuHitTest } from "../../src/render/menu-hit";

describe("menuHitTest", () => {
  // row 0 baseline = MENU_TOP_Y + 0 * MENU_ROW_GAP = 320
  it("tap in band of row 0 on the left side → {row:0, action:'left'}", () => {
    const y = MENU_TOP_Y; // exactly on baseline of row 0
    const x = FIELD_W / 2 - 100; // left of center
    expect(menuHitTest(x, y)).toEqual({ row: 0, action: "left" });
  });

  it("tap in band of row 0 on the right side → {row:0, action:'right'}", () => {
    const y = MENU_TOP_Y; // exactly on baseline of row 0
    const x = FIELD_W / 2 + 100; // right of center
    expect(menuHitTest(x, y)).toEqual({ row: 0, action: "right" });
  });

  it("tap in band of START row (row 4) in the middle → {row:4, action:'confirm'}", () => {
    const startRow = 4;
    const y = MENU_TOP_Y + startRow * MENU_ROW_GAP; // baseline of row 4
    const x = FIELD_W / 2; // center
    expect(menuHitTest(x, y)).toEqual({ row: 4, action: "confirm" });
  });

  it("y outside all bands → null", () => {
    // y well above row 0's band
    expect(menuHitTest(FIELD_W / 2, 0)).toBeNull();
    // y well below last row's band
    expect(menuHitTest(FIELD_W / 2, 9999)).toBeNull();
  });

  it("tap just inside top of row 0 band → hit", () => {
    // band top = baseline - MENU_ROW_GAP * 0.6 = 320 - 38.4 = 281.6
    const y = MENU_TOP_Y - MENU_ROW_GAP * 0.6 + 1;
    expect(menuHitTest(FIELD_W / 2 - 1, y)).toEqual({ row: 0, action: "left" });
  });

  it("tap just above top of row 0 band → null", () => {
    // exactly at band top (not inside open interval) — below the top boundary
    const y = MENU_TOP_Y - MENU_ROW_GAP * 0.6 - 1;
    expect(menuHitTest(FIELD_W / 2, y)).toBeNull();
  });
});
