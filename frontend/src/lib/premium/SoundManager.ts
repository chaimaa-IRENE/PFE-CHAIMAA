class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.08;

  private getCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        this.enabled = false;
        return null;
      }
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "sine", vol?: number) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol ?? this.volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  click() {
    this.playTone(800, 0.04, "sine", 0.03);
  }

  tap() {
    this.playTone(600, 0.03, "sine", 0.02);
  }

  success() {
    this.playTone(523.25, 0.1, "sine", 0.05);
    setTimeout(() => this.playTone(659.25, 0.1, "sine", 0.05), 60);
    setTimeout(() => this.playTone(783.99, 0.15, "sine", 0.05), 120);
  }

  error() {
    this.playTone(200, 0.15, "sawtooth", 0.04);
  }

  notification() {
    this.playTone(880, 0.08, "sine", 0.04);
    setTimeout(() => this.playTone(1100, 0.12, "sine", 0.03), 50);
  }

  swoosh() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  toggle() {
    this.playTone(500, 0.05, "sine", 0.025);
  }

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  setVolume(v: number) {
    this.volume = v;
  }
}

export const soundManager = new SoundManager();
