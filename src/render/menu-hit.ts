import { FIELD_W } from "../config";
import { MENU_ROWS } from "../scene/machine";
import { MENU_ROW_GAP, MENU_TOP_Y } from "./menu";

export interface MenuHit {
  row: number;
  action: "left" | "right" | "confirm";
}

/** veld-coords (x:0..FIELD_W, y:0..FIELD_H) → welke menu-rij + actie, of null. Puur. */
export function menuHitTest(fieldX: number, fieldY: number): MenuHit | null {
  for (let i = 0; i < MENU_ROWS.length; i++) {
    const baseline = MENU_TOP_Y + i * MENU_ROW_GAP;
    const bandTop = baseline - MENU_ROW_GAP * 0.6;
    const bandBottom = baseline + MENU_ROW_GAP * 0.4;
    if (fieldY >= bandTop && fieldY <= bandBottom) {
      if (i === MENU_ROWS.length - 1) {
        return { row: i, action: "confirm" };
      }
      const action = fieldX < FIELD_W / 2 ? "left" : "right";
      return { row: i, action };
    }
  }
  return null;
}
