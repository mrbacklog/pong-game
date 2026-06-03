import {
  AI_TUNING,
  BALL_RADIUS,
  BALL_START_SPEED,
  FIELD_H,
  FIELD_W,
  P1_X,
  P2_X,
  PADDLE_H,
  PADDLE_SPEED,
  SERVE_DELAY,
} from "../config";
import type { Ball, GameState, InputState, Settings, SimEvents } from "../types";
import { aiPaddleDir } from "./ai";
import { serveBall, stepBall } from "./ball";
import { ballPaddleCollision } from "./collision";
import { stepPaddle } from "./paddle";
import type { Rng } from "./rng";

export function initGameState(settings: Settings, rng: Rng): GameState {
  return {
    ball: serveBall(1, rng),
    p1: { x: P1_X, y: (FIELD_H - PADDLE_H) / 2, dir: 0 },
    p2: { x: P2_X, y: (FIELD_H - PADDLE_H) / 2, dir: 0 },
    score1: 0,
    score2: 0,
    serveDelay: SERVE_DELAY,
    serveToward: 1,
    settings,
    aiTargetY: FIELD_H / 2,
    aiCooldown: 0,
    aiCommitted: false,
    aiError: 0,
  };
}

const NO_EVENTS: SimEvents = { paddleHit: false, wallHit: false, scored: 0 };

/** ball at rest in the center during the score/serve delay; consumes no RNG.
 *  The actual serve (which draws from the RNG) happens once when the delay elapses. */
function restBall(): Ball {
  return {
    pos: { x: FIELD_W / 2, y: FIELD_H / 2 },
    vel: { x: 0, y: 0 },
    speed: BALL_START_SPEED,
    lastHitBy: 0,
  };
}

export function stepGame(
  state: GameState,
  inputs: InputState,
  dt: number,
  rng: Rng,
): { state: GameState; events: SimEvents } {
  // --- serve delay: freeze ball at center, only count down ---
  if (state.serveDelay > 0) {
    const serveDelay = state.serveDelay - dt;
    if (serveDelay > 0) {
      return { state: { ...state, serveDelay }, events: { ...NO_EVENTS } };
    }
    // delay just elapsed: launch the pending serve.
    return {
      state: { ...state, serveDelay: 0, ball: serveBall(state.serveToward, rng) },
      events: { ...NO_EVENTS },
    };
  }

  const events: SimEvents = { paddleHit: false, wallHit: false, scored: 0 };

  // --- P1 (always human) ---
  const p1 = stepPaddle({ ...state.p1, dir: inputs.p1Dir }, PADDLE_SPEED, dt);

  // --- P2 (human in 2p, AI in 1p) ---
  let p2 = state.p2;
  let aiTargetY = state.aiTargetY;
  let aiCooldown = state.aiCooldown;
  let aiCommitted = state.aiCommitted;
  let aiError = state.aiError;
  if (state.settings.mode === "1p") {
    const ai = aiPaddleDir({
      ball: state.ball,
      paddleY: state.p2.y,
      difficulty: state.settings.difficulty,
      prevTargetY: state.aiTargetY,
      cooldown: state.aiCooldown,
      committed: state.aiCommitted,
      error: state.aiError,
      rng,
    });
    aiTargetY = ai.targetY;
    aiCooldown = Math.max(0, ai.cooldown - dt);
    aiCommitted = ai.committed;
    aiError = ai.error;
    const aiSpeed = PADDLE_SPEED * AI_TUNING[state.settings.difficulty].maxSpeed;
    p2 = stepPaddle({ ...state.p2, dir: ai.dir }, aiSpeed, dt);
  } else {
    p2 = stepPaddle({ ...state.p2, dir: inputs.p2Dir }, PADDLE_SPEED, dt);
  }

  // --- ball move + wall bounce ---
  const moved = stepBall(state.ball, dt);
  let ball = moved.ball;
  if (moved.wallHit) events.wallHit = true;

  // --- paddle collisions ---
  const hit1 = ballPaddleCollision(ball, p1, 1);
  if (hit1) {
    ball = hit1;
    events.paddleHit = true;
  } else {
    const hit2 = ballPaddleCollision(ball, p2, 2);
    if (hit2) {
      ball = hit2;
      events.paddleHit = true;
    }
  }

  // --- scoring ---
  let score1 = state.score1;
  let score2 = state.score2;
  let serveDelay = 0;
  let serveToward = state.serveToward;
  if (ball.pos.x < -BALL_RADIUS) {
    score2 += 1;
    events.scored = 2;
    serveToward = 1; // serve toward the loser
    serveDelay = SERVE_DELAY;
    ball = restBall();
  } else if (ball.pos.x > FIELD_W + BALL_RADIUS) {
    score1 += 1;
    events.scored = 1;
    serveToward = 2;
    serveDelay = SERVE_DELAY;
    ball = restBall();
  }

  return {
    state: {
      ...state,
      ball,
      p1,
      p2,
      score1,
      score2,
      serveDelay,
      serveToward,
      aiTargetY,
      aiCooldown,
      aiCommitted,
      aiError,
    },
    events,
  };
}
