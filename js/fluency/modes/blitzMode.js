import { BlitzEngine } from '../engines/blitzEngine.js';
import { getFluencyQuestion } from '../fluencyRegistry.js';
import { getStudentFluencyData } from '../fluencyMastery.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';
let countdownInterval = null;
let timeRemaining = 30;

export function mountBlitzMode(container, currentUser, onFinishCallback) {
  engine = new BlitzEngine();
  timeRemaining = 30;

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

      /* SHURIKEN & LIGHTNING ANIMATIONS */
      @keyframes throwShuriken {
        0% { transform: scale(0.6) rotate(0deg); opacity: 0; left: 10%; bottom: 10%; }
        50% { opacity: 1; }
        100% { transform: scale(1.3) rotate(720deg); opacity: 1; left: 50%; bottom: 50%; }
      }

      @keyframes lightningFlash {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.8; }
      }

      .shuriken-fly {
        animation: throwShuriken 0.25s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      }

      .lightning-overlay {
        animation: lightningFlash 0.3s ease-out;
      }

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
        
        <!-- LEFT COLUMN: TARGET DUMMY ARENA & LIGHTNING VISUALS -->
        <div style="background: linear-gradient(180deg, #090d16 0%, #1e1b4b 100%); border-radius: 16px; padding: 20px; position: relative; min-height: 460px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border: 2px solid #6366f1;">
          
          <!-- LIGHTNING OVERLAY EFFECT -->
          <div id="blitzLightning" class="lightning-overlay" style="position: absolute; inset: 0; background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%); opacity: 0; pointer-events: none; z-index: 2;"></div>

          <!-- HEADER: 30S TIMER & STREAK COUNTER -->
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 5;">
            <!-- RADIAL COUNTDOWN DISPLAY -->
            <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid #38bdf8; padding: 6px 14px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.2rem;">⏱️</span>
              <span id="blitzTimerDisplay" style="font-size: 1.4rem; font-weight: 900; color: #38bdf8; font-family: monospace;">30.0s</span>
            </div>

            <!-- LIVE STREAK METER -->
            <div id="blitzStreakBadge" style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #f59e0b; font-weight: 900; padding: 6px 14px; border-radius: 10px; font-size: 1rem; transition: transform 0.2s ease;">
              🔥 STREAK: 0
            </div>
          </div>

          <!-- CENTER DUMMY & SHURIKEN STRIKE ZONE -->
          <div style="position: relative; height: 260px; display: flex; justify-content: center; align-items: center; z-index: 3;">
            
            <!-- TARGET DUMMY -->
            <div id="targetDummy" style="font-size: 6rem; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.7)); transition: transform 0.15s ease;">🎯</div>

            <!-- FLYING SHURIKEN SPRITE -->
            <div id="shurikenSprite" style="
              position: absolute; 
              font-size: 3rem; 
              opacity: 0;
              pointer-events: none;
              transform: translate(-50%, 50%);
            ">🥷</div>

            <!-- HIT SPARK / IMPACT EFFECT -->
            <div id="blitzHitEffect" style="
              position: absolute;
              font-size: 4rem;
              opacity: 0;
              transition: all 0.2s ease;
              pointer-events: none;
            ">⚡</div>
          </div>

          <!-- FOOTER SCORE COUNTER -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 5;">
            <div style="color: #94a3b8; font-size: 0.9rem; font-weight: 800;">
              TARGETS STRUCK: <strong id="blitzScoreCount" style="color: #10b981; font-size: 1.2rem;">0</strong>
            </div>
            <span style="color: #818cf8; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px;">SHURIKEN BLITZ</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: QUESTION & KEYPAD -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div id="fluencyFeedbackBadge" style="height: 32px; line-height: 32px; text-align: center; font-weight: 800; font-size: 0.95rem; border-radius: 8px; margin-bottom: 8px; visibility: hidden;">--</div>

          <div id="fluencyPrompt" style="font-size: 2.8rem; font-weight: 900; color: var(--text-main); text-align: center; margin-bottom: 12px; background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 12px;">--</div>

          <div id="fluencyAnswerBox" style="font-size: 2.2rem; font-weight: 800; height: 54px; line-height: 54px; text-align: center; background: var(--bg-card); border: 2px dashed var(--border-color); border-radius: 12px; margin-bottom: 16px; color: #6366f1;">?</div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; margin-bottom: 12px;">
            <button class="btn f-key" data-k="1">1</button>
            <button class="btn f-key" data-k="2">2</button>
            <button class="btn f-key" data-k="3">3</button>
            <button class="btn f-key" data-k="4">4</button>
            <button class="btn f-key" data-k="5">5</button>
            <button class="btn f-key" data-k="6">6</button>
            <button class="btn f-key" data-k="7">7</button>
            <button class="btn f-key" data-k="8">8</button>
            <button class="btn f-key" data-k="9">9</button>
            <button class="btn f-key" data-k="-" style="background: var(--bg-primary);">-</button>
            <button class="btn f-key" data-k="0">0</button>
            <button class="btn" id="fKeyClear" style="background: var(--bg-primary); color: var(--danger); font-weight: 800;">C</button>
          </div>

          <button class="btn" id="fKeyEnter" style="width: 100%; background: #6366f1; color: white; font-size: 1.2rem; font-weight: 800; padding: 14px 0;">↵ SUBMIT</button>
        </div>

      </div>
    </div>
  `;

  setupKeypad(currentUser, onFinishCallback);
  engine.startSession();
  startTimer(onFinishCallback);
  nextQuestion(currentUser);
}

function setupKeypad(currentUser, onFinishCallback) {
  document.querySelectorAll('.f-key').forEach(btn => {
    btn.onclick = () => {
      userAnswerStr += btn.getAttribute('data-k');
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

  countdownInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timeRemaining = Math.max(0, 30.0 - elapsed);

    const timerEl = document.getElementById('blitzTimerDisplay');
    if (timerEl) {
      timerEl.innerText = `${timeRemaining.toFixed(1)}s`;
      if (timeRemaining <= 5.0) {
        timerEl.style.color = '#ef4444';
        timerEl.style.borderColor = '#ef4444';
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
  if (!userAnswerStr || !currentQ || timeRemaining <= 0) return;

  const res = engine.submitAnswer(userAnswerStr, currentQ);
  triggerStrikeAnimation(res.isCorrect, res.currentStreak);

  // Update Score counter
  const scoreEl = document.getElementById('blitzScoreCount');
  if (scoreEl) scoreEl.innerText = res.correctCount;

  // Update Streak Badge
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

function triggerStrikeAnimation(isCorrect, streak) {
  const dummy = document.getElementById('targetDummy');
  const shuriken = document.getElementById('shurikenSprite');
  const effect = document.getElementById('blitzHitEffect');
  const box = document.getElementById('fluencyAnswerBox');
  const badge = document.getElementById('fluencyFeedbackBadge');
  const lightning = document.getElementById('blitzLightning');

  if (box) {
    box.classList.remove('flash-correct', 'flash-wrong');
    void box.offsetWidth;
    box.classList.add(isCorrect ? 'flash-correct' : 'flash-wrong');
  }

  if (badge) {
    badge.style.visibility = 'visible';
    badge.style.background = isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    badge.style.color = isCorrect ? '#10b981' : '#ef4444';
    badge.innerText = isCorrect ? `⚡ BULLSEYE! (${streak}x Streak)` : '💥 MISS!';
    setTimeout(() => { badge.style.visibility = 'hidden'; }, 400);
  }

  if (isCorrect) {
    if (shuriken) {
      shuriken.classList.remove('shuriken-fly');
      void shuriken.offsetWidth;
      shuriken.classList.add('shuriken-fly');
    }

    if (dummy) {
      setTimeout(() => {
        dummy.style.transform = 'scale(1.2) rotate(10deg)';
        setTimeout(() => { dummy.style.transform = 'scale(1) rotate(0deg)'; }, 150);
      }, 200);
    }

    if (lightning && streak >= 3) {
      lightning.classList.remove('lightning-overlay');
      void lightning.offsetWidth;
      lightning.classList.add('lightning-overlay');
    }
  } else {
    if (effect) {
      effect.innerText = '❌';
      effect.style.opacity = '1';
      setTimeout(() => { effect.style.opacity = '0'; }, 300);
    }
  }
}

function finishBlitz(onFinishCallback) {
  // Disable Keypad
  document.querySelectorAll('.f-key, #fKeyClear, #fKeyEnter').forEach(b => b.disabled = true);

  const results = engine.finishSession();
  onFinishCallback(results);
}
