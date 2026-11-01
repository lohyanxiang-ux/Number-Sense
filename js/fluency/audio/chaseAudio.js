import { audioCore } from './fluencyAudioCore.js';

class ChaseAudio {
  constructor() {
    this.bgmTimer = null;
    this.step = 0;
    this.currentBpm = 110;
  }

  // Vault Swoosh (Successful roof leap)
  playVaultSwoosh() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.14);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Roof Tile Crack (Wrong answer stumble)
  playTileCrack() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Scroll Shatter & Roof Fall (Life lost / Timeout)
  playScrollShatter() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Start/Update Dynamic Accelerating BGM Tempo
  startBGM(bpm = 110) {
    if (audioCore.isMuted) return;
    audioCore.init();

    // If BPM hasn't changed and timer is running, keep playing
    if (this.bgmTimer && this.currentBpm === bpm) return;

    this.stopBGM();
    this.currentBpm = bpm;

    const intervalMs = Math.round((60 / bpm / 4) * 1000); // 16th note timing
    const bassNotes = [110.00, 110.00, 130.81, 146.83]; // A2, A2, C3, D3
    const leadNotes = [220.00, 261.63, 329.63, 392.00];

    this.step = 0;

    this.bgmTimer = setInterval(() => {
      if (audioCore.isMuted || !audioCore.ctx) return;
      const now = audioCore.ctx.currentTime;

      // Track 1: Running Roof-Runner Bassline (Quarter notes)
      if (this.step % 4 === 0) {
        const bassOsc = audioCore.ctx.createOscillator();
        const bassGain = audioCore.ctx.createGain();
        const filter = audioCore.ctx.createBiquadFilter();

        const freq = bassNotes[Math.floor(this.step / 4) % bassNotes.length];
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        bassGain.gain.setValueAtTime(0.12, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(audioCore.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.15);
      }

      // Track 2: Rapid Roof Tile Footstep Percussion (16th notes)
      const stepOsc = audioCore.ctx.createOscillator();
      const stepGain = audioCore.ctx.createGain();

      stepOsc.type = 'triangle';
      stepOsc.frequency.setValueAtTime(this.step % 2 === 0 ? 1400 : 1800, now);

      stepGain.gain.setValueAtTime(0.02, now);
      stepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      stepOsc.connect(stepGain);
      stepGain.connect(audioCore.ctx.destination);

      stepOsc.start(now);
      stepOsc.stop(now + 0.03);

      // Track 3: Lead Pentatonic Stabs (Beats 2 & 4)
      if (this.step % 8 === 4) {
        const leadOsc = audioCore.ctx.createOscillator();
        const leadGain = audioCore.ctx.createGain();

        const leadFreq = leadNotes[this.step % leadNotes.length];
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadGain.gain.setValueAtTime(0.05, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        leadOsc.connect(leadGain);
        leadGain.connect(audioCore.ctx.destination);

        leadOsc.start(now);
        leadOsc.stop(now + 0.1);
      }

      this.step++;
    }, intervalMs);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const chaseAudio = new ChaseAudio();
