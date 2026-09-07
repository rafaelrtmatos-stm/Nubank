// Simple synthesized notification sound for Pix receive
export function playPixNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Create a 2-tone pleasant bank notification chime (similar to mobile push sound)
    // Tone 1: E6 (1318.51 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now); // C6
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08); // E6

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: G6 (1567.98 Hz) delayed slightly
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1567.98, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(2093.0, now + 0.22); // C7

    gain2.gain.setValueAtTime(0.001, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.warn('AudioContext not allowed without user interaction yet', e);
  }
}

// Crisp scanner confirmation beep for QR Code read
export function playQrBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6
    osc.frequency.setValueAtTime(2349.32, now + 0.05); // D7

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch (e) {
    console.warn('Audio beep error', e);
  }
}

