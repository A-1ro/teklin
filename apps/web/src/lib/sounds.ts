/**
 * Synthesized coin "charin" sound using Web Audio API.
 * No audio files needed — generated on the fly.
 */
export function playCharin(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // High strike tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(2400, now);
    osc1.frequency.exponentialRampToValueAtTime(900, now + 0.18);
    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Harmonic undertone for body
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.22);
    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.start(now);
    osc2.stop(now + 0.48);

    osc2.onended = () => ctx.close();
  } catch {
    // silently fail if AudioContext is unavailable
  }
}
