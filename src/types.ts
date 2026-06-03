export interface Vec2 {
  x: number;
  y: number;
}

export type Difficulty = "easy" | "normal" | "hard";
export type Mode = "1p" | "2p";
export type Scene = "menu" | "playing" | "paused" | "gameover";

export interface Settings {
  mode: Mode;
  difficulty: Difficulty;
  matchLength: number;
  musicOn: boolean;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  speed: number;
  /** 0 = none yet, 1 = P1, 2 = P2; tints ball/trail. */
  lastHitBy: 0 | 1 | 2;
}

export interface Paddle {
  /** fixed left edge x */
  x: number;
  /** top y, clamped to field */
  y: number;
  /** -1 up, 0 still, +1 down requested this tick */
  dir: -1 | 0 | 1;
}

export interface GameState {
  ball: Ball;
  p1: Paddle;
  p2: Paddle;
  score1: number;
  score2: number;
  /** seconds remaining before the next serve; >0 means ball is frozen at center. */
  serveDelay: number;
  /** which player to serve toward next (1 or 2). */
  serveToward: 1 | 2;
  settings: Settings;
  /** carried AI state for reaction-time gating (1p only). */
  aiTargetY: number;
  aiCooldown: number;
  /** whether the AI has committed its read for the current approach. */
  aiCommitted: boolean;
  /** the committed +/- intercept misjudgment (px) for the current approach. */
  aiError: number;
}

/** per-tick directional inputs and edge-triggered menu actions. */
export interface InputState {
  p1Dir: -1 | 0 | 1;
  p2Dir: -1 | 0 | 1;
  // edge-triggered (true only on the tick the key went down)
  confirm: boolean;
  pause: boolean;
  back: boolean;
  mute: boolean;
  navUp: boolean;
  navDown: boolean;
  navLeft: boolean;
  navRight: boolean;
}

/** events the pure sim emits for the IO shell (audio/juice) to react to. */
export interface SimEvents {
  paddleHit: boolean;
  wallHit: boolean;
  /** 0 = none, 1 = P1 scored, 2 = P2 scored */
  scored: 0 | 1 | 2;
}

export interface TrailPoint {
  x: number;
  y: number;
}

export interface EffectsState {
  trail: TrailPoint[];
  flash: number;
  shake: number;
}
