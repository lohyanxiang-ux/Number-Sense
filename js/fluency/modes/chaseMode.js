import { ChaseEngine } from '../engines/chaseEngine.js';
import { getFluencyQuestion } from '../fluencyRegistry.js';
import { getStudentFluencyData } from '../fluencyMastery.js';
import { audioCore } from '../audio/fluencyAudioCore.js';
import { chaseAudio } from '../audio/chaseAudio.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';
let questionTimerInterval = null;
let timeRemaining = 8.0;
let currentTimeLimit = 8.0;

export function mountChaseMode(container, currentUser, onFinishCallback) {
  engine = new ChaseEngine();

  audioCore.init();
  chaseAudio.startBGM(110);

  container.innerHTML = `
    <style>
      .chase-arena-grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 20px;
        align-items: stretch;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .chase-arena-grid { grid-template-columns: 1fr; }
      }

      /* 4-COLUMN KEYPAD GRID WITH 4TH COLUMN ACTION BAR */
      .chase-keypad-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        width: 100%;
        margin-bottom: 12px;
      }

      .chase-keypad-grid .btn {
        padding: 12px 0;
        font-size: 1.3rem;
        font-weight: 800;
        border-radius: 10px;
        transition: transform 0.1s ease, filter 0.15s ease;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      }

      .chase-keypad-grid .btn:active {
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

      /* INFINITE SCROLLING ROOFTOP BACKDROP */
      :root {
        --chase-speed: 3.5s;
      }

      .scrolling-roof-track {
        display: flex;
        width: 200%;
        height: 120px;
        position: absolute;
        bottom: 0;
        left: 0;
        animation: scrollRoof var(--chase-speed, 3.5s) linear infinite;
        pointer-events: none;
      }

      @keyframes scrollRoof {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* NINJA RUNNING STRIDE ANIMATION */
      .ninja-running {
        animation: ninjaRunStride 0.3s ease-in-out infinite alternate;
        display: flex;
        align-items: center;
      }

      @keyframes ninjaRunStride {
        0% { transform: translateY(0) rotate(6deg); }
        100% { transform: translateY(-8px) rotate(14deg); }
      }

      /* CORRECT ANSWER: ARC VAULT JUMP ANIMATION */
      @keyframes ninjaVaultJump {
        0% { transform: translateY(0) translateX(0) rotate(6deg); }
        40% { transform: translateY(-85px) translateX(40px) rotate(-22deg) scale(1.1); }
        70% { transform: translateY(-30px) translateX(60px) rotate(-10deg); }
        100% { transform: translateY(0) translateX(0) rotate(6deg); }
      }

      /* WRONG ANSWER: TILE TRIP STUMBLE ANIMATION */
      @keyframes ninjaTripStumble {
        0% { transform: translateX(0) rotate(0deg); }
        25% { transform: translateX(-35px) translateY(-10px) rotate(-25deg); }
        60% { transform: translateX(15px) rotate(15deg); }
        100% { transform: translateX(0) rotate(6deg); }
      }

      /* GAME OVER: FALL OFF THE ROOF ANIMATION */
      @keyframes ninjaFallOffRoof {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
        30% { transform: translateY(-20px) rotate(-30deg); opacity: 1; }
        100% { transform: translateY(220px) translateX(-60px) rotate(420deg) scale(0.5); opacity: 0; }
      }

      .animate-vault-jump { animation: ninjaVaultJump 0.55s cubic-bezier(0.25, 1, 0.5, 1) forwards !important; }
      .animate-trip-stumble { animation: ninjaTripStumble 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards !important; }
      .animate-fall-off { animation: ninjaFallOffRoof 0.85s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards !important; }

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
      <div class="chase-arena-grid">
        
        <!-- LEFT COLUMN: DYNAMIC MOONLIT ROOFTOP CHASE ARENA -->
        <div id="chaseArenaLeftCol" style="
          background: linear-gradient(180deg, #090d16 0%, #1e1b4b 100%); 
          border-radius: 16px; 
          padding: 20px; 
          position: relative; 
          min-height: 480px; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          overflow: hidden; 
          border: 2px solid #6366f1;
        ">
          
          <!-- HEADER: STAMINA SCROLLS, AUDIO TOGGLE & DISTANCE -->
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 5;">
            <div id="chaseScrollsDisplay" style="background: rgba(15, 23, 42, 0.85); border: 2px solid #f59e0b; padding: 6px 14px; border-radius: 10px; color: #fbbf24; font-weight: 900; font-size: 1.1rem; display: flex; align-items: center; gap: 6px;">
              📜 📜 📜
            </div>

            <!-- AUDIO MUTE TOGGLE BUTTON -->
            <button id="btnToggleChaseSound" style="
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

            <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid #38bdf8; padding: 6px 14px; border-radius: 10px; color: #38bdf8; font-weight: 900; font-size: 1.1rem;">
              🏃 <span id="chaseDistanceCount">0</span>m
            </div>
          </div>

          <!-- CENTER ARENA: MOVING PAGODA ROOFTOP & RUNNING NINJA -->
          <div style="position: relative; height: 310px; display: flex; justify-content: center; align-items: flex-end; z-index: 3; width: 100%;">
            
            <!-- MOON & SILHOUETTE BACKDROP -->
            <div style="position: absolute; top: 15px; right: 25px; width: 75px; height: 75px; background: #fef08a; border-radius: 50%; box-shadow: 0 0 30px #fef08a; opacity: 0.85; pointer-events: none;"></div>
            
            <!-- CONTINUOUS SCROLLING ROOFTOP TRACK -->
            <div id="roofTrack" class="scrolling-roof-track">
              <!-- STRIP 1 -->
              <svg width="50%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none">
                <path d="M0,45 L80,25 L160,55 L240,20 L320,50 L400,30 L400,120 L0,120 Z" fill="#1e293b" stroke="#334155" stroke-width="2"/>
                <path d="M0,70 L100,50 L200,80 L300,45 L400,65 L400,120 L0,120 Z" fill="#0f172a" />
              </svg>
              <!-- STRIP 2 -->
              <svg width="50%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none">
                <path d="M0,45 L80,25 L160,55 L240,20 L320,50 L400,30 L400,120 L0,120 Z" fill="#1e293b" stroke="#334155" stroke-width="2"/>
                <path d="M0,70 L100,50 L200,80 L300,45 L400,65 L400,120 L0,120 Z" fill="#0f172a" />
              </svg>
            </div>

            <!-- ANIMATED RUNNING NINJA EMOJI AVATAR -->
            <div id="chaseNinjaAvatar" class="ninja-running" style="
              position: absolute; bottom: 55px; left: 40%;
              font-size: 3.8rem; filter: drop-shadow(0 8px 12px rgba(0,0,0,0.85));
              z-index: 10;
            ">
              🥷<span style="font-size: 2rem; margin-left: -10px; opacity: 0.75;">💨</span>
            </div>

            <!-- VAULT / LANDING PARTICLES EFFECT -->
            <div id="chaseVaultEffect" style="
              position: absolute; bottom: 65px; left: 50%;
              font-size: 3.5rem; opacity: 0; pointer-events: none;
              transition: opacity 0.2s ease; z-index: 12;
            ">✨</div>
          </div>

          <!-- FOOTER SPEED TIER BADGE -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 5;">
            <div style="color: #94a3b8; font-size: 0.9rem; font-weight: 800;">
              PACE: <strong id="chasePaceText" style="color: #38bdf8; font-size: 1.1rem;">MOONLIGHT SPRINT (8.0s)</strong>
            </div>
            <span style="color: #818cf8; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px;">ROOFTOP CHASE</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: QUESTION & ENHANCED KEYPAD -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div id="fluencyFeedbackBadge" style="height: 32px; line-height: 32px; text-align: center; font-weight: 800; font-size: 0.95rem; border-radius: 8px; margin-bottom: 8px; visibility: hidden;">--</div>

          <div id="fluencyPrompt" style="font-size: 2.8rem; font-weight: 900; color: var(--text-main); text-align: center; margin-bottom: 8px; background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 12px;">--</div>

          <!-- REAL-TIME BURNING EMBER FUSE TIMER BAR -->
          <div style="width: 100%; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
            <div id="chaseFuseBar" style="width: 100%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%); transition: width 0.1s linear;"></div>
          </div>

          <div id="fluencyAnswerBox" style="font-size: 2.2rem; font-weight: 800; height: 54px; line-height: 54px; text-align: center; background: var(--bg-card); border: 2px dashed var(--border-color); border-radius: 12px; margin-bottom: 14px; color: #38bdf8;">?</div>

          <!-- 4-COLUMN KEYPAD GRID WITH 4TH COLUMN ACTION BAR -->
          <div class="chase-keypad-grid">
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
  nextQuestion(currentUser, onFinishCallback);
}

function setupAudioToggle(container) {
  const toggleBtn = container.querySelector('#btnToggleChaseSound');
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
      chaseAudio.stopBGM();
    } else {
      const tier = engine ? engine.getCurrentTier() : { bpm: 110 };
      chaseAudio.startBGM(tier.bpm);
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

function startQuestionTimer(onFinishCallback) {
  clearInterval(questionTimerInterval);
  currentTimeLimit = engine.getCurrentTimeLimit();
  timeRemaining = currentTimeLimit;

  const fuseBar = document.getElementById('chaseFuseBar');
  if (fuseBar) fuseBar.style.width = '100%';

  const startTime = Date.now();

  questionTimerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timeRemaining = Math.max(0, currentTimeLimit - elapsed);

    if (fuseBar) {
      const pct = (timeRemaining / currentTimeLimit) * 100;
      fuseBar.style.width = `${pct}%`;
    }

    if (timeRemaining <= 0) {
      clearInterval(questionTimerInterval);
      handleQuestionTimeout(onFinishCallback);
    }
  }, 50);
}

function updateBox() {
  const box = document.getElementById('fluencyAnswerBox');
  if (box) box.innerText = userAnswerStr || '?';
}

function nextQuestion(currentUser, onFinishCallback) {
  const data = getStudentFluencyData(currentUser);
  currentQ = getFluencyQuestion(data.level);

  const promptEl = document.getElementById('fluencyPrompt');
  if (promptEl) promptEl.innerText = currentQ.prompt;

  userAnswerStr = '';
  updateBox();

  startQuestionTimer(onFinishCallback);
}

function updateHUD(res) {
  const scrollEl = document.getElementById('chaseScrollsDisplay');
  const distanceEl = document.getElementById('chaseDistanceCount');
  const paceText = document.getElementById('chasePaceText');
  const roofTrack = document.getElementById('roofTrack');

  if (scrollEl) {
    let scrollsHTML = '';
    for (let i = 0; i < 3; i++) {
      scrollsHTML += i < res.scrollsLeft ? '📜 ' : '<span style="opacity: 0.25;">📜 </span>';
    }
    scrollEl.innerHTML = scrollsHTML;
  }

  if (distanceEl) distanceEl.innerText = res.distance;

  // DYNAMIC BACKGROUND SCROLL SPEED & BGM ACCELERATION
  if (paceText && res.tier) {
    paceText.innerText = `${res.tier.name} (${res.timeLimit}s)`;
    paceText.style.color = res.tier.color;

    let scrollSpeedSeconds = '3.5s';
    if (res.tier.level === 2) scrollSpeedSeconds = '2.5s';
    if (res.tier.level === 3) scrollSpeedSeconds = '1.6s';
    if (res.tier.level === 4) scrollSpeedSeconds = '1.0s';

    if (roofTrack) {
      roofTrack.style.animationDuration = scrollSpeedSeconds;
    }
  }
}

function handleQuestionTimeout(onFinishCallback) {
  chaseAudio.playScrollShatter();
  const res = engine.handleTimeout();
  updateHUD(res);

  // Reset audio BGM to 110 BPM on failure
  chaseAudio.startBGM(res.tier.bpm);

  triggerLeapAnimation(false, true, res.gameOver);

  if (res.gameOver) {
    chaseAudio.stopBGM();
    document.querySelectorAll('.f-key, #fKeyClear, #fKeyEnter').forEach(b => b.disabled = true);
    setTimeout(() => {
      const finalResults = engine.finishSession();
      onFinishCallback(finalResults);
    }, 900);
  } else {
    // Load a new question with timer reset to 8.0s
    setTimeout(() => nextQuestion(currentUser, onFinishCallback), 550);
  }
}

function submitAnswer(currentUser, onFinishCallback) {
  if (!userAnswerStr || !currentQ || userAnswerStr === '-') return;

  clearInterval(questionTimerInterval);
  const res = engine.submitAnswer(userAnswerStr, currentQ);
  updateHUD(res);

  if (res.isCorrect) {
    chaseAudio.playVaultSwoosh();
    chaseAudio.startBGM(res.tier.bpm);
  } else {
    chaseAudio.playTileCrack();
    chaseAudio.playScrollShatter();
    chaseAudio.startBGM(res.tier.bpm); // Resets audio tempo back to 110 BPM
  }

  triggerLeapAnimation(res.isCorrect, false, res.gameOver);

  if (res.gameOver) {
    chaseAudio.stopBGM();
    document.querySelectorAll('.f-key, #fKeyClear, #fKeyEnter').forEach(b => b.disabled = true);
    setTimeout(() => {
      const finalResults = engine.finishSession();
      onFinishCallback(finalResults);
    }, 900);
  } else {
    // Load a new question after vault or stumble animation
    setTimeout(() => nextQuestion(currentUser, onFinishCallback), res.isCorrect ? 400 : 550);
  }
}

function triggerLeapAnimation(isCorrect, isTimeout, isGameOver) {
  const ninja = document.getElementById('chaseNinjaAvatar');
  const vaultEffect = document.getElementById('chaseVaultEffect');
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
    badge.innerText = isCorrect 
      ? '⚡ VAULT LEAP! (+100m)' 
      : (isTimeout ? '⏰ SLIPPED OFF ROOF! Speed Reset (8.0s)' : '💥 STUMBLED ON TILES! Speed Reset (8.0s)');
    setTimeout(() => { badge.style.visibility = 'hidden'; }, 550);
  }

  if (ninja) {
    ninja.classList.remove('animate-vault-jump', 'animate-trip-stumble', 'animate-fall-off');
    void ninja.offsetWidth;

    if (isGameOver) {
      // 0 SCROLLS LEFT: FALL SPINNING OFF THE ROOF
      ninja.classList.remove('ninja-running');
      ninja.classList.add('animate-fall-off');
    } else if (isCorrect) {
      // CORRECT ANSWER: ARC VAULT JUMP OVER GAP
      ninja.classList.add('animate-vault-jump');

      if (vaultEffect) {
        vaultEffect.innerText = '✨';
        vaultEffect.style.opacity = '1';
        setTimeout(() => { vaultEffect.style.opacity = '0'; }, 350);
      }
    } else {
      // WRONG ANSWER: STUMBLE & CRACK SPARK
      ninja.classList.add('animate-trip-stumble');

      if (vaultEffect) {
        vaultEffect.innerText = '💥';
        vaultEffect.style.opacity = '1';
        setTimeout(() => { vaultEffect.style.opacity = '0'; }, 350);
      }
    }
  }
}
