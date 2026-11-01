import { BlitzEngine } from '../engines/blitzEngine.js';
import { getFluencyQuestion } from '../fluencyRegistry.js';
import { getStudentFluencyData } from '../fluencyMastery.js';
import { audioCore } from '../audio/fluencyAudioCore.js';
import { blitzAudio } from '../audio/blitzAudio.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';
let countdownInterval = null;
let timeRemaining = 30;
let lastTickSecond = 30;

export function mountBlitzMode(container, currentUser, onFinishCallback) {
  engine = new BlitzEngine();
  timeRemaining = 30;
  lastTickSecond = 30;

  audioCore.init();
  blitzAudio.startBGM();

  container.innerHTML = `
    <style>
      .blitz-arena-grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 20px;
        align-items: stretch;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .blitz-arena-grid { grid-template-columns: 1fr; }
      }

      /* 4-COLUMN KEYPAD GRID WITH 4TH COLUMN ACTION BAR */
      .blitz-keypad-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        width: 100%;
        margin-bottom: 12px;
      }

      .blitz-keypad-grid .btn {
        padding: 12px 0;
        font-size: 1.3rem;
        font-weight: 800;
        border-radius: 10px;
        transition: transform 0.1s ease, filter 0.15s ease;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      }

      .blitz-keypad-grid .btn:active {
        transform: scale(0.94);
      }

      .f-key-num {
        background: #1e293b !important;
        color: #f8fafc !important;
        border: 1.5px solid #334155 !important;
      }

      .f-key-zero {
        grid-column: span 3;
      }

      .f-key-minus {
        background: rgba(245, 158, 11, 0.2) !important;
        color: #fbbf24 !important;
        border: 2px solid #f59e0b !important;
        font-size: 1.5rem !important;
      }

      .f-key-dot {
        background: rgba(6, 182, 212, 0.2) !important;
        color: #38bdf8 !important;
        border: 2px solid #06b6d4 !important;
        font-size: 2.4rem !important;
        line-height: 0.8 !important;
        font-weight: 900 !important;
      }

      .f-key-slash {
        background: rgba(139, 92, 246, 0.2) !important;
        color: #c084fc !important;
        border: 2px solid #8b5cf6 !important;
        font-size: 1.4rem !important;
      }

      .f-key-clear {
        background: rgba(239, 68, 68, 0.2) !important;
        color: #ef4444 !important;
        border: 2px solid #ef4444 !important;
        font-size: 1.3rem !important;
      }

      .f-btn-submit {
        width: 100%;
        background: #10b981 !important;
        color: #ffffff !important;
        font-size: 1.3rem !important;
        font-weight: 900 !important;
        padding: 16px 0 !important;
        border-radius: 12px !important;
        border: none !important;
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
        letter-spacing: 1px;
      }

      .f-btn-submit:hover {
        filter: brightness(1.1);
      }

      /* ANIMATIONS */
      @keyframes handThrow {
        0% { transform: translate(-50%, 80px) rotate(-25deg); opacity: 0; }
        30% { transform: translate(-50%, 10px) rotate(10deg); opacity: 1; }
        60% { transform: translate(-50%, -10px) rotate(30deg); opacity: 1; }
        100% { transform: translate(-50%, 90px) rotate(35deg); opacity: 0; }
      }

      @keyframes shurikenHitTrajectory {
        0% { transform: translate(-50%, 120px) scale(0.4) rotate(0deg); opacity: 0; }
        25% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translate(-50%, -80px) scale(1.1) rotate(1080deg); opacity: 0; }
      }

      @keyframes shurikenMissTrajectory {
        0% { transform: translate(-50%, 120px) scale(0.4) rotate(0deg); opacity: 0; }
        30% { opacity: 1; }
        100% { transform: translate(140px, -140px) scale(0.6) rotate(1440deg); opacity: 0; }
      }

      @keyframes dummyHitWobble {
        0%, 100% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.08) rotate(-8deg); }
        75% { transform: scale(1.08) rotate(8deg); }
      }

      @keyframes dummyMissDodge {
        0%, 100% { transform: translateX(0); }
        30% { transform: translateX(-18px) rotate(-6deg); }
      }

      .animate-hand-throw { animation: handThrow 0.45s cubic-bezier(0.2, 0.8, 0.25, 1) forwards; }
      .animate-shuriken-hit { animation: shurikenHitTrajectory 0.28s cubic-bezier(0.1, 0.9, 0.2) forwards; }
      .animate-shuriken-miss { animation: shurikenMissTrajectory 0.32s cubic-bezier(0.2, 0.8, 0.4) forwards; }
      .animate-dummy-hit { animation: dummyHitWobble 0.3s ease-in-out; }
      .animate-dummy-miss { animation: dummyMissDodge 0.3s ease-in-out; }

      .flash-correct {
        animation: pulseGreen 0.3s ease-in-out;
        border-color: #10b981 !important;
        background: rgba(16, 185, 129, 0.15) !important;
        color: #10b981 !important;
      }

      .flash-wrong {
        animation: pulseRed 0.3s ease-in-out;
        border-color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.15) !important;
        color: #ef4444 !important;
      }

      @keyframes pulseGreen {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); box-shadow: 0 0 20px #10b981; }
      }

      @keyframes pulseRed {
        0%, 100% { transform: scale(1); }
        25%, 75% { transform: scale(1.02) translateX(-4px); box-shadow: 0 0 20px #ef4444; }
      }
    </style>

    <div class="card" style="width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px;">
      <div class="blitz-arena-grid">
        
        <!-- LEFT COLUMN: TRAINING DUMMY & SHURIKEN DOJO ARENA -->
        <div style="background: linear-gradient(180deg, #090d16 0%, #1e1b4b 100%); border-radius: 16px; padding: 20px; position: relative; min-height: 460px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border: 2px solid #6366f1;">
          
          <!-- HEADER: 30S TIMER, AUDIO TOGGLE BUTTON & STREAK BADGE -->
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 5;">
            <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid #38bdf8; padding: 6px 14px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.2rem;">⏱️</span>
              <span id="blitzTimerDisplay" style="font-size: 1.4rem; font-weight: 900; color: #38bdf8; font-family: monospace;">30.0s</span>
            </div>

            <!-- AUDIO MUTE TOGGLE BUTTON -->
            <button id="btnToggleBlitzSound" style="
              background: rgba(16, 185, 129, 0.15);
              border: 1px solid #10b981;
              color: #10b981;
              font-weight: 900;
              padding: 6px 14px;
              border-radius: 10px;
              font-size: 0.85rem;
              cursor: pointer;
              transition: all 0.2s ease;
            ">
              🔊 Sound: ON
            </button>

            <div id="blitzStreakBadge" style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #f59e0b; font-weight: 900; padding: 6px 14px; border-radius: 10px; font-size: 1rem; transition: transform 0.2s ease;">
              🔥 STREAK: 0
            </div>
          </div>

          <!-- CENTER ARENA: MARTIAL ARTS WOODEN DUMMY & SHURIKEN LAYER -->
          <div style="position: relative; height: 280px; display: flex; justify-content: center; align-items: center; z-index: 3; width: 100%;">
            <div id="trainingDummy" style="position: relative; width: 140px; height: 220px; display: flex; flex-direction: column; align-items: center; transition: transform 0.15s ease;">
              <div style="width: 56px; height: 56px; background: #854d0e; border-radius: 50%; border: 3px solid #713f12; position: relative; display: flex; justify-content: center; align-items: center;">
                <div style="position: absolute; top: 12px; width: 100%; height: 10px; background: #ef4444;"></div>
                <div style="font-size: 1.2rem; z-index: 2; margin-top: 4px;">🪵</div>
              </div>

              <div style="width: 44px; height: 110px; background: #a16207; border-radius: 8px; border: 3px solid #713f12; position: relative; margin-top: -4px;">
                <div style="position: absolute; top: 20px; left: -30px; width: 34px; height: 10px; background: #854d0e; border: 2px solid #713f12; border-radius: 4px; transform: rotate(-15deg);"></div>
                <div style="position: absolute; top: 35px; right: -30px; width: 34px; height: 10px; background: #854d0e; border: 2px solid #713f12; border-radius: 4px; transform: rotate(15deg);"></div>
                <div style="position: absolute; top: 60px; left: -22px; width: 26px; height: 10px; background: #854d0e; border: 2px solid #713f12; border-radius: 4px;"></div>
                <div id="stuckShurikens" style="position: absolute; inset: 0; pointer-events: none;"></div>
              </div>

              <div style="width: 70px; height: 20px; background: #54320c; border-radius: 4px; border: 2px solid #3b2207; margin-top: -2px;"></div>
            </div>

            <div id="handSprite" style="
              position: absolute; bottom: 10px; left: 50%; font-size: 3.5rem;
              opacity: 0; pointer-events: none; z-index: 11;
              filter: drop-shadow(0 6px 10px rgba(0,0,0,0.6));
            ">🤚</div>

            <div id="shurikenSprite" style="
              position: absolute; bottom: 30px; left: 50%; width: 42px; height: 42px;
              opacity: 0; pointer-events: none; z-index: 10;
              filter: drop-shadow(0 4px 8px rgba(99, 102, 241, 0.8));
            ">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="#cbd5e1" stroke="#334155" stroke-width="1.5">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                <circle cx="12" cy="12" r="2.5" fill="#1e293b"/>
              </svg>
            </div>

            <div id="blitzImpactEffect" style="
              position: absolute; font-size: 3.5rem; opacity: 0; pointer-events: none; z-index: 12;
              transition: opacity 0.2s ease;
            ">💥</div>
          </div>

          <!-- FOOTER STATS -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 5;">
            <div style="color: #94a3b8; font-size: 0.9rem; font-weight: 800;">
              DUMMY HITS: <strong id="blitzScoreCount" style="color: #10b981; font-size: 1.2rem;">0</strong>
            </div>
            <span style="color: #818cf8; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px;">SHURIKEN BLITZ</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: QUESTION & ENHANCED KEYPAD (NON-NUMERICAL IN COL 4) -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div id="fluencyFeedbackBadge" style="height: 32px; line-height: 32px; text-align: center; font-weight: 800; font-size: 0.95rem; border-radius: 8px; margin-bottom: 8px; visibility: hidden;">--</div>

          <div id="fluencyPrompt" style="font-size: 2.8rem; font-weight: 900; color: var(--text-main); text-align: center; margin-bottom: 12px; background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 12px;">--</div>

          <div id="fluencyAnswerBox" style="font-size: 2.2rem; font-weight: 800; height: 54px; line-height: 54px; text-align: center; background: var(--bg-card); border: 2px dashed var(--border-color); border-radius: 12px; margin-bottom: 16px; color: #38bdf8;">?</div>

          <!-- KEYPAD GRID WITH ALL ACTION KEYS ON 4TH COLUMN -->
          <div class="blitz-keypad-grid">
            <button class="btn f-key f-key-num" data-k="1">1</button>
            <button class="btn f-key f-key-num" data-k="2">2</button>
            <button class="btn f-key f-key-num" data-k="3">3</button>
            <button class="btn f-key f-key-minus" data-k="-">−</button>

            <button class="btn f-key f-key-num" data-k="4">4</button>
            <button class="btn f-key f-key-num" data-k="5">5</button>
            <button class="btn f-key f-key-num" data-k="6">6</button>
            <button class="btn f-key f-key-dot" data-k=".">.</button>

            <button class="btn f-key f-key-num" data-k="7">7</button>
            <button class="btn f-key f-key-num" data-k="8">8</button>
            <button class="btn f-key f-key-num" data-k="9">9</button>
            <button class="btn f-key f-key-slash" data-k="/">/</button>

            <button class="btn f-key f-key-num f-key-zero" data-k="0">0</button>
            <button class="btn f-key-clear" id="fKeyClear">C</button>
          </div>

          <!-- GREEN SUBMIT BUTTON -->
          <button class="btn f-btn-submit" id="fKeyEnter">SUBMIT</button>
        </div>

      </div>
    </div>
  `;

  setupAudioToggle(container);
  setupKeypad(currentUser, onFinishCallback);
  engine.startSession();
  startTimer(onFinishCallback);
  nextQuestion(currentUser);
}

