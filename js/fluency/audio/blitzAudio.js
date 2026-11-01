import { audioCore } from './fluencyAudioCore.js';

class BlitzAudio {
  constructor() {
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  playThrowSwoosh() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'sine';
    const now = audioCore.ctx.currentTime;
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playTargetHit() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = audioCore.ctx.createOscillator();
      const gain = audioCore.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(audioCore.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.2);
    });
  }

  playTargetMiss() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.linearRampToValueAtTime(55, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  startBGM() {
    if (audioCore.isMuted) return;
    audioCore.init();
    this.stopBGM();

    const notes = [110, 146.83, 130.81, 164.81];
    this.bgmStep = 0;

    this.bgmTimer = setInterval(() => {
      if (audioCore.isMuted || !audioCore.ctx) return;
      const now = audioCore.ctx.currentTime;

      const osc = audioCore.ctx.createOscillator();
      const gain = audioCore.ctx.createGain();

      const freq = notes[this.bgmStep % notes.length];
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(audioCore.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      this.bgmStep++;
    }, 220); // ~136 BPM rhythm loop
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const blitzAudio = new BlitzAudio();
