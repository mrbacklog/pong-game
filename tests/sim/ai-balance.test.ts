import { describe, expect, it } from "vitest";
import {
  BALL_RADIUS,
  FIELD_H,
  MAX_REFLECT_ANGLE,
  P1_X,
  PADDLE_H,
  PADDLE_W,
  SIM_DT,
} from "../../src/config";
import { serveBall } from "../../src/sim/ball";
import { mulberry32 } from "../../src/sim/rng";
import { initGameState, stepGame } from "../../src/sim/step";
import type { Ball, Difficulty, GameState, InputState, Settings } from "../../src/types";

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

type Rng = ReturnType<typeof mulberry32>;

/**
 * Step one defensive trial: a ball is heading toward the AI (P2). Return true if the
 * AI intercepts it (its paddle flips the ball back), false if the ball passes the AI
 * (a real positional misjudgment — the thing a player exploits to win a point).
 */
function aiDefends(start: GameState, rng: Rng): boolean {
  let state = start;
  for (let t = 0; t < 4000; t++) {
    const before = state.ball.vel.x;
    const { state: next, events } = stepGame(state, noInput, SIM_DT, rng);
    state = next;
    if (events.scored === 1) return false; // ball passed the AI → whiff
    if (events.scored === 2) return true; // AI returned, idle P1 eventually missed
    if (before > 0 && state.ball.vel.x < 0) return true; // AI flipped the ball back
  }
  return true; // inconclusive: don't count as a whiff
}

/** the opening shot of a point: ball from center, base speed, untouched (lastHitBy 0). */
function serveBallToward(rng: Rng): Ball {
  return serveBall(2, rng);
}

/** a rally ball: off the player's paddle, sped up, steeper angle, already hit (lastHitBy 1). */
function rallyBallToward(rng: Rng): Ball {
  const speed = 700 + rng.next() * 400; // 700..1100 (a rally has accelerated)
  const angle = (rng.next() * 2 - 1) * MAX_REFLECT_ANGLE;
  const x = P1_X + PADDLE_W + BALL_RADIUS + 20;
  const y = BALL_RADIUS + rng.next() * (FIELD_H - 2 * BALL_RADIUS);
  return {
    pos: { x, y },
    vel: { x: speed * Math.cos(angle), y: speed * Math.sin(angle) },
    speed,
    lastHitBy: 1,
  };
}

/** fraction of independent approaches the AI fails to intercept, for a ball generator. */
function whiffRate(
  difficulty: Difficulty,
  makeBall: (rng: Rng) => Ball,
  seed: number,
  trials = 200,
) {
  const settings: Settings = { mode: "1p", difficulty, matchLength: 999, musicOn: false };
  const rng = mulberry32(seed);
  let state = initGameState(settings, rng);
  let whiffs = 0;
  for (let i = 0; i < trials; i++) {
    state = {
      ...state,
      ball: makeBall(rng),
      p1: { ...state.p1, y: (FIELD_H - PADDLE_H) / 2, dir: 0 },
      p2: { ...state.p2, y: rng.next() * (FIELD_H - PADDLE_H), dir: 0 },
      serveDelay: 0,
      serveToward: 2,
      aiTargetY: FIELD_H / 2,
      aiCooldown: 0,
      aiCommitted: false,
      aiError: 0,
    };
    if (!aiDefends(state, rng)) whiffs++;
  }
  return whiffs / trials;
}

/** average across seeds for stability. */
function whiff(difficulty: Difficulty, makeBall: (rng: Rng) => Ball): number {
  const seeds = [1, 7, 42, 1337, 90210];
  return seeds.reduce((a, s) => a + whiffRate(difficulty, makeBall, s), 0) / seeds.length;
}

describe("AI reads serves reliably; difficulty lives in rallies", () => {
  const serve = {
    easy: whiff("easy", serveBallToward),
    normal: whiff("normal", serveBallToward),
    hard: whiff("hard", serveBallToward),
  };
  const rally = {
    easy: whiff("easy", rallyBallToward),
    normal: whiff("normal", rallyBallToward),
    hard: whiff("hard", rallyBallToward),
  };

  // The opening serve (ball straight from center, slow, full reaction time) is the most
  // readable ball in the game — no level should flub it. A lapse belongs in a rally.
  it("every level reads the center serve reliably (no free serve whiffs)", () => {
    expect(serve.easy).toBeLessThan(0.05);
    expect(serve.normal).toBeLessThan(0.05);
    expect(serve.hard).toBeLessThan(0.05);
  });

  it("easy is genuinely beatable in rallies (casual player can win points)", () => {
    expect(rally.easy).toBeGreaterThan(0.35);
  });

  it("easy is not hopeless either (still returns a fair share)", () => {
    expect(rally.easy).toBeLessThan(0.75);
  });

  it("hard stays sharp and rarely misjudges a rally ball", () => {
    expect(rally.hard).toBeLessThan(0.12);
  });

  it("rally difficulty is monotonic: easy misjudges more than normal more than hard", () => {
    expect(rally.easy).toBeGreaterThan(rally.normal + 0.1);
    expect(rally.normal).toBeGreaterThan(rally.hard + 0.05);
  });
});
