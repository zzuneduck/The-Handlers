export type SoundType = 'hover' | 'click' | 'success' | 'error' | 'notification' | 'whoosh';

const STORAGE_KEY = 'handlers_sound_settings';

interface SoundSettings {
  muted: boolean;
  volume: number;
}

function loadSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { muted: true, volume: 0.3 }; // 기본값 OFF
}

function saveSettings(s: SoundSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private settings: SoundSettings;
  private listeners = new Set<() => void>();

  constructor() {
    this.settings = loadSettings();
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get muted() { return this.settings.muted; }
  get volume() { return this.settings.volume; }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    saveSettings(this.settings);
    this.notify();
    // 켤 때 피드백 사운드
    if (!this.settings.muted) {
      this.play('click');
    }
  }

  setVolume(v: number) {
    this.settings.volume = Math.max(0, Math.min(1, v));
    saveSettings(this.settings);
    this.notify();
  }

  play(type: SoundType) {
    if (this.settings.muted) return;

    try {
      const ctx = this.getCtx();
      const vol = this.settings.volume;

      switch (type) {
        case 'hover':   this.playHover(ctx, vol); break;
        case 'click':   this.playClick(ctx, vol); break;
        case 'success': this.playSuccess(ctx, vol); break;
        case 'error':   this.playError(ctx, vol); break;
        case 'notification': this.playNotification(ctx, vol); break;
        case 'whoosh':  this.playWhoosh(ctx, vol); break;
      }
    } catch {
      // AudioContext 생성 실패 시 무시
    }
  }

  // ── hover: 짧고 부드러운 틱 ──
  private playHover(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 4200;
    gain.gain.setValueAtTime(vol * 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  // ── click: 확실한 클릭음 ──
  private playClick(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // ── success: 밝은 상승 차임 (2음) ──
  private playSuccess(ctx: AudioContext, vol: number) {
    const notes = [523.25, 783.99]; // C5 → G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // ── error: 낮은 경고음 ──
  private playError(ctx: AudioContext, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // ── notification: 밝은 벨 (2회 반복) ──
  private playNotification(ctx: AudioContext, vol: number) {
    [0, 0.15].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.15, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  // ── whoosh: 스위시 효과 ──
  private playWhoosh(ctx: AudioContext, vol: number) {
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(ctx.currentTime);
  }
}

// 싱글톤
export const soundManager = new SoundManager();
