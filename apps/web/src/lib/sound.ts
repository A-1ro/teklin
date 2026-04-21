// ---------------------------------------------------------------------------
// Sound effects — Web Audio API, zero dependencies
// ---------------------------------------------------------------------------

export type SoundType =
  | "correct"
  | "incorrect"
  | "complete"
  | "newRecord"
  | "flip"
  | "success";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  opts?: {
    type?: OscillatorType;
    gain?: number;
    delay?: number;
    detune?: number;
  },
) {
  const ac = getCtx();
  const t = ac.currentTime + (opts?.delay ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();

  osc.type = opts?.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (opts?.detune) osc.detune.setValueAtTime(opts.detune, t);

  g.gain.setValueAtTime(opts?.gain ?? 0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/** Play a UI sound effect. Fails silently if audio is unavailable. */
export function playSound(type: SoundType): void {
  try {
    switch (type) {
      // Quick ascending two-tone chime
      case "correct":
        tone(523.25, 0.15, { gain: 0.18 });
        tone(659.25, 0.22, { gain: 0.2, delay: 0.08 });
        break;

      // Gentle descending two-tone (subtle, non-punishing)
      case "incorrect":
        tone(311.13, 0.2, { type: "triangle", gain: 0.1 });
        tone(277.18, 0.18, { type: "triangle", gain: 0.08, delay: 0.08 });
        break;

      // Four-note ascending fanfare
      case "complete":
        tone(523.25, 0.14, { gain: 0.18 });
        tone(659.25, 0.14, { gain: 0.18, delay: 0.1 });
        tone(783.99, 0.14, { gain: 0.18, delay: 0.2 });
        tone(1046.5, 0.4, { gain: 0.22, delay: 0.3 });
        break;

      // Sparkle — staggered high notes with shimmer
      case "newRecord":
        tone(1318.5, 0.25, { gain: 0.12 });
        tone(1568.0, 0.25, { gain: 0.12, delay: 0.08 });
        tone(1975.5, 0.25, { gain: 0.14, delay: 0.16 });
        tone(2637.0, 0.45, { gain: 0.16, delay: 0.24 });
        tone(1318.5, 0.2, { gain: 0.06, delay: 0.04, detune: 12 });
        tone(1975.5, 0.2, { gain: 0.06, delay: 0.2, detune: -12 });
        break;

      // Quick pop for card flip
      case "flip":
        tone(900, 0.04, { gain: 0.08 });
        tone(1400, 0.03, { gain: 0.06, delay: 0.015 });
        break;

      // Clean chime with harmonic
      case "success":
        tone(783.99, 0.28, { gain: 0.18 });
        tone(1567.98, 0.18, { gain: 0.06, delay: 0.015 });
        break;
    }
  } catch {
    // Audio is non-critical — fail silently
  }
}
