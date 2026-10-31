import { SummitEngine } from './engines/summitEngine.js';
import { getFluencyQuestion } from './fluencyRegistry.js';
import { BELT_TIERS, getStudentFluencyData, evaluateLevelProgression } from './fluencyMastery.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';
let currentUserRef = null;
let syncCallbackRef = null;

export function initFluencyTab(currentUser, syncCallback) {
  currentUserRef = currentUser;
  syncCallbackRef = syncCallback;
  engine = new SummitEngine();

  renderFluencyMenu();
}

export function renderFluencyMenu() {
  const container = document.getElementById('tabFluency');
  if (!container || !currentUserRef) return;

  const fluencyData = getStudentFluencyData(currentUserRef);
  const currentBelt = BELT_TIERS[fluencyData.level] || BELT_TIERS[1];
  const nextLevelNum = Math.min(10, fluencyData.level + 1);
  const nextBelt = BELT_TIERS[nextLevelNum];

  const accColor = fluencyData.lastAccuracy >= 90 ? '#10b981' : '#ef4444';
  const speedColor = (fluencyData.lastSpeed <= 2.5 && fluencyData.lastSpeed > 0) ? '#10b981' : '#ef4444';

  container.innerHTML = `
    <!-- INLINE KEYFRAME ANIMATIONS & RESPONSIVE LANDSCAPE CSS -->
    <style>
      .summit-arena-grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 20px;
        align-items: stretch;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .summit-arena-grid {
          grid-template-columns: 1fr;
        }
      }

      .flash-correct {
        animation: pulseGreen 0.4s ease-in-out;
        border-color: #10b981 !important;
        background: rgba(16, 185, 129, 0.15) !important;
        color: #10b981 !important;
      }

      .flash-wrong {
        animation: pulseRed 0.4s ease-in-out;
        border-color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.15) !important;
        color: #ef4444 !important;
      }

      @keyframes pulseGreen {
        0% { transform: scale(1); box-shadow: 0 0 0px #10b981; }
        50% { transform: scale(1.04); box-shadow: 0 0 20px #10b981; }
        100% { transform: scale(1); box-shadow: 0 0 0px #10b981; }
      }

      @keyframes pulseRed {
        0% { transform: scale(1) translateX(0); box-shadow: 0 0 0px #ef4444; }
        25% { transform: scale(1.02) translateX(-6px); box-shadow: 0 0 20px #ef4444; }
        75% { transform: scale(1.02) translateX(6px); box-shadow: 0 0 20px #ef4444; }
        100% { transform: scale(1) translateX(0); box-shadow: 0 0 0px #ef4444; }
      }
    </style>

    <!-- SETUP CARD -->
    <div id="fluencySetupCard" class="card" style="max-width: 950px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="margin: 0;">🏔️ Summit Quest Arena</h2>
          <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.95rem;">
            Scale the mountain ledges to earn your next martial arts belt!
          </p>
        </div>
        <span style="background: rgba(79, 70, 229, 0.15); color: var(--accent); font-weight: 800; padding: 8px 16px; border-radius: 10px; font-size: 1.1rem;">
          ${currentBelt.badge} ${currentBelt.name} (Tier ${currentBelt.tier})
        </span>
      </div>

      <!-- LIVE PROGRESS STATUS CARD -->
      <div style="background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">
          🎯 Next Belt Unlock Requirements (${nextBelt.badge} ${nextBelt.name}):
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center;">
          <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Recent Accuracy</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: ${accColor}; margin: 2px 0;">
              ${fluencyData.lastAccuracy}%
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>≥ 90%</strong></div>
          </div>

          <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Recent Avg Speed</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: ${speedColor}; margin: 2px 0;">
              ${fluencyData.lastSpeed > 0 ? fluencyData.lastSpeed + 's' : '--'}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>< 2.5s / Q</strong></div>
          </div>
        </div>
      </div>

      <!-- SUMMIT QUEST RULES -->
      <div style="border: 2px solid var(--accent); border-radius: 12px; padding: 18px; background: rgba(79, 70, 229, 0.04); margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: var(--text-main);">🧗 Rules of Summit Quest</h3>
        <ul style="font-size: 0.95rem; color: var(--text-muted); margin: 0 0 16px 20px; padding: 0; line-height: 1.6;">
          <li>Reach <strong>Ledge 10 (Summit)</strong> to complete the climb.</li>
          <li>Correct answer: <strong>Climb UP 1 Ledge ⬆️</strong></li>
          <li>Wrong answer: <strong>Slip DOWN 1 Ledge ⬇️</strong></li>
          <li>Slipping below Base Camp (Ledge 0) ends your climb!</li>
        </ul>
        <button class="btn" id="startSummitBtn" style="background: var(--accent); font-weight: 800; width: 100%; padding: 14px; font-size: 1.1rem;">
          🚀 Begin Summit Quest (${currentBelt.badge} ${currentBelt.name})
        </button>
      </div>
    </div>

    <!-- ACTIVE GAME ARENA (LANDSCAPE 2-COLUMN LAYOUT) -->
    <div id="fluencyActiveCard" class="card hidden" style="width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px;">
      <div class="summit-arena-grid">
        
        <!-- LEFT COLUMN: ANIMATED MOUNTAIN SUMMIT VISUAL -->
        <div style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 20px; position: relative; min-height: 460px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border: 2px solid var(--border-color);">
          
          <!-- STAGE BANNER -->
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 2;">
            <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 800;">SUMMIT TRAIL</span>
            <span id="summitStageTitle" style="color: #38bdf8; font-size: 1.1rem; font-weight: 900; background: rgba(56, 189, 248, 0.15); padding: 4px 12px; border-radius: 8px;">
              Ledge 0 / 10
            </span>
          </div>

          <!-- MOUNTAIN BACKDROP SVG WITH CLIMB PATH & LEDGES -->
          <div style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
            <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
              <!-- MOUNTAIN PEAK SHAPE -->
              <polygon points="200,40 370,380 30,380" fill="#334155" opacity="0.6" />
              <polygon points="200,40 290,380 110,380" fill="#475569" opacity="0.8" />
              <!-- SNOW CAP -->
              <polygon points="200,40 235,110 215,100 200,115 185,100 165,110" fill="#f8fafc" />
              
              <!-- ZIG-ZAG CLIMB PATH LINE -->
              <polyline points="
                60,360 
                90,330 
                130,300 
                160,265 
                140,230 
                170,195 
                230,165 
                210,130 
                195,95 
                200,50
              " fill="none" stroke="#64748b" stroke-width="3" stroke-dasharray="6,6" />
            </svg>
          </div>

          <!-- ANIMATED CLIMBER AVATAR -->
          <div id="climberAvatar" style="
            position: absolute;
            z-index: 10;
            font-size: 2.2rem;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
            left: 50px;
            bottom: 40px;
          ">🧗‍♂️</div>

          <!-- BASE CAMP & SUMMIT ICONS -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 2; margin-top: auto;">
            <span style="font-size: 1.8rem;" title="Base Camp">⛺ <small style="font-size: 0.75rem; color: #94a3b8; display: block;">Base</small></span>
            <span style="font-size: 2rem;" title="Summit Flag">🚩 <small style="font-size: 0.75rem; color: #facc15; display: block; text-align: right;">Summit</small></span>
          </div>
        </div>

        <!-- RIGHT COLUMN: QUESTION & KEYPAD -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          
          <!-- FEEDBACK BADGE -->
          <div id="fluencyFeedbackBadge" style="
            height: 32px; 
            line-height: 32px; 
            text-align: center; 
            font-weight: 800; 
            font-size: 0.95rem; 
            border-radius: 8px;
            margin-bottom: 8px;
            transition: all 0.2s ease;
            visibility: hidden;
          ">--</div>

          <!-- QUESTION DISPLAY -->
          <div id="fluencyPrompt" style="
            font-size: 2.8rem; 
            font-weight: 900; 
            color: var(--text-main); 
            text-align: center;
            margin-bottom: 12px;
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 12px;
          ">--</div>

          <!-- ANSWER DISPLAY BOX -->
          <div id="fluencyAnswerBox" style="
            font-size: 2.2rem; 
            font-weight: 800; 
            height: 54px; 
            line-height: 54px; 
            text-align: center;
            background: var(--bg-card); 
            border: 2px dashed var(--border-color); 
            border-radius: 12px; 
            margin-bottom: 16px; 
            color: var(--accent);
            transition: all 0.2s ease;
          ">?</div>

          <!-- KEYPAD -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; margin-bottom: 12px;">
            <button class="btn f-key" data-k="1" style="font-size: 1.4rem; padding: 14px 0;">1</button>
            <button class="btn f-key" data-k="2" style="font-size: 1.4rem; padding: 14px 0;">2</button>
            <button class="btn f-key" data-k="3" style="font-size: 1.4rem; padding: 14px 0;">3</button>
            <button class="btn f-key" data-k="4" style="font-size: 1.4rem; padding: 14px 0;">4</button>
            <button class="btn f-key" data-k="5" style="font-size: 1.4rem; padding: 14px 0;">5</button>
            <button class="btn f-key" data-k="6" style="font-size: 1.4rem; padding: 14px 0;">6</button>
            <button class="btn f-key" data-k="7" style="font-size: 1.4rem; padding: 14px 0;">7</button>
            <button class="btn f-key" data-k="8" style="font-size: 1.4rem; padding: 14px 0;">8</button>
            <button class="btn f-key" data-k="9" style="font-size: 1.4rem; padding: 14px 0;">9</button>
            <button class="btn f-key" data-k="-" style="font-size: 1.4rem; padding: 14px 0; background: var(--bg-primary);">-</button>
            <button class="btn f-key" data-k="0" style="font-size: 1.4rem; padding: 14px 0;">0</button>
            <button class="btn" id="fKeyClear" style="font-size: 1.2rem; padding: 14px 0; background: var(--bg-primary); color: var(--danger); border: 1px solid var(--border-color); font-weight: 800;">C</button>
          </div>

          <button class="btn" id="fKeyEnter" style="width: 100%; background: var(--accent); color: white; font-size: 1.2rem; font-weight: 800; padding: 14px 0;">
            ↵ SUBMIT
          </button>
        </div>

      </div>
    </div>

    <!-- GAME OVER SUMMARY CARD -->
    <div id="fluencySummaryCard" class="card hidden" style="text-align: center; max-width: 520px; margin: 0 auto;">
      <h2 id="summitResultHeader" style="color: var(--accent); font-size: 2rem; margin-bottom: 8px;">🏔️ Quest Complete!</h2>
      <div id="fluencyLevelMsg" style="font-weight: 800; font-size: 1.1rem; color: #10b981; margin-bottom: 20px;"></div>

      <div style="background: var(--bg-primary); border-radius: 12px; padding: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; text-align: left; border: 1px solid var(--border-color);">
        <div>Accuracy: <strong id="sumAcc" style="color: var(--text-main); font-size: 1.1rem;">0%</strong></div>
        <div>Total Attempts: <strong id="sumQs" style="color: var(--text-main); font-size: 1.1rem;">0</strong></div>
        <div>Correct Answers: <strong id="sumCorrect" style="color: var(--text-main); font-size: 1.1rem;">0</strong></div>
        <div>Avg Speed: <strong id="sumSpeed" style="color: var(--text-main); font-size: 1.1rem;">0s</strong></div>
      </div>

      <button class="btn" id="btnRestartFluency" style="background: var(--accent); font-weight: 800; width: 100%; padding: 14px; font-size: 1.1rem;">
        ⚡ Return to Arena
      </button>
    </div>
  `;

  document.getElementById('startSummitBtn').onclick = startSummitGame;
  document.getElementById('btnRestartFluency').onclick = renderFluencyMenu;
  setupKeypadHandlers();
}

