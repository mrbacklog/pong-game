import { describe, expect, it } from "vitest";
import { BALL_RADIUS, FIELD_H, P2_X } from "../../src/config";
import { aiPaddleDir, predictInterceptY } from "../../src/sim/ai";
import { mulberry32 } from "../../src/sim/rng";
import type { Ball } from "../../src/types";

function ball(x: number, y: number, vx: number, vy: number): Ball {
  return { pos: { x, y }, vel: { x: vx, y: vy }, speed: Math.hypot(vx, vy), lastHitBy: 1 };
}

describe("predictInterceptY", () => {
  it("predicts a straight horizontal ball at the same y", () => {
    const y = predictInterceptY(ball(200, 360, 300, 0), P2_X);
    expect(y).toBeCloseTo(360, 1);
  });

  it("folds a downward ball off the bottom wall back into the field", () => {
    const y = predictInterceptY(ball(200, 700, 300, 600), P2_X);
    expect(y).toBeGreaterThanOrEqual(BALL_RADIUS);
    expect(y).toBeLessThanOrEqual(FIELD_H - BALL_RADIUS);
  });
});

describe("aiPaddleDir", () => {
  it("hard tracks toward the target (moves down when target is below center)", () => {
    const { dir } = aiPaddleDir({
      ball: ball(200, 600, 300, 0),
      paddleY: 100,
      difficulty: "hard",
      prevTargetY: 600,
      cooldown: 0,
      committed: true,
      error: 0,
      rng: mulberry32(1),
    });
    expect(dir).toBe(1);
  });

  it("does not move inside the dead zone", () => {
    const { dir } = aiPaddleDir({
      ball: ball(200, 360, 300, 0),
      paddleY: 360 - 110 / 2, // center == target
      difficulty: "hard",
      prevTargetY: 360,
      cooldown: 0,
      committed: true,
      error: 0,
      rng: mulberry32(1),
    });
    expect(dir).toBe(0);
  });

  it("drifts back toward field center when the ball moves away", () => {
    const { dir } = aiPaddleDir({
      ball: ball(200, 360, -300, 0), // moving away from right paddle
      paddleY: 0, // top → center is below → drift down
      difficulty: "normal",
      prevTargetY: 360,
      cooldown: 0,
      committed: true,
      error: 0,
      rng: mulberry32(1),
    });
    expect(dir).toBe(1);
  });

  it("holds the old target while cooldown has not elapsed (reaction time)", () => {
    const out = aiPaddleDir({
      ball: ball(200, 50, 300, 0), // new prediction near top
      paddleY: 400, // center 455, above the old target → would move down
      difficulty: "easy",
      prevTargetY: 650, // old target below paddle center → would move down
      cooldown: 0.2, // not yet ready to recompute
      committed: true,
      error: 0,
      rng: mulberry32(1),
    });
    expect(out.targetY).toBe(650); // kept old target
    expect(out.dir).toBe(1); // moves toward old target (down)
  });
});
