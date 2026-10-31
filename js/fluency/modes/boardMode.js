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

      /* ARENA LEFT COLUMN MODE STYLES & TRANSITIONS */
      .arena-theme-normal {
        background: linear-gradient(180deg, #180e04 0%, #2e1708 100%) !important;
        border-color: #b45309 !important;
        box-shadow: 0 0 20px rgba(180, 83, 9, 0.2) !important;
      }

      .arena-theme-blue {
        background: linear-gradient(180deg, #031738 0%, #0c4a6e 100%) !important;
        border-color: #38bdf8 !important;
        box-shadow: 0 0 35px rgba(56, 189, 248, 0.45), inset 0 0 25px rgba(56, 189, 248, 0.25) !important;
      }

      .arena-theme-fire {
        background: linear-gradient(180deg, #3b0700 0%, #7c2d12 100%) !important;
        border-color: #f97316 !important;
        box-shadow: 0 0 45px rgba(249, 115, 22, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.35) !important;
      }

      /* STRIKE & BOARD BREAKING ANIMATIONS */
      @keyframes fistSmash {
        0% { transform: translate(-50%, -60px) scale(0.6) rotate(-25deg); opacity: 0; }
        40% { transform: translate(-50%, 15px) scale(1.3) rotate(10deg); opacity: 1; }
        100% { transform: translate(-50%, 90px) scale(1) rotate(25deg); opacity: 0; }
      }

      @keyframes boardShatterLeft {
        0% { transform: translateX(0) rotate(0deg) scale(1); opacity: 1; }
        100% { transform: translateX(-140px) translateY(40px) rotate(-55deg) scale(0.7); opacity: 0; }
      }

      @keyframes boardShatterRight {
        0% { transform: translateX(0) rotate(0deg) scale(1); opacity: 1; }
        100% { transform: translateX(140px) translateY(40px) rotate(55deg) scale(0.7); opacity: 0; }
      }

      @keyframes boardCrackShake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-12px) rotate(-2deg); }
        40%, 80% { transform: translateX(12px) rotate(2deg); }
      }

      .animate-fist-smash {
        animation: fistSmash 0.35s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards;
      }

      .animate-shatter-left {
        animation: boardShatterLeft 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
      }

      .animate-shatter-right {
        animation: boardShatterRight 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards !important;
      }

      .animate-crack-shake {
        animation: boardCrackShake 0.3s ease-in-out;
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
        
        <!-- LEFT COLUMN: DOJO BOARD BREAK ARENA (DYNAMIC THEME SWITCHING) -->
        <div id="boardArenaLeftCol" class="arena-theme-normal" style="
          border-radius: 16px; 
          padding: 20px; 
          position: relative; 
          min-height: 480px; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          overflow: hidden; 
          border: 2px solid #b45309; 
          transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
        ">
          
          <!-- HEADER: BOARDS REMAINING & STREAK BADGE -->
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 5;">
            <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid #f59e0b; padding: 6px 14px; border-radius: 10px; color: #fbbf24; font-weight: 900; font-size: 1.1rem;">
              🪵 BOARDS: <span id="boardsRemainingCount">20</span> / 20
            </div>

            <div id="boardStreakBadge" style="background: rgba(15, 23, 42, 0.85); border: 1px solid #64748b; color: #94a3b8; font-weight: 900; padding: 6px 14px; border-radius: 10px; font-size: 0.95rem; transition: all 0.3s ease;">
              🔥 STREAK: 0 (1 Board/Hit)
            </div>
          </div>

          <!-- CENTER ARENA: FULL 20-BOARD PHYSICAL STACK -->
          <div style="position: relative; height: 320px; display: flex; justify-content: center; align-items: flex-end; z-index: 3; width: 100%; padding-bottom: 10px;">
            
            <!-- 20-BOARD STACK CONTAINER -->
            <div id="boardStackVisual" style="
              position: relative; 
              width: 210px; 
              display: flex; 
              flex-direction: column-reverse; 
              align-items: center; 
              gap: 2px; 
              transition: transform 0.2s ease;
            ">
              <!-- All 20 physical boards rendered via JS -->
            </div>

            <!-- ANIMATING STRIKING FIST / FIRE / LIGHTNING -->
            <div id="fistSprite" style="
              position: absolute;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              font-size: 4.5rem;
              opacity: 0;
              pointer-events: none;
              z-index: 10;
              filter: drop-shadow(0 6px 14px rgba(0,0,0,0.8));
            ">👊</div>

            <!-- IMPACT SPARK EFFECT -->
            <div id="boardImpactEffect" style="
              position: absolute;
              top: 40%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 4.5rem;
              opacity: 0;
              pointer-events: none;
              z-index: 12;
              transition: opacity 0.2s ease;
            ">💥</div>
          </div>

          <!-- FOOTER POWER METER -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 5;">
            <div style="color: #94a3b8; font-size: 0.9rem; font-weight: 800;">
              POWER MODE: <strong id="boardPowerText" style="color: #f59e0b; font-size: 1.1rem;">NORMAL (1 BOARD)</strong>
            </div>
            <span style="color: #cbd5e1; font-size: 0.8rem; font-weight: 800; letter-spacing: 1px;">DOJO BOARD BREAK</span>
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
  renderFullPhysicalStack(20, 0);
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

function renderFullPhysicalStack(remaining, streak) {
  const leftCol = document.getElementById('boardArenaLeftCol');
  const container = document.getElementById('boardStackVisual');
  const countEl = document.getElementById('boardsRemainingCount');
  const streakBadge = document.getElementById('boardStreakBadge');
  const powerText = document.getElementById('boardPowerText');

  if (countEl) countEl.innerText = remaining;

  // DYNAMIC THEME & COLOUR SWITCHING OF ENTIRE LEFT COLUMN
  if (leftCol && streakBadge && powerText) {
    leftCol.classList.remove('arena-theme-normal', 'arena-theme-blue', 'arena-theme-fire');

    if (streak >= 5) {
      leftCol.classList.add('arena-theme-fire');
      streakBadge.style.background = 'rgba(249, 115, 22, 0.25)';
      streakBadge.style.borderColor = '#f97316';
      streakBadge.style.color = '#f97316';
      streakBadge.innerText = `🔥 RAGE MODE: ${streak} (3 BOARDS/HIT!)`;
      powerText.innerText = '🔥 FIRE RAGE (3 BOARDS)';
      powerText.style.color = '#f97316';
    } else if (streak >= 3) {
      leftCol.classList.add('arena-theme-blue');
      streakBadge.style.background = 'rgba(56, 189, 248, 0.25)';
      streakBadge.style.borderColor = '#38bdf8';
      streakBadge.style.color = '#38bdf8';
      streakBadge.innerText = `💙 BLUE ENERGY: ${streak} (2 BOARDS/HIT)`;
      powerText.innerText = '💙 BLUE ENERGY (2 BOARDS)';
      powerText.style.color = '#38bdf8';
    } else {
      leftCol.classList.add('arena-theme-normal');
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

  // RENDER ALL 20 PHYSICAL BOARDS IN THE STACK
  for (let i = 0; i < remaining; i++) {
    const board = document.createElement('div');
    board.className = 'board-item-row';
    board.dataset.boardIndex = i;
    board.style.width = '200px';
    board.style.height = '11px';
    board.style.borderRadius = '3px';
    board.style.position = 'relative';
    board.style.display = 'flex';
    board.style.justifyConstraint = 'center';
    board.style.overflow = 'visible';
    board.style.boxSizing = 'border-box';

    // Board styling based on active streak mode
    if (streak >= 5) {
      board.style.background = 'linear-gradient(90deg, #ea580c 0%, #fb923c 50%, #ea580c 100%)';
      board.style.border = '1px solid #7c2d12';
      board.style.boxShadow = '0 0 8px rgba(249, 115, 22, 0.6)';
    } else if (streak >= 3) {
      board.style.background = 'linear-gradient(90deg, #0284c7 0%, #38bdf8 50%, #0284c7 100%)';
      board.style.border = '1px solid #0c4a6e';
      board.style.boxShadow = '0 0 8px rgba(56, 189, 248, 0.6)';
    } else {
      board.style.background = 'linear-gradient(90deg, #78350f 0%, #b45309 50%, #78350f 100%)';
      board.style.border = '1px solid #451a03';
      board.style.boxShadow = '0 1px 3px rgba(0,0,0,0.5)';
    }

    // INNER SPLIT HALVES FOR SHATTER ANIMATION
    board.innerHTML = `
      <div class="board-half-left" style="width: 50%; height: 100%; background: inherit; border-radius: 3px 0 0 3px;"></div>
      <div class="board-half-right" style="width: 50%; height: 100%; background: inherit; border-radius: 0 3px 3px 0;"></div>
    `;

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

  // Allow shatter animation to play before re-rendering board stack
  setTimeout(() => {
    renderFullPhysicalStack(res.boardsRemaining, res.currentStreak);
  }, 280);

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
    badge.innerText = isCorrect ? `💥 POWER SMASH! -${boardsBroken} Board(s)!` : '❌ MISS! Board Cracked!';
    setTimeout(() => { badge.style.visibility = 'hidden'; }, 450);
  }

  if (isCorrect) {
    // 1. ANIMATE FIST SMASH
    if (fist) {
      fist.innerText = streak >= 5 ? '🔥' : (streak >= 3 ? '⚡' : '👊');
      fist.classList.remove('animate-fist-smash');
      void fist.offsetWidth;
      fist.classList.add('animate-fist-smash');
    }

    // 2. SHATTER TOP N PHYSICAL BOARDS FROM STACK
    if (container) {
      const boardRows = Array.from(container.children);
      const targetRows = boardRows.slice(-boardsBroken); // Top N boards in stack

      targetRows.forEach(row => {
        const leftHalf = row.querySelector('.board-half-left');
        const rightHalf = row.querySelector('.board-half-right');

        if (leftHalf && rightHalf) {
          leftHalf.classList.add('animate-shatter-left');
          rightHalf.classList.add('animate-shatter-right');
        }
      });
    }

    // 3. IMPACT LIGHTNING / FIRE EFFECT
    if (impactEffect) {
      impactEffect.innerText = streak >= 5 ? '🔥' : (streak >= 3 ? '⚡' : '💥');
      impactEffect.style.opacity = '1';
      setTimeout(() => { impactEffect.style.opacity = '0'; }, 300);
    }
  } else {
    // WRONG ANSWER: CRACK AND SHAKE STACK
    if (container) {
      container.classList.remove('animate-crack-shake');
      void container.offsetWidth;
      container.classList.add('animate-crack-shake');
    }
  }
}
