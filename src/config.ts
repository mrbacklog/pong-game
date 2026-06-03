import type { Difficulty } from "./types";

export const FIELD_W = 1280;
export const FIELD_H = 720;

export const PADDLE_W = 16;
export const PADDLE_H = 110;
export const PADDLE_MARGIN = 48;
export const PADDLE_SPEED = 900; // px/s for a human at full press

export const P1_X = PADDLE_MARGIN;
export const P2_X = FIELD_W - PADDLE_MARGIN - PADDLE_W;

export const BALL_RADIUS = 10;
export const BALL_START_SPEED = 540;
export const BALL_SPEED_UP = 1.04;
export const BALL_SPEED_CAP = 1100;
/** guarantee the serve/reflection is never too vertical: |vx| >= this * speed. */
export const MIN_VX_FRACTION = 0.45;
/** max outgoing reflection angle off paddle center, radians (~60deg). */
export const MAX_REFLECT_ANGLE = (60 * Math.PI) / 180;

export const SERVE_DELAY = 0.6; // seconds
export const DEFAULT_MATCH_LENGTH = 7;
export const MATCH_LENGTH_OPTIONS = [3, 5, 7, 11] as const;

export const SIM_DT = 1 / 120; // fixed sim timestep, seconds

export interface AITuning {
  /** fraction of PADDLE_SPEED. */
  maxSpeed: number;
  /** initial reaction lag at the start of each approach, ms. */
  reactionMs: number;
  /** px dead zone around target before moving. */
  deadZone: number;
  /**
   * probability the AI reads the ball correctly this approach. With probability
   * 1 - focus it has a concentration lapse and commits to a wrong intercept,
   * holding that misjudgment until the ball resets (it does not silently correct).
   */
  focus: number;
  /** when focused, small +/- target jitter in paddle-heights (still catchable). */
  focusError: number;
  /** on a lapse, committed +/- offset from the true intercept in paddle-heights. */
  lapseError: number;
}

export const AI_TUNING: Record<Difficulty, AITuning> = {
  easy: {
    maxSpeed: 0.62,
    reactionMs: 240,
    deadZone: 30,
    focus: 0.45,
    focusError: 0.25,
    lapseError: 1.4,
  },
  normal: {
    maxSpeed: 0.82,
    reactionMs: 130,
    deadZone: 18,
    focus: 0.72,
    focusError: 0.15,
    lapseError: 1.0,
  },
  hard: {
    maxSpeed: 0.97,
    reactionMs: 60,
    deadZone: 8,
    focus: 0.94,
    focusError: 0.06,
    lapseError: 0.7,
  },
};

export const PALETTE = {
  bg: "#0a0a14",
  p1: "#22d3ee",
  p2: "#f472b6",
  ball: "#fef9c3",
  accent: "#a855f7",
} as const;

/** trail ring-buffer length. */
export const TRAIL_LENGTH = 18;