function setupAudioToggle(container) {
  const toggleBtn = container.querySelector('#btnToggleBlitzSound');
  if (!toggleBtn) return;

  const updateUI = () => {
    if (audioCore.isMuted) {
      toggleBtn.innerText = '🔇 Sound: OFF';
      toggleBtn.style.background = 'rgba(239, 68, 68, 0.15)';
      toggleBtn.style.color = '#ef4444';
      toggleBtn.style.borderColor = '#ef4444';
    } else {
      toggleBtn.innerText = '🔊 Sound: ON';
      toggleBtn.style.background = 'rgba(16, 185, 129, 0.15)';
      toggleBtn.style.color = '#10b981';
      toggleBtn.style.borderColor = '#10b981';
    }
  };

  updateUI();

  toggleBtn.onclick = () => {
    const isMuted = audioCore.toggleMute();
    if (isMuted) {
      blitzAudio.stopBGM();
    } else {
      blitzAudio.startBGM();
    }
    updateUI();
  };
}

function setupKeypad(currentUser, onFinishCallback) {
  document.querySelectorAll('.f-key').forEach(btn => {
    btn.onclick = () => {
      const val = btn.getAttribute('data-k');

      if (val === '-') {
        if (userAnswerStr.startsWith('-')) {
          userAnswerStr = userAnswerStr.slice(1);
        } else {
          userAnswerStr = '-' + userAnswerStr;
        }
      } else if (val === '.') {
        if (!userAnswerStr.includes('.')) {
          userAnswerStr += '.';
        }
      } else if (val === '/') {
        if (!userAnswerStr.includes('/')) {
          userAnswerStr += '/';
        }
      } else {
        userAnswerStr += val;
      }
      updateBox();
    };
  });

  const clearBtn = document.getElementById('fKeyClear');
  if (clearBtn) {
    clearBtn.onclick = () => {
      userAnswerStr = '';
      updateBox();
    };
  }

  const enterBtn = document.getElementById('fKeyEnter');
  if (enterBtn) {
    enterBtn.onclick = () => submitAnswer(currentUser, onFinishCallback);
  }
}

