import { audioCore } from './fluencyAudioCore.js';

class BoardAudio {
  constructor() {
    this.bgmTimer = null;
    this.step = 0;
  }

  // Crisp Wood Snap (Single Board Break)
  playWoodCrack() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    
    // High wood-crack snap
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Multi-Board Power Smash (Blue Energy & Fire Rage Modes)
  playPowerSmash(streak) {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const isFireRage = streak >= 5;
    const notes = isFireRage ? [330, 440, 660, 880] : [261.63, 392.00, 523.25];

    // Explosive multi-tone burst
    notes.forEach((freq, idx) => {
      const osc = audioCore.ctx.createOscillator();
      const gain = audioCore.ctx.createGain();

      osc.type = isFireRage ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      osc.frequency.exponentialRampToValueAtTime(100, now + idx * 0.03 + 0.2);

      gain.gain.setValueAtTime(0.25, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.25);

      osc.connect(gain);
      gain.connect(audioCore.ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.25);
    });
  }

  // Dull Wood Thud (Missed Strike / Cracked Board)
  playMissThud() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.16);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Stance Broken Crash (Timeout / 3 Consecutive Misses)
  playStanceBroken() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // 125 BPM Taiko Dojo Rhythm Beat
  startBGM() {
    if (audioCore.isMuted) return;
    audioCore.init();
    this.stopBGM();

    const lowDrum = [98.00, 98.00, 130.81, 110.00]; // G2, G2, C3, A2
    this.step = 0;

    this.bgmTimer = setInterval(() => {
      if (audioCore.isMuted || !audioCore.ctx) return;
      const now = audioCore.ctx.currentTime;

      // Heavy Taiko Bass Strike (Beats 1 & 3)
      if (this.step % 4 === 0 || this.step % 4 === 2) {
        const drumOsc = audioCore.ctx.createOscillator();
        const drumGain = audioCore.ctx.createGain();
        const filter = audioCore.ctx.createBiquadFilter();

        const freq = lowDrum[Math.floor(this.step / 4) % lowDrum.length];
        drumOsc.type = 'sine';
        drumOsc.frequency.setValueAtTime(freq, now);
        drumOsc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);

        drumGain.gain.setValueAtTime(0.2, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        drumOsc.connect(filter);
        filter.connect(drumGain);
        drumGain.connect(audioCore.ctx.destination);

        drumOsc.start(now);
        drumOsc.stop(now + 0.18);
      }

      // Wooden Rim Tap (Beats 2 & 4)
      if (this.step % 4 === 1 || this.step % 4 === 3) {
        const rimOsc = audioCore.ctx.createOscillator();
        const rimGain = audioCore.ctx.createGain();

        rimOsc.type = 'triangle';
        rimOsc.frequency.setValueAtTime(1200, now);

        rimGain.gain.setValueAtTime(0.04, now);
        rimGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        rimOsc.connect(rimGain);
        rimGain.connect(audioCore.ctx.destination);

        rimOsc.start(now);
        rimOsc.stop(now + 0.04);
      }

      this.step++;
    }, 120);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const boardAudio = new BoardAudio();
