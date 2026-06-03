import { AI_TUNING, BALL_RADIUS, FIELD_H, P2_X, PADDLE_H } from "../config";
import type { AITuning } from "../config";
import type { Ball, Difficulty } from "../types";
import type { Rng } from "./rng";
import { clampScalar } from "./vec";

const PLAYABLE_TOP = BALL_RADIUS;
const PLAYABLE_BOTTOM = FIELD_H - BALL_RADIUS;
const PLAYABLE_H = PLAYABLE_BOTTOM - PLAYABLE_TOP;

/** predicted y where the ball crosses x=targetX, folding top/bottom wall bounces. */
export function predictInterceptY(ball: Ball, targetX: number): number {
  if (ball.vel.x === 0) return ball.pos.y;
  const t = (targetX - ball.pos.x) / ball.vel.x;
  if (t <= 0) return ball.pos.y; // ball moving away; no future crossing
  const rawY = ball.pos.y + ball.vel.y * t;
  // reflect rawY into [PLAYABLE_TOP, PLAYABLE_BOTTOM] via triangle-wave folding.
  const offset = rawY - PLAYABLE_TOP;
  const period = 2 * PLAYABLE_H;
  let m = ((offset % period) + period) % period;
  if (m > PLAYABLE_H) m = period - m;
  return PLAYABLE_TOP + m;
}

export interface AiInput {
  ball: Ball;
  paddleY: number;
  difficulty: Difficulty;
  prevTargetY: number;
  cooldown: number;
  /** whether the AI has already committed a read for the current approach. */
  committed: boolean;
  /** the committed +/- offset (px) from the true intercept for this approach. */
  error: number;
  rng: Rng;
}

export interface AiOutput {
  dir: -1 | 0 | 1;
  targetY: number;
  cooldown: number;
  committed: boolean;
  error: number;
}

/**
 * Roll the AI's "concentration" for one approach: with probability `focus` it reads
 * the ball correctly (small jitter), otherwise it has a lapse and commits to a clearly
 * wrong intercept. The result is latched for the whole approach so the AI genuinely
 * misjudges where the ball lands instead of averaging its error away over time.
 */
function rollConcentration(tuning: AITuning, rng: Rng): number {
  if (rng.next() < tuning.focus) {
    return (rng.next() * 2 - 1) * tuning.focusError * PADDLE_H;
  }
  const sign = rng.next() < 0.5 ? -1 : 1;
  return sign * tuning.lapseError * PADDLE_H;
}

/**
 * Compute the AI paddle direction for one tick.
 * `cooldown` counts seconds left until the AI acquires its target (reaction lag).
 * Note: this function does not advance the cooldown timer (step.ts decrements it).
 */
export function aiPaddleDir(input: AiInput): AiOutput {
  const tuning = AI_TUNING[input.difficulty];
  const paddleCenter = input.paddleY + PADDLE_H / 2;
  const movingToward = input.ball.vel.x > 0; // right paddle (P2)

  let targetY = input.prevTargetY;
  let cooldown = input.cooldown;
  let committed = input.committed;
  let error = input.error;

  if (!movingToward) {
    // ball heading away: drift back to center and forget this approach's read,
    // so the next approach gets a fresh concentration roll.
    targetY = FIELD_H / 2;
    committed = false;
  } else {
    if (!committed) {
      // new approach: roll concentration ONCE and commit it, then react.
      error = rollConcentration(tuning, input.rng);
      committed = true;
      cooldown = tuning.reactionMs / 1000;
    }
    if (cooldown <= 0) {
      // reaction elapsed: aim at the (mis)judged intercept and hold the committed error.
      const predicted = predictInterceptY(input.ball, P2_X);
      targetY = clampScalar(predicted + error, PLAYABLE_TOP, PLAYABLE_BOTTOM);
    }
  }

  const delta = targetY - paddleCenter;
  let dir: -1 | 0 | 1 = 0;
  if (Math.abs(delta) > tuning.deadZone) dir = delta > 0 ? 1 : -1;

  return { dir, targetY, cooldown, committed, error };
}
