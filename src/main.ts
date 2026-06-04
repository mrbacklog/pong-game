import { FIELD_H, FIELD_W, PADDLE_H } from "./config";
import { createAudioManager } from "./io/audio";
import { createInputManager } from "./io/input";
import { createInputModeTracker } from "./io/input-mode";
import { createLoop } from "./io/loop";
import { createShell } from "./io/shell";
import { type TouchFrame, createTouchManager } from "./io/touch";
import { initEffects, stepEffects } from "./render/effects";
import { drawGameOver, drawMenu, drawPause } from "./render/menu";
import { draw } from "./render/renderer";
import type { Machine } from "./scene/machine";
import { initMachine, pauseHasPriority, reduceMachine } from "./scene/machine";
import { mulberry32 } from "./sim/rng";
import { isMatchOver, winnerOf } from "./sim/score";
import { initGameState, stepGame } from "./sim/step";
import type { GameState, InputState } from "./types";

/** Merge keyboard + touch + on-screen-button inputs into one InputState for the tick.
 *  Keyboard direction wins when held; edge actions OR together; menuSelect is touch-only. */
function mergeInputs(
  kb: InputState,
  t: TouchFrame,
  pend: { pause: boolean; confirm: boolean; back: boolean },
): InputState {
  return {
    ...kb,
    p1Dir: kb.p1Dir !== 0 ? kb.p1Dir : t.p1Dir,
    p2Dir: kb.p2Dir !== 0 ? kb.p2Dir : t.p2Dir,
    confirm: kb.confirm || t.confirm || pend.confirm,
    pause: kb.pause || pend.pause,
    back: kb.back || pend.back,
    navLeft: kb.navLeft || t.navLeft,
    navRight: kb.navRight || t.navRight,
    menuSelect: t.menuSelect,
  };
}

function bootstrap(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("missing #game canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  canvas.width = FIELD_W;
  canvas.height = FIELD_H;

  const input = createInputManager();
  const audio = createAudioManager();
  const rng = mulberry32(Date.now() >>> 0);

  // mobile display shell (positions canvas + gutters) and touch input on the shell element.
  const shellEl = document.getElementById("shell");
  if (!shellEl) throw new Error("missing #shell");
  const shell = createShell();
  shell.applyLayout();
  const onResize = (): void => shell.applyLayout();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  const touch = createTouchManager(shellEl);
  const inputMode = createInputModeTracker();

  let machine: Machine = initMachine();
  let game: GameState = initGameState(machine.settings, rng);
  let effects = initEffects();
  let prevScene = machine.scene;

  // first user gesture resumes audio (autoplay policy).
  const resumeAudio = (): void => audio.resume();
  window.addEventListener("keydown", resumeAudio, { once: true });
  window.addEventListener("pointerdown", resumeAudio, { once: true });

  function simTick(dt: number): void {
    const inputs = mergeInputs(
      input.sample(),
      touch.sample(
        machine.scene,
        machine.settings.mode,
        game.p1.y + PADDLE_H / 2,
        game.p2.y + PADDLE_H / 2,
      ),
      shell.samplePending(),
    );

    if (inputs.mute) audio.toggleMuted();

    // capture the scene before reducing so transition handling can see where we came from.
    const fromMachine = machine;

    // PLAYING: advance the sim, detect match-over.
    if (machine.scene === "playing") {
      const result = stepGame(game, inputs, dt, rng);
      game = result.state;
      audio.playEvents(result.events, game.ball.speed);
      effects = stepEffects(effects, game, result.events, dt);
      const over = isMatchOver(game.score1, game.score2, game.settings.matchLength);
      machine = reduceMachine(machine, inputs, over);
      if (over) machine = { ...machine, winner: winnerOf(game.score1, game.score2) };
    } else {
      machine = reduceMachine(machine, inputs);
    }

    // handle scene entry transitions (reset state).
    if (machine.scene !== prevScene) {
      // entering play from menu/gameover starts a fresh match.
      if (machine.scene === "playing" && (prevScene === "menu" || prevScene === "gameover")) {
        audio.setMusicOn(machine.settings.musicOn);
        game = initGameState(machine.settings, rng);
        effects = initEffects();
      }
      // confirm-from-paused = restart (reset); a pause-toggle resume keeps state.
      // when both resume and restart fire in the same tick, resume wins, so we
      // must NOT reset the running match.
      if (
        machine.scene === "playing" &&
        prevScene === "paused" &&
        inputs.confirm &&
        !pauseHasPriority(fromMachine, inputs)
      ) {
        game = initGameState(machine.settings, rng);
        effects = initEffects();
      }
      prevScene = machine.scene;
    }
  }

  function render(): void {
    shell.update(machine.scene, machine.settings.mode);
    draw(ctx as CanvasRenderingContext2D, game, effects);
    const mode = inputMode.get();
    if (machine.scene === "menu") {
      drawMenu(ctx as CanvasRenderingContext2D, machine, mode);
    } else if (machine.scene === "paused") {
      drawPause(ctx as CanvasRenderingContext2D, mode);
    } else if (machine.scene === "gameover" && machine.winner !== 0) {
      drawGameOver(ctx as CanvasRenderingContext2D, machine.winner, mode);
    }
  }

  createLoop(simTick, render).start();
}

bootstrap();
