import { describe, expect, it } from "vitest";
import { FIELD_H, PADDLE_H, SIM_DT } from "../../src/config";
import { serveBall } from "../../src/sim/ball";
import { mulberry32 } from "../../src/sim/rng";
import { initGameState, stepGame } from "../../src/sim/step";
import type { Difficulty, GameState, InputState, Settings } from "../../src/types";

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

/**
 * Step one defensive trial: a ball is already heading toward the AI (P2). Return
 * true if the AI intercepts it (its paddle hit flips the ball back), false if the
 * ball passes the AI (a positional misjudgment — the thing a real player exploits).
 */
function aiDefends(start: GameState, rng: ReturnType<typeof mulberry32>): boolean {
  let state = start;
  for (let t = 0; t < 4000; t++) {
    const before = state.ball.vel.x;
    const { state: next, events } = stepGame(state, noInput, SIM_DT, rng);
    state = next;
    if (events.scored === 1) return false; // ball passed the AI → whiff
    if (events.scored === 2) return true; // AI returned, P1 (idle) eventually missed
    if (before > 0 && state.ball.vel.x < 0) return true; // AI paddle flipped the ball back
  }
  return true; // inconclusive: don't count as a whiff
}

/** fraction of independent serves the AI fails to intercept, given its difficulty. */
function aiWhiffRate(difficulty: Difficulty, seed: number, trials = 200): number {
  const settings: Settings = { mode: "1p", difficulty, matchLength: 999, musicOn: false };
  const rng = mulberry32(seed);
  let state = initGameState(settings, rng);
  let whiffs = 0;
  for (let i = 0; i < trials; i++) {
    // fresh serve toward the AI from a random paddle position; reset AI memory.
    state = {
      ...state,
      ball: serveBall(2, rng),
      p1: { ...state.p1, y: (FIELD_H - PADDLE_H) / 2, dir: 0 },
      p2: { ...state.p2, y: rng.next() * (FIELD_H - PADDLE_H), dir: 0 },
      serveDelay: 0,
      serveToward: 2,
      aiTargetY: FIELD_H / 2,
      aiCooldown: 0,
    };
    if (!aiDefends(state, rng)) whiffs++;
  }
  return whiffs / trials;
}

/** average across seeds for stability. */
function whiff(difficulty: Difficulty): number {
  const seeds = [1, 7, 42, 1337, 90210];
  const rates = seeds.map((s) => aiWhiffRate(difficulty, s));
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

describe("AI makes real positional misjudgments, scaled by difficulty", () => {
  const easy = whiff("easy");
  const normal = whiff("normal");
  const hard = whiff("hard");

  it("easy genuinely misjudges the ball often (beatable by a casual player)", () => {
    expect(easy).toBeGreaterThan(0.35);
  });

  it("easy is not hopeless either (still returns a fair share)", () => {
    expect(easy).toBeLessThan(0.75);
  });

  it("hard stays sharp and rarely misjudges", () => {
    expect(hard).toBeLessThan(0.12);
  });

  it("difficulty is monotonic: easy misjudges more than normal more than hard", () => {
    expect(easy).toBeGreaterThan(normal + 0.1);
    expect(normal).toBeGreaterThan(hard + 0.05);
  });
});
