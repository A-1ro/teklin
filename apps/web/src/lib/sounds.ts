/**
 * Synthesized coin "charin" sound using Web Audio API.
 * No audio files needed — generated on the fly.
 */
export function playCharin(): void {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // 1st coin strike — short metallic ping
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(3200, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // 1st strike harmonic — metallic shimmer
    const osc1h = ctx.createOscillator();
    const gain1h = ctx.createGain();
    osc1h.connect(gain1h);
    gain1h.connect(ctx.destination);
    osc1h.type = "square";
    osc1h.frequency.setValueAtTime(6400, now);
    gain1h.gain.setValueAtTime(0.06, now);
    gain1h.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1h.start(now);
    osc1h.stop(now + 0.09);

    // 2nd coin strike — slightly higher, delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(4200, now + 0.1);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.3, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.32);

    // 2nd strike harmonic
    const osc2h = ctx.createOscillator();
    const gain2h = ctx.createGain();
    osc2h.connect(gain2h);
    gain2h.connect(ctx.destination);
    osc2h.type = "square";
    osc2h.frequency.setValueAtTime(8400, now + 0.1);
    gain2h.gain.setValueAtTime(0.0001, now);
    gain2h.gain.setValueAtTime(0.04, now + 0.1);
    gain2h.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2h.start(now + 0.1);
    osc2h.stop(now + 0.22);

    // Coin ring-out — gentle decay tail
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(3600, now + 0.12);
    gain3.gain.setValueAtTime(0.0001, now);
    gain3.gain.setValueAtTime(0.08, now + 0.12);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc3.start(now + 0.12);
    osc3.stop(now + 0.48);

    osc3.onended = () => ctx.close();
  } catch {
    // silently fail if AudioContext is unavailable
  }
}