function setupKeypadHandlers() {
  document.querySelectorAll('.f-key').forEach(btn => {
    btn.onclick = () => {
      userAnswerStr += btn.getAttribute('data-k');
      updateAnswerBox();
    };
  });

  const clearBtn = document.getElementById('fKeyClear');
  if (clearBtn) {
    clearBtn.onclick = () => {
      userAnswerStr = '';
      updateAnswerBox();
    };
  }

  const enterBtn = document.getElementById('fKeyEnter');
  if (enterBtn) {
    enterBtn.onclick = submitCurrentAnswer;
  }
}

function updateAnswerBox() {
  const box = document.getElementById('fluencyAnswerBox');
  if (box) box.innerText = userAnswerStr || '?';
}

function startSummitGame() {
  document.getElementById('fluencySetupCard').classList.add('hidden');
  document.getElementById('fluencySummaryCard').classList.add('hidden');
  document.getElementById('fluencyActiveCard').classList.remove('hidden');

  engine.startSession();
  updateClimberPosition(0);
  nextQuestion();
}

function nextQuestion() {
  const fluencyData = getStudentFluencyData(currentUserRef);
  currentQ = getFluencyQuestion(fluencyData.level);

  const promptEl = document.getElementById('fluencyPrompt');
  if (promptEl) promptEl.innerText = currentQ.prompt;

  userAnswerStr = '';
  updateAnswerBox();
}