function startTimer(onFinishCallback) {
  clearInterval(countdownInterval);
  const startTime = Date.now();
  lastTickSecond = 30;

  countdownInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timeRemaining = Math.max(0, 30.0 - elapsed);

    const timerEl = document.getElementById('blitzTimerDisplay');
    if (timerEl) {
      timerEl.innerText = `${timeRemaining.toFixed(1)}s`;
      if (timeRemaining <= 5.0) {
        timerEl.style.color = '#ef4444';
        timerEl.style.borderColor = '#ef4444';

        const currentSec = Math.ceil(timeRemaining);
        if (currentSec <= 5 && currentSec !== lastTickSecond && currentSec > 0) {
          lastTickSecond = currentSec;
          audioCore.playTick();
        }
      }
    }

    if (timeRemaining <= 0) {
      clearInterval(countdownInterval);
      finishBlitz(onFinishCallback);
    }
  }, 100);
}

function updateBox() {
  const box = document.getElementById('fluencyAnswerBox');
  if (box) box.innerText = userAnswerStr || '?';
}

function nextQuestion(currentUser) {
  const data = getStudentFluencyData(currentUser);
  currentQ = getFluencyQuestion(data.level);

  const promptEl = document.getElementById('fluencyPrompt');
  if (promptEl) promptEl.innerText = currentQ.prompt;

  userAnswerStr = '';
  updateBox();
}

