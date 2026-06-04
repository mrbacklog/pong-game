import { FIELD_H, FIELD_W, PALETTE } from "../config";
import type { InputMode } from "../io/input-mode";
import type { Machine } from "../scene/machine";
import { MENU_ROWS } from "../scene/machine";

export const MENU_TOP_Y = 320;
export const MENU_ROW_GAP = 64;

function overlay(ctx: CanvasRenderingContext2D, alpha: number): void {
  ctx.fillStyle = `rgba(10,10,20,${alpha})`;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
}

function title(ctx: CanvasRenderingContext2D, text: string, y: number): void {
  ctx.fillStyle = PALETTE.p1;
  ctx.shadowColor = PALETTE.p1;
  ctx.shadowBlur = 24;
  ctx.font = "800 96px ui-monospace, 'Segoe UI', monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, FIELD_W / 2, y);
  ctx.shadowBlur = 0;
}

export function drawMenu(
  ctx: CanvasRenderingContext2D,
  machine: Machine,
  inputMode: InputMode,
): void {
  overlay(ctx, 0.85);
  title(ctx, "PONG", 180);
  const s = machine.settings;
  const rows = [
    `MODE      < ${s.mode === "1p" ? "1P VS AI" : "2P LOCAL"} >`,
    `AI        < ${s.difficulty.toUpperCase()} >`,
    `FIRST TO  < ${s.matchLength} >`,
    `MUSIC     < ${s.musicOn ? "ON" : "OFF"} >`,
    "START",
  ];
  ctx.font = "600 36px ui-monospace, 'Segoe UI', monospace";
  for (let i = 0; i < rows.length; i++) {
    const active = i === machine.menuCursor;
    ctx.fillStyle = active ? PALETTE.ball : PALETTE.accent;
    ctx.shadowColor = active ? PALETTE.ball : "transparent";
    ctx.shadowBlur = active ? 16 : 0;
    ctx.fillText(rows[i] ?? "", FIELD_W / 2, MENU_TOP_Y + i * MENU_ROW_GAP);
  }
  ctx.shadowBlur = 0;
  // Keyboard hint only — on touch the rows are tappable and need no key legend.
  if (inputMode === "keyboard") {
    ctx.fillStyle = PALETTE.p2;
    ctx.font = "400 22px ui-monospace, 'Segoe UI', monospace";
    ctx.fillText(
      "W/S + ARROWS move · ARROWS change · ENTER select · M mute",
      FIELD_W / 2,
      FIELD_H - 60,
    );
  }
  // reference MENU_ROWS so the menu stays in sync with the machine row order.
  void MENU_ROWS;
}

export function drawPause(ctx: CanvasRenderingContext2D, inputMode: InputMode): void {
  overlay(ctx, 0.65);
  title(ctx, "PAUSED", FIELD_H / 2 - 60);
  // On touch the on-screen buttons (Hervat/Opnieuw/Menu) are the controls.
  if (inputMode === "keyboard") {
    ctx.fillStyle = PALETTE.accent;
    ctx.font = "500 32px ui-monospace, 'Segoe UI', monospace";
    ctx.textAlign = "center";
    ctx.fillText("ESC/P resume · ENTER restart · BACKSPACE menu", FIELD_W / 2, FIELD_H / 2 + 40);
  }
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  winner: 1 | 2,
  inputMode: InputMode,
): void {
  overlay(ctx, 0.85);
  ctx.fillStyle = winner === 1 ? PALETTE.p1 : PALETTE.p2;
  ctx.shadowColor = winner === 1 ? PALETTE.p1 : PALETTE.p2;
  ctx.shadowBlur = 24;
  ctx.font = "800 88px ui-monospace, 'Segoe UI', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`PLAYER ${winner} WINS`, FIELD_W / 2, FIELD_H / 2 - 20);
  ctx.shadowBlur = 0;
  if (inputMode === "keyboard") {
    ctx.fillStyle = PALETTE.accent;
    ctx.font = "500 32px ui-monospace, 'Segoe UI', monospace";
    ctx.fillText("ENTER rematch · BACKSPACE menu", FIELD_W / 2, FIELD_H / 2 + 60);
  }
}