// COORD MAP FOR STEP 0 -> STEP 10 ALONG MOUNTAIN TRAIL
const LEDGE_COORDINATES = [
  { left: '45px', bottom: '30px' },   // Step 0 (Base Camp)
  { left: '80px', bottom: '65px' },   // Step 1
  { left: '120px', bottom: '100px' }, // Step 2
  { left: '150px', bottom: '135px' }, // Step 3
  { left: '130px', bottom: '170px' }, // Step 4
  { left: '160px', bottom: '205px' }, // Step 5
  { left: '220px', bottom: '235px' }, // Step 6
  { left: '200px', bottom: '270px' }, // Step 7
  { left: '185px', bottom: '305px' }, // Step 8
  { left: '192px', bottom: '340px' }, // Step 9
  { left: '195px', bottom: '360px' }  // Step 10 (Summit Peak)
];

function updateClimberPosition(step) {
  const climber = document.getElementById('climberAvatar');
  const title = document.getElementById('summitStageTitle');

  const safeStep = Math.min(10, Math.max(0, step));
  const coord = LEDGE_COORDINATES[safeStep];

  if (climber && coord) {
    climber.style.left = coord.left;
    climber.style.bottom = coord.bottom;
  }

  if (title) {
    title.innerText = `Ledge ${safeStep} / 10`;
  }
}

