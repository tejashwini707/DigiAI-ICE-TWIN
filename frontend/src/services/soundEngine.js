// Web Audio API Synthesizer for Antarctic Station Mission Control Sound FX
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isSirenPlaying = false;
    this.sirenTimer = null;
    this.currentOscs = [];
    this.isAutoplayBlocked = false;
    this.attachAutoUnlock();
  }

  attachAutoUnlock() {
    if (typeof window !== "undefined") {
      const unlock = () => {
        this.ensureAudio().then(() => {
          if (this.isSirenPlaying && !this.muted) {
            this.playSirenTone();
          }
        }).catch(() => {});
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
      };
      window.addEventListener("click", unlock, { passive: true });
      window.addEventListener("keydown", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
    }
  }

  async ensureAudio() {
    if (typeof window === "undefined") return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      this.isAutoplayBlocked = !this.ctx || this.ctx.state !== "running";
      return !this.isAutoplayBlocked;
    } catch {
      this.isAutoplayBlocked = true;
      return false;
    }
  }

  init() {
    this.ensureAudio();
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      this.stopSirenNodes();
    } else if (this.isSirenPlaying) {
      this.playSirenTone();
    }
  }

  isMuted() {
    return this.muted;
  }

  // Soft radar sonar sweep sound
  playPing() {
    if (this.muted) return;
    this.ensureAudio().then((ready) => {
      if (!ready || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      } catch {
        // safe fallback
      }
    });
  }

  playSonar() {
    this.playPing();
  }

  // Cleanly stops currently sounding oscillator nodes
  stopSirenNodes() {
    if (this.currentOscs && this.currentOscs.length > 0) {
      this.currentOscs.forEach(({ osc, gain }) => {
        try {
          if (this.ctx) {
            gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
            osc.stop(this.ctx.currentTime + 0.05);
          } else {
            osc.stop();
          }
        } catch {
          // ignore already stopped
        }
      });
      this.currentOscs = [];
    }
  }

  // Plays a single warbling emergency siren cycle (dual-tone European / Polar Station Alarm)
  playSirenTone() {
    if (this.muted || !this.isSirenPlaying) return;
    this.ensureAudio().then((ready) => {
      if (!ready || !this.ctx || this.muted || !this.isSirenPlaying) return;

      try {
        const now = this.ctx.currentTime;
        const duration = 0.75; // 750ms per emergency warble cycle

        // Oscillator 1: Modulating Siren Warble
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(740, now);
        osc1.frequency.linearRampToValueAtTime(960, now + 0.35);
        osc1.frequency.linearRampToValueAtTime(740, now + duration);

        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.setValueAtTime(0.18, now + duration - 0.05);
        gain1.gain.linearRampToValueAtTime(0.001, now + duration);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + duration);

        // Oscillator 2: Sub-harmonic Square Klaxon for urgency & presence
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = "square";
        osc2.frequency.setValueAtTime(370, now);
        osc2.frequency.linearRampToValueAtTime(480, now + 0.35);
        osc2.frequency.linearRampToValueAtTime(370, now + duration);

        gain2.gain.setValueAtTime(0.08, now);
        gain2.gain.setValueAtTime(0.08, now + duration - 0.05);
        gain2.gain.linearRampToValueAtTime(0.001, now + duration);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + duration);

        this.currentOscs = [
          { osc: osc1, gain: gain1 },
          { osc: osc2, gain: gain2 },
        ];
      } catch {
        // safe fallback
      }
    });
  }

  // Emergency alarm klaxon / siren pulse (single shot)
  playAlarm() {
    this.playSirenTone();
  }

  playSiren() {
    this.startSiren();
  }

  // Start continuous emergency siren loop for active disasters
  startSiren() {
    this.isSirenPlaying = true;
    this.ensureAudio().then(() => {
      this.playSirenTone();
      if (this.sirenTimer) clearInterval(this.sirenTimer);
      this.sirenTimer = setInterval(() => {
        if (this.muted || !this.isSirenPlaying) {
          this.stopSiren();
          return;
        }
        this.playSirenTone();
      }, 800);
    });
  }

  // Stop emergency siren loop
  stopSiren() {
    this.isSirenPlaying = false;
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    this.stopSirenNodes();
  }

  // Confirmation chime for successful sync or mitigation
  playSuccess() {
    if (this.muted) return;
    this.ensureAudio().then((ready) => {
      if (!ready || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);

          gain.gain.setValueAtTime(0.08, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.28);
        });
      } catch {
        // safe fallback
      }
    });
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;

