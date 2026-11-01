import { audioCore } from './fluencyAudioCore.js';

class SummitAudio {
  constructor() {
    this.bgmTimer = null;
    this.step = 0;
  }

  // Ledge Climb Leap (Upward pitch jump)
  playClimbLeap() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Ledge Slip Slide (Descending pitch slide)
  playSlipSlide() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Cliff Fall & Impact Thud (10s Idle Timeout)
  playFallThud() {
    if (audioCore.isMuted || !audioCore.ctx) return;
    audioCore.init();

    const now = audioCore.ctx.currentTime;

    // Falling pitch slide
    const osc = audioCore.ctx.createOscillator();
    const gain = audioCore.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(audioCore.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    // Ground impact thud
    setTimeout(() => {
      if (audioCore.isMuted || !audioCore.ctx) return;
      const thudNow = audioCore.ctx.currentTime;
      const thudOsc = audioCore.ctx.createOscillator();
      const thudGain = audioCore.ctx.createGain();

      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(100, thudNow);
      thudOsc.frequency.exponentialRampToValueAtTime(30, thudNow + 0.25);

      thudGain.gain.setValueAtTime(0.4, thudNow);
      thudGain.gain.exponentialRampToValueAtTime(0.001, thudNow + 0.25);

      thudOsc.connect(thudGain);
      thudGain.connect(audioCore.ctx.destination);

      thudOsc.start(thudNow);
      thudOsc.stop(thudNow + 0.25);
    }, 550);
  }

  // 115 BPM Atmospheric Mountain Ascent Synth Beat
  startBGM() {
    if (audioCore.isMuted) return;
    audioCore.init();
    this.stopBGM();

    const bassLine = [146.83, 146.83, 174.61, 130.81]; // D3, D3, F3, C3
    const atmosphericNotes = [293.66, 349.23, 440.00, 523.25]; // D4, F4, A4, C5
    this.step = 0;

    this.bgmTimer = setInterval(() => {
      if (audioCore.isMuted || !audioCore.ctx) return;
      const now = audioCore.ctx.currentTime;

      // Steady climbing bass pulse
      if (this.step % 2 === 0) {
        const bassOsc = audioCore.ctx.createOscillator();
        const bassGain = audioCore.ctx.createGain();
        const filter = audioCore.ctx.createBiquadFilter();

        const freq = bassLine[Math.floor(this.step / 4) % bassLine.length];
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        bassGain.gain.setValueAtTime(0.1, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(audioCore.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.2);
      }

      // High atmospheric bell tones
      if (this.step % 8 === 0 || this.step % 8 === 5) {
        const highOsc = audioCore.ctx.createOscillator();
        const highGain = audioCore.ctx.createGain();

        const highFreq = atmosphericNotes[this.step % atmosphericNotes.length];
        highOsc.type = 'sine';
        highOsc.frequency.setValueAtTime(highFreq, now);

        highGain.gain.setValueAtTime(0.04, now);
        highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        highOsc.connect(highGain);
        highGain.connect(audioCore.ctx.destination);

        highOsc.start(now);
        highOsc.stop(now + 0.35);
      }

      this.step++;
    }, 130);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const summitAudio = new SummitAudio();
