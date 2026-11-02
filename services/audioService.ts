
/**
 * AudioController - Luxury Acoustic Engine
 */
class AudioController {
  private static instance: AudioController;
  private bgm: HTMLAudioElement | null = null;
  private sfxCache: Record<string, HTMLAudioElement[]> = {};
  private muted: boolean = false;
  private currentBgmUrl: string = '';
  private hasInteracted: boolean = false;

  private readonly SFX_URLS = {
    tap: '/assets/audio/Tap.wav',
    buy: '/assets/audio/Buy.mp3',
    rankUp: '/assets/audio/Rank up.wav',
    audit: '/assets/audio/Alarm.wav',
    golden: '/assets/audio/Golden.wav',
    nav: '/assets/audio/UI-nav-select.wav'
  };

  private readonly BGM_URLS = {
    low: '/assets/audio/Low-rank-nightwalk.mp3',
    mid: '/assets/audio/mid-rank.mp3',
    high: '/assets/audio/high-rank.mp3'
  };

  private constructor() {
    this.muted = localStorage.getItem('lazy_muted') === 'true';
    Object.keys(this.SFX_URLS).forEach(key => {
      this.sfxCache[key] = Array(8).fill(null).map(() => new Audio((this.SFX_URLS as any)[key]));
    });
  }

  static getInstance() {
    if (!AudioController.instance) AudioController.instance = new AudioController();
    return AudioController.instance;
  }

  // Called on first tap to unlock audio
  initialize() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;
    // Play a silent sound to unlock the context
    const silence = new Audio();
    silence.play().catch(() => {});
  }

  playBgm(rankId: number) {
    if (this.muted) return;

    let targetUrl = this.BGM_URLS.low;
    if (rankId >= 2) targetUrl = this.BGM_URLS.mid;
    if (rankId >= 5) targetUrl = this.BGM_URLS.high;

    if (this.currentBgmUrl === targetUrl && this.bgm) return;

    if (this.bgm) {
      const oldBgm = this.bgm;
      // Fade out old BGM
      let vol = oldBgm.volume;
      const fade = setInterval(() => {
        vol -= 0.05;
        if (vol <= 0) {
          oldBgm.pause();
          clearInterval(fade);
        } else {
          oldBgm.volume = vol;
        }
      }, 50);
    }

    this.currentBgmUrl = targetUrl;
    this.bgm = new Audio(targetUrl);
    this.bgm.loop = true;
    this.bgm.volume = 0.3;
    this.bgm.play().catch(e => console.warn('BGM blocked - need interaction', e));
  }

  playSfx(type: keyof typeof AudioController.prototype.SFX_URLS) {
    if (this.muted) return;
    const pool = this.sfxCache[type];
    const sound = pool.find(s => s.paused) || pool[0];
    sound.currentTime = 0;
    if (type === 'tap') {
      sound.playbackRate = 0.8 + Math.random() * 0.5;
    }
    sound.volume = type === 'audit' ? 0.5 : 0.3;
    sound.play().catch(() => {});
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('lazy_muted', String(this.muted));
    if (this.muted && this.bgm) {
      this.bgm.pause();
    } else if (this.bgm) {
      this.bgm.play().catch(() => {});
    }
    return this.muted;
  }

  playNewsAlert(isBoom: boolean = true) {
    if (this.muted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // High-tech market chime arpeggio
      const freqs = isBoom ? [523.25, 659.25, 783.99, 1046.50] : [783.99, 659.25, 523.25, 392.00];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isBoom ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);
        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.31);
      });
    } catch {
      // AudioContext policy fallback
    }
  }

  isMuted() { return this.muted; }
}

export const audio = AudioController.getInstance();