function submitCurrentAnswer() {
  if (!userAnswerStr || !currentQ) return;

  const res = engine.submitAnswer(userAnswerStr, currentQ);
  triggerVisualFeedback(res.isCorrect);

  updateClimberPosition(res.currentStep);

  if (res.gameOver) {
    setTimeout(() => handleGameOver(res), 600);
  } else {
    setTimeout(() => nextQuestion(), 400);
  }
}

function triggerVisualFeedback(isCorrect) {
  const answerBox = document.getElementById('fluencyAnswerBox');
  const badge = document.getElementById('fluencyFeedbackBadge');

  if (answerBox) {
    answerBox.classList.remove('flash-correct', 'flash-wrong');
    // Trigger reflow to restart animation
    void answerBox.offsetWidth;

    if (isCorrect) {
      answerBox.classList.add('flash-correct');
    } else {
      answerBox.classList.add('flash-wrong');
    }

    setTimeout(() => {
      answerBox.classList.remove('flash-correct', 'flash-wrong');
    }, 450);
  }

  if (badge) {
    badge.style.visibility = 'visible';
    if (isCorrect) {
      badge.style.background = 'rgba(16, 185, 129, 0.2)';
      badge.style.color = '#10b981';
      badge.innerText = '✅ Correct! +1 Ledge ⬆️';
    } else {
      badge.style.background = 'rgba(239, 68, 68, 0.2)';
      badge.style.color = '#ef4444';
      badge.innerText = '❌ Slip! -1 Ledge ⬇️';
    }

    setTimeout(() => {
      badge.style.visibility = 'hidden';
    }, 500);
  }
}

function handleGameOver(results) {
  document.getElementById('fluencyActiveCard').classList.add('hidden');
  document.getElementById('fluencySummaryCard').classList.remove('hidden');

  const headerEl = document.getElementById('summitResultHeader');
  if (results.victory) {
    headerEl.innerText = '🏆 SUMMIT REACHED!';
    headerEl.style.color = '#10b981';
  } else {
    headerEl.innerText = '🌊 FELL OFF BASE CAMP!';
    headerEl.style.color = '#ef4444';
  }

  document.getElementById('sumAcc').innerText = `${results.accuracy}%`;
  document.getElementById('sumQs').innerText = `${results.totalQuestions}`;
  document.getElementById('sumCorrect').innerText = `${results.correctCount}`;
  document.getElementById('sumSpeed').innerText = `${results.avgSpeed}s / Q`;

  const progression = evaluateLevelProgression(currentUserRef, results);
  document.getElementById('fluencyLevelMsg').innerText = progression.message;

  const xpEarned = results.correctCount * 5;
  if (xpEarned > 0) {
    currentUserRef.xp += xpEarned;
  }

  if (typeof syncCallbackRef === 'function') {
    syncCallbackRef(`Speed Fluency (Belt ${progression.currentLevel})`, xpEarned, 0, false);
  }
}
