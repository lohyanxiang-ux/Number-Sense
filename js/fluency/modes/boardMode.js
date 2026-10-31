import { BoardEngine } from '../engines/boardEngine.js';
import { getFluencyQuestion } from '../fluencyRegistry.js';
import { getStudentFluencyData } from '../fluencyMastery.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';
let idleTimer = null;
const IDLE_TIMEOUT_MS = 10000; // 10 Seconds

export function mountBoardMode(container, currentUser, onFinishCallback) {
  engine = new BoardEngine();

  container.innerHTML = `
    <style>
      .board-arena-grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 20px;
        align-items: stretch;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .board-arena-grid { grid-template-columns: 1fr; }
      }

      /* STRIKE & BOARD BREAK ANIMATIONS */
      @keyframes fistSmash {
        0% { transform: scale(0.6) translateY(60px) rotate(-30deg); opacity: 0; }
        40% { transform: scale(1.3) translateY(-10px) rotate(10deg); opacity: 1; }
        100% { transform: scale(1) translateY(80px) rotate(20deg); opacity: 0; }
      }

      @keyframes boardSplitLeft {
        0% { transform: translateX(0) rotate(0deg); opacity: 1; }
        100% { transform: translateX(-90px) translateY(40px) rotate(-45deg); opacity: 0; }
      }

      @keyframes boardSplitRight {
        0% { transform: translateX(0) rotate(0deg); opacity: 1; }
        100% { transform: translateX(90px) translateY(40px) rotate(45deg); opacity: 0; }
      }

      @keyframes boardCrackShake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-10px) rotate(-2deg); }
        40%, 80% { transform: translateX(10px) rotate(2deg); }
      }

      .animate-fist-smash {
        animation: fistSmash 0.35s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards;
      }

      .animate-split-left {
        animation: boardSplitLeft 0.4s ease-out forwards;
      }

      .animate-split-right {
        animation: boardSplitRight 0.4s ease-out forwards;
      }

      .animate-crack-shake {
        animation: boardCrackShake 0.3s ease-in-out;
      }

      .aura-blue {
        box-shadow: 0 0 25px rgba(56, 189, 248, 0.8), inset 0 0 15px rgba(56, 189, 248, 0.5) !important;
        border-color: #38bdf8 !important;
      }

      .aura-fire {
        box-shadow: 0 0 35px rgba(249, 115, 22, 0.9), inset 0 0 20px rgba(239, 68, 68, 0.6) !important;
        border-color: #f97316 !important;
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
      <div class="board-arena-grid">
        
        <!-- LEFT COLUMN: DOJO BOARD BREAK ARENA -->
        <div style="background: linear-gradient(180deg, #180e04 0%, #2e1708 100%); border-radius: 16px; padding: 20px; position: relative; min-height: 460px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border: 2px solid #b45309;">
          
          <!-- HEADER: BOARDS REMAINING & STREAK BADGE -->
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 5;">
            <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid #f59e0b; padding: 6px 14px; border-radius: 10px; color: #fbbf24; font-weight: 900; font-size: 1.1rem;">
              🪵 BOARDS: <span id="boardsRemainingCount">20</span> / 20
            </div>

            <div id="boardStreakBadge" style="background: rgba(15, 23, 42, 0.85); border: 1px solid #64748b; color: #94a3b8; font-weight: 900; padding: 6px 14px; border-radius: 10px; font-size: 0.95rem; transition: all 0.3s ease;">
              🔥 STREAK: 0 (1 Board/Hit)
            </div>
          </div>

          <!-- CENTER ARENA: BOARD STACK & FIGHTER STRIKE SPRITE -->
          <div style="position: relative; height: 280px; display: flex; justify-content: center; align-items: center; z-index: 3; width: 100%;">
            
            <!-- BOARD STACK CONTAINER -->
            <div id="boardStackVisual" style="position: relative; width: 220px; height: 180px; display: flex; flex-direction: column-reverse; align-items: center; justify-content: flex-start; gap: 4px; transition: transform 0.2s ease;">
              <!-- Dynamic wooden boards rendered via JS -->
            </div>

            <!-- ANIMATING STRIKING FIST / PALM -->
            <div id="fistSprite" style="
              position: absolute;
              top: 20px;
              left: 50%;
              font-size: 4rem;
              opacity: 0;
              pointer-events: none;
              z-index: 10;
              filter: drop-shadow(0 6px 12px rgba(0,0,0,0.8));
            ">👊</div>

            <!-- FLYING SPLIT BOARD HALVES -->
            <div id="splitBoardLeft" style="position: absolute; width: 100px; height: 26px; background: #854d0e; border: 2px solid #713f12; border-radius: 4px; opacity: 0; pointer-events: none; z-index: 9;"></div>
            <div id="splitBoardRight" style="position: absolute; width: 100px; height: 26px; background: #854d0e; border: 2px solid #713f12; border-radius: 4px; opacity: 0; pointer-events: none; z-index: 9;"></div>

            <!-- IMPACT SPARK / DUST EFFECT -->
            <div id="boardImpactEffect" style="
              position: absolute;
              font-size: 4rem;
              opacity: 0;
              pointer-events: none;
              z-index: 12;
              transition: opacity 0.2s ease;
            ">💥</div>
          </div>

          <!-- FOOTER POWER METER -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 5;">
            <div style="color: #d97706; font-size: 0.9rem; font-weight: 800;">
              POWER MODE: <strong id="boardPowerText" style="color: #f59e0b; font-size: 1.1rem;">NORMAL (1 BOARD)</strong>
            </div>
            <span style="color: #93c5fd; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px;">DOJO BOARD BREAK</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: QUESTION & KEYPAD -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div id="fluencyFeedbackBadge" style="height: 32px; line-height: 32px; text-align: center; font-weight: 800; font-size: 0.95rem; border-radius: 8px; margin-bottom: 8px; visibility: hidden;">--</div>

          <div id="fluencyPrompt" style="font-size: 2.8rem; font-weight: 900; color: var(--text-main); text-align: center; margin-bottom: 12px; background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 12px;">--</div>

          <div id="fluencyAnswerBox" style="font-size: 2.2rem; font-weight: 800; height: 54px; line-height: 54px; text-align: center; background: var(--bg-card); border: 2px dashed var(--border-color); border-radius: 12px; margin-bottom: 16px; color: #f59e0b;">?</div>

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

          <button class="btn" id="fKeyEnter" style="width: 100%; background: #d97706; color: white; font-size: 1.2rem; font-weight: 800; padding: 14px 0;">↵ SUBMIT</button>
        </div>

      </div>
    </div>
  `;

  setupKeypad(currentUser, onFinishCallback);
  engine.startSession();
  renderBoardStack(20, 0);
  nextQuestion(currentUser, onFinishCallback);
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

function startIdleTimer(currentUser, onFinishCallback) {
  clearIdleTimer();
  idleTimer = setTimeout(() => {
    triggerIdleTimeout(onFinishCallback);
  }, IDLE_TIMEOUT_MS);
}

function clearIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

function updateBox() {
  const box = document.getElementById('fluencyAnswerBox');
  if (box) box.innerText = userAnswerStr || '?';
}

function renderBoardStack(remaining, streak) {
  const container = document.getElementById('boardStackVisual');
  const countEl = document.getElementById('boardsRemainingCount');
  const streakBadge = document.getElementById('boardStreakBadge');
  const powerText = document.getElementById('boardPowerText');

  if (countEl) countEl.innerText = remaining;

  if (streakBadge && powerText) {
    if (streak >= 5) {
      streakBadge.style.background = 'rgba(249, 115, 22, 0.2)';
      streakBadge.style.borderColor = '#f97316';
      streakBadge.style.color = '#f97316';
      streakBadge.innerText = `🔥 RAGE STREAK: ${streak} (3 BOARDS/HIT!)`;
      powerText.innerText = '🔥 FIRE RAGE (3 BOARDS)';
      powerText.style.color = '#f97316';
    } else if (streak >= 3) {
      streakBadge.style.background = 'rgba(56, 189, 248, 0.2)';
      streakBadge.style.borderColor = '#38bdf8';
      streakBadge.style.color = '#38bdf8';
      streakBadge.innerText = `💙 BLUE ENERGY: ${streak} (2 BOARDS/HIT)`;
      powerText.innerText = '💙 BLUE ENERGY (2 BOARDS)';
      powerText.style.color = '#38bdf8';
    } else {
      streakBadge.style.background = 'rgba(15, 23, 42, 0.85)';
      streakBadge.style.borderColor = '#64748b';
      streakBadge.style.color = '#94a3b8';
      streakBadge.innerText = `🔥 STREAK: ${streak} (1 Board/Hit)`;
      powerText.innerText = 'NORMAL (1 BOARD)';
      powerText.style.color = '#f59e0b';
    }
  }

  if (!container) return;
  container.innerHTML = '';

  const displayCount = Math.min(6, remaining);
  for (let i = 0; i < displayCount; i++) {
    const board = document.createElement('div');
    board.style.width = '200px';
    board.style.height = '24px';
    board.style.background = 'linear-gradient(90deg, #a16207 0%, #ca8a04 50%, #a16207 100%)';
    board.style.border = '2px solid #713f12';
    board.style.borderRadius = '6px';
    board.style.transition = 'all 0.3s ease';

    if (i === displayCount - 1) {
      if (streak >= 5) board.classList.add('aura-fire');
      else if (streak >= 3) board.classList.add('aura-blue');
    }

    container.appendChild(board);
  }
}

function nextQuestion(currentUser, onFinishCallback) {
  const data = getStudentFluencyData(currentUser);
  currentQ = getFluencyQuestion(data.level);

  const promptEl = document.getElementById('fluencyPrompt');
  if (promptEl) promptEl.innerText = currentQ.prompt;

  userAnswerStr = '';
  updateBox();

  startIdleTimer(currentUser, onFinishCallback);
}

function triggerIdleTimeout(onFinishCallback) {
  clearIdleTimer();
  document.querySelectorAll('.f-key, #fKeyClear, #fKeyEnter').forEach(b => b.disabled = true);

  const box = document.getElementById('fluencyAnswerBox');
  const badge = document.getElementById('fluencyFeedbackBadge');
  const container = document.getElementById('boardStackVisual');

  if (box) box.classList.add('flash-wrong');

  if (badge) {
    badge.style.visibility = 'visible';
    badge.style.background = 'rgba(239, 68, 68, 0.2)';
    badge.style.color = '#ef4444';
    badge.innerText = '⏰ 10s TIME OUT! Stance Broken! 💥';
  }

  if (container) {
    container.classList.add('animate-crack-shake');
  }

  const results = engine.handleTimeout();
  setTimeout(() => { onFinishCallback(results); }, 1000);
}

function submitAnswer(currentUser, onFinishCallback) {
  if (!userAnswerStr || !currentQ) return;

  clearIdleTimer();
  const res = engine.submitAnswer(userAnswerStr, currentQ);
  triggerStrikeAnimation(res.isCorrect, res.boardsBroken, res.currentStreak);
  renderBoardStack(res.boardsRemaining, res.currentStreak);

  if (res.gameOver) {
    document.querySelectorAll('.f-key, #fKeyClear, #fKeyEnter').forEach(b => b.disabled = true);
    if (res.failedConsecutive) {
      const badge = document.getElementById('fluencyFeedbackBadge');
      if (badge) {
        badge.style.visibility = 'visible';
        badge.style.background = 'rgba(239, 68, 68, 0.2)';
        badge.style.color = '#ef4444';
        badge.innerText = '❌ 3 CONSECUTIVE MISSES! Trial Failed! 💥';
      }
    }
    setTimeout(() => onFinishCallback(res), 800);
  } else {
    setTimeout(() => nextQuestion(currentUser, onFinishCallback), 450);
  }
}

function triggerStrikeAnimation(isCorrect, boardsBroken, streak) {
  const fist = document.getElementById('fistSprite');
  const leftHalf = document.getElementById('splitBoardLeft');
  const rightHalf = document.getElementById('splitBoardRight');
  const impactEffect = document.getElementById('boardImpactEffect');
  const container = document.getElementById('boardStackVisual');
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
    badge.innerText = isCorrect ? `💥 SMASH! -${boardsBroken} Board(s)!` : '❌ CRACK! Strike Missed!';
    setTimeout(() => { badge.style.visibility = 'hidden'; }, 450);
  }

  if (isCorrect) {
    if (fist) {
      fist.innerText = streak >= 5 ? '🔥' : (streak >= 3 ? '⚡' : '👊');
      fist.classList.remove('animate-fist-smash');
      void fist.offsetWidth;
      fist.classList.add('animate-fist-smash');
    }

    if (leftHalf && rightHalf) {
      leftHalf.classList.remove('animate-split-left');
      rightHalf.classList.remove('animate-split-right');
      void leftHalf.offsetWidth;
      leftHalf.classList.add('animate-split-left');
      rightHalf.classList.add('animate-split-right');
    }

    if (impactEffect) {
      impactEffect.innerText = streak >= 5 ? '🔥' : '⚡';
      impactEffect.style.opacity = '1';
      setTimeout(() => { impactEffect.style.opacity = '0'; }, 250);
    }
  } else {
    if (container) {
      container.classList.remove('animate-crack-shake');
      void container.offsetWidth;
      container.classList.add('animate-crack-shake');
    }
  }
}
