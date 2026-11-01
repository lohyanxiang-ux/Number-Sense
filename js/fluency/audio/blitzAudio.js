import { audioCore } from './fluencyAudioCore.js';

class BlitzAudio {
  constructor() {
    this.bgmTimer = null;
    this.step = 0;
  }

  // --- SOUND EFFECTS ---

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

  // --- MULTI-TRACK SYNTHESIZED BGM (135 BPM NINJA DOJO THEME) ---

  startBGM() {
    if (audioCore.isMuted) return;
    audioCore.init();
    this.stopBGM();

    const bassNotes = [110.00, 110.00, 146.83, 130.81]; // A2, A2, D3, C3
    const pentatonicScale = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // Japanese A-minor pentatonic

    this.step = 0;

    // 135 BPM rhythm step (~111ms interval per 16th note)
    this.bgmTimer = setInterval(() => {
      if (audioCore.isMuted || !audioCore.ctx) return;
      const now = audioCore.ctx.currentTime;

      // TRACK 1: PULSING BASS (Every quarter note / 4 steps)
      if (this.step % 4 === 0) {
        const bassOsc = audioCore.ctx.createOscillator();
        const bassGain = audioCore.ctx.createGain();
        const filter = audioCore.ctx.createBiquadFilter();

        const freq = bassNotes[(Math.floor(this.step / 4)) % bassNotes.length];
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);

        bassGain.gain.setValueAtTime(0.12, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(audioCore.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.22);
      }

      // TRACK 2: PENTATONIC RUNNING ARPEGGIO (Every 16th note)
      const arpFreq = pentatonicScale[this.step % pentatonicScale.length];
      const arpOsc = audioCore.ctx.createOscillator();
      const arpGain = audioCore.ctx.createGain();

      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpFreq, now);

      arpGain.gain.setValueAtTime(0.035, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      arpOsc.connect(arpGain);
      arpGain.connect(audioCore.ctx.destination);

      arpOsc.start(now);
      arpOsc.stop(now + 0.08);

      // TRACK 3: PERCUSSION WOODBLOCK TICK (Beats 2 and 4)
      if (this.step % 8 === 4) {
        const tickOsc = audioCore.ctx.createOscillator();
        const tickGain = audioCore.ctx.createGain();

        tickOsc.type = 'sine';
        tickOsc.frequency.setValueAtTime(1600, now);

        tickGain.gain.setValueAtTime(0.05, now);
        tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        tickOsc.connect(tickGain);
        tickGain.connect(audioCore.ctx.destination);

        tickOsc.start(now);
        tickOsc.stop(now + 0.03);
      }

      this.step++;
    }, 111);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const blitzAudio = new BlitzAudio();