function submitAnswer(currentUser, onFinishCallback) {
  if (!userAnswerStr || !currentQ || timeRemaining <= 0 || userAnswerStr === '-') return;

  blitzAudio.playThrowSwoosh();

  const res = engine.submitAnswer(userAnswerStr, currentQ);
  triggerShurikenFlight(res.isCorrect, res.currentStreak);

  const scoreEl = document.getElementById('blitzScoreCount');
  if (scoreEl) scoreEl.innerText = res.correctCount;

  const streakEl = document.getElementById('blitzStreakBadge');
  if (streakEl) {
    streakEl.innerText = `🔥 STREAK: ${res.currentStreak}`;
    if (res.currentStreak > 0 && res.currentStreak % 3 === 0) {
      streakEl.style.transform = 'scale(1.2)';
      setTimeout(() => { streakEl.style.transform = 'scale(1)'; }, 200);
    }
  }

  nextQuestion(currentUser);
}

function triggerShurikenFlight(isCorrect, streak) {
  const dummy = document.getElementById('trainingDummy');
  const hand = document.getElementById('handSprite');
  const shuriken = document.getElementById('shurikenSprite');
  const impactEffect = document.getElementById('blitzImpactEffect');
  const stuckContainer = document.getElementById('stuckShurikens');
  const box = document.getElementById('fluencyAnswerBox');
  const badge = document.getElementById('fluencyFeedbackBadge');

  if (box) {
    box.classList.remove('flash-correct', 'flash-wrong');
    void box.offsetWidth;
    box.classList.add(isCorrect ? 'flash-correct' : 'flash-wrong');
  }

  if (badge) {
    badge.style.visibility = 'visible';
    badge.style.background = isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    badge.style.color = isCorrect ? '#10b981' : '#ef4444';
    badge.innerText = isCorrect ? `⚡ DIRECT HIT! (${streak}x Streak)` : '💨 SHURIKEN MISSED!';
    setTimeout(() => { badge.style.visibility = 'hidden'; }, 450);
  }

  if (hand) {
    hand.classList.remove('animate-hand-throw');
    void hand.offsetWidth;
    hand.classList.add('animate-hand-throw');
  }

  if (shuriken) {
    shuriken.classList.remove('animate-shuriken-hit', 'animate-shuriken-miss');
    void shuriken.offsetWidth;

    if (isCorrect) {
      shuriken.classList.add('animate-shuriken-hit');

      setTimeout(() => {
        blitzAudio.playTargetHit();

        if (dummy) {
          dummy.classList.remove('animate-dummy-hit', 'animate-dummy-miss');
          void dummy.offsetWidth;
          dummy.classList.add('animate-dummy-hit');
        }

        if (impactEffect) {
          impactEffect.innerText = '⚡';
          impactEffect.style.left = '50%';
          impactEffect.style.top = '40%';
          impactEffect.style.transform = 'translate(-50%, -50%)';
          impactEffect.style.opacity = '1';
          setTimeout(() => { impactEffect.style.opacity = '0'; }, 250);
        }

        if (stuckContainer) {
          const pin = document.createElement('div');
          pin.style.position = 'absolute';
          pin.style.width = '18px';
          pin.style.height = '18px';
          pin.style.left = `${Math.floor(Math.random() * 20 + 8)}px`;
          pin.style.top = `${Math.floor(Math.random() * 60 + 15)}px`;
          pin.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
          pin.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#94a3b8" stroke="#1e293b" stroke-width="2">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
              <circle cx="12" cy="12" r="3" fill="#0f172a"/>
            </svg>
          `;
          stuckContainer.appendChild(pin);

          if (stuckContainer.children.length > 8) {
            stuckContainer.removeChild(stuckContainer.firstChild);
          }
        }
      }, 260);

    } else {
      shuriken.classList.add('animate-shuriken-miss');

      setTimeout(() => {
        blitzAudio.playTargetMiss();

        if (dummy) {
          dummy.classList.remove('animate-dummy-hit', 'animate-dummy-miss');
          void dummy.offsetWidth;
          dummy.classList.add('animate-dummy-miss');
        }

        if (impactEffect) {
          impactEffect.innerText = '💨';
          impactEffect.style.left = '75%';
          impactEffect.style.top = '25%';
          impactEffect.style.transform = 'translate(-50%, -50%)';
          impactEffect.style.opacity = '1';
          setTimeout(() => { impactEffect.style.opacity = '0'; }, 250);
        }
      }, 240);
    }
  }
}

function finishBlitz(onFinishCallback) {
  document.querySelectorAll('.f-key, #fKeyClear, #fKeyEnter').forEach(b => b.disabled = true);
  
  blitzAudio.stopBGM();
  audioCore.playVictoryFanfare();

  const results = engine.finishSession();
  onFinishCallback(results);
}
