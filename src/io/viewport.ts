import { FIELD_H, FIELD_W } from "../config";
import { clampScalar } from "../sim/vec";

export type Orientation = "landscape" | "portrait";

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Layout {
  orientation: Orientation;
  field: Rect;
  leftGutter: Rect;
  rightGutter: Rect;
}

/** Layout: 16:9-veld op hoogte gepast, gecentreerd, met GEGARANDEERDE minimale gutters. */
export function computeLayout(viewportW: number, viewportH: number, gutterMin = 56): Layout {
  const orientation: Orientation = viewportH > viewportW ? "portrait" : "landscape";

  const maxFieldW = Math.max(0, viewportW - 2 * gutterMin);
  let fieldW = (viewportH * 16) / 9;
  if (fieldW > maxFieldW) fieldW = maxFieldW;
  let fieldH = (fieldW * 9) / 16;
  if (fieldH > viewportH) {
    fieldH = viewportH;
    fieldW = (fieldH * 16) / 9;
  }

  const left = (viewportW - fieldW) / 2;
  const top = (viewportH - fieldH) / 2;

  const field: Rect = { left, top, width: fieldW, height: fieldH };
  const leftGutter: Rect = { left: 0, top: 0, width: left, height: viewportH };
  const rightGutter: Rect = {
    left: left + fieldW,
    top: 0,
    width: viewportW - (left + fieldW),
    height: viewportH,
  };

  return { orientation, field, leftGutter, rightGutter };
}

/** clientX/clientY → veld-coords {x:0..FIELD_W, y:0..FIELD_H}; null als buiten het veld-rect. */
export function clientToField(
  clientX: number,
  clientY: number,
  field: Rect,
): { x: number; y: number } | null {
  if (
    clientX < field.left ||
    clientX > field.left + field.width ||
    clientY < field.top ||
    clientY > field.top + field.height
  ) {
    return null;
  }
  const x = clampScalar(((clientX - field.left) / field.width) * FIELD_W, 0, FIELD_W);
  const y = clampScalar(((clientY - field.top) / field.height) * FIELD_H, 0, FIELD_H);
  return { x, y };
}

/** clientY → target paddle-y in veld-coords (0..FIELD_H), geklemd. Voor gutter-slepen. */
export function clientYToFieldY(clientY: number, field: Rect): number {
  return clampScalar(((clientY - field.top) / field.height) * FIELD_H, 0, FIELD_H);
}

/** zone-classificatie van een punt. */
export function zoneAt(
  clientX: number,
  clientY: number,
  layout: Layout,
): "left" | "right" | "field" | "outside" {
  const { field } = layout;
  if (clientX < field.left) return "left";
  if (clientX >= field.left + field.width) return "right";
  if (clientY >= field.top && clientY <= field.top + field.height) {
    return "field";
  }
  return "outside";
}
