// Web Audio API Synthesizer for Antarctic Station Mission Control Sound FX
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenInterval = null;
    this.isSirenPlaying = false;
    this.attachAutoUnlock();
  }

  attachAutoUnlock() {
    if (typeof window !== "undefined") {
      const unlock = () => {
        this.init();
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
      };
      window.addEventListener("click", unlock);
      window.addEventListener("keydown", unlock);
      window.addEventListener("touchstart", unlock);
    }
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.stopSiren();
    }
  }

  isMuted() {
    return this.muted;
  }

  // Soft radar sonar sweep sound
  playPing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Alias for playPing
  playSonar() {
    try {
      this.playPing();
    } catch {
      // safe fallback
    }
  }

  // Emergency alarm klaxon / siren pulse
  playAlarm() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Pulse 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.linearRampToValueAtTime(880, now + 0.2);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Pulse 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(880, now + 0.25);
      osc2.frequency.linearRampToValueAtTime(440, now + 0.45);
      gain2.gain.setValueAtTime(0.15, now + 0.25);
      gain2.gain.linearRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.5);
    } catch {
      // safe fallback
    }
  }

  // Alias for playAlarm
  playSiren() {
    try {
      this.playAlarm();
    } catch {
      // safe fallback
    }
  }

  // Start continuous emergency siren loop for active disasters
  startSiren() {
    if (this.muted || this.isSirenPlaying) return;
    this.isSirenPlaying = true;
    this.playAlarm();
    this.sirenInterval = setInterval(() => {
      if (this.muted || !this.isSirenPlaying) {
        this.stopSiren();
        return;
      }
      this.playAlarm();
    }, 800);
  }

  // Stop emergency siren loop
  stopSiren() {
    this.isSirenPlaying = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  // Confirmation chime for successful sync or mitigation
  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // safe fallback
    }
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
