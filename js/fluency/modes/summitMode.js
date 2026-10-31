import { SummitEngine } from '../engines/summitEngine.js';
import { getFluencyQuestion } from '../fluencyRegistry.js';
import { getStudentFluencyData } from '../fluencyMastery.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';
let idleTimer = null;
const IDLE_TIMEOUT_MS = 10000; // 10 seconds

const LEDGE_COORDINATES = [
  { left: '45px', bottom: '30px' },    // Step 0 (Base Camp)
  { left: '80px', bottom: '70px' },    // Step 1
  { left: '120px', bottom: '110px' },  // Step 2
  { left: '155px', bottom: '150px' },  // Step 3
  { left: '135px', bottom: '190px' },  // Step 4
  { left: '170px', bottom: '230px' },  // Step 5
  { left: '220px', bottom: '270px' },  // Step 6
  { left: '190px', bottom: '310px' },  // Step 7
  { left: '175px', bottom: '345px' },  // Step 8
  { left: '188px', bottom: '375px' },  // Step 9
  { left: '50%', bottom: '395px' }     // Step 10 (Summit Peak under Flag)
];

export function mountSummitMode(container, currentUser, onFinishCallback) {
  engine = new SummitEngine();

  container.innerHTML = `
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
        .summit-arena-grid { grid-template-columns: 1fr; }
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
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); box-shadow: 0 0 20px #10b981; }
      }

      @keyframes pulseRed {
        0%, 100% { transform: scale(1); }
        25%, 75% { transform: scale(1.02) translateX(-4px); box-shadow: 0 0 20px #ef4444; }
      }
    </style>

    <div class="card" style="width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px;">
      <div class="summit-arena-grid">
        
        <!-- MOUNTAIN ANIMATION COLUMN -->
        <div style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 20px; position: relative; min-height: 460px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border: 2px solid var(--border-color);">
          
          <!-- STAGE HEADER -->
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 2;">
            <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 800;">SUMMIT TRAIL</span>
            <span id="summitStageTitle" style="color: #38bdf8; font-size: 1.1rem; font-weight: 900; background: rgba(56, 189, 248, 0.15); padding: 4px 12px; border-radius: 8px;">
              Ledge 0 / 10
            </span>
          </div>

          <!-- MOUNTAIN PEAK FLAG (TOP CENTER) -->
          <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 5; text-align: center;">
            <span style="font-size: 2rem; display: block; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));">🚩</span>
            <span style="font-size: 0.75rem; font-weight: 900; color: #facc15; background: rgba(15, 23, 42, 0.85); padding: 2px 8px; border-radius: 6px; border: 1px solid #facc15;">SUMMIT</span>
          </div>

          <!-- SVG MOUNTAIN PATH -->
          <div style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
            <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
              <polygon points="200,30 370,380 30,380" fill="#334155" opacity="0.6" />
              <polygon points="200,30 290,380 110,380" fill="#475569" opacity="0.8" />
              <polygon points="200,30 230,95 212,88 200,102 188,88 170,95" fill="#f8fafc" />
              
              <!-- TRAIL FROM BASE TO SUMMIT PEAK -->
              <polyline points="
                45,360 
                80,320 
                120,280 
                155,240 
                135,200 
                170,160 
                220,120 
                190,85 
                175,55 
                200,35
              " fill="none" stroke="#64748b" stroke-width="3" stroke-dasharray="6,6" />
            </svg>
          </div>

          <!-- ANIMATED CLIMBER AVATAR -->
          <div id="climberAvatar" style="
            position: absolute; z-index: 10; font-size: 2.2rem;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
            left: 45px; bottom: 30px; transform: translateX(-50%);
          ">🧗‍♂️</div>

          <!-- BASE CAMP (BOTTOM LEFT) -->
          <div style="position: absolute; bottom: 12px; left: 16px; z-index: 5; text-align: center;">
            <span style="font-size: 1.8rem; display: block;">⛺</span>
            <span style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; background: rgba(15, 23, 42, 0.7); padding: 2px 6px; border-radius: 4px;">BASE</span>
          </div>
        </div>

        <!-- KEYPAD & QUESTION COLUMN -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div id="fluencyFeedbackBadge" style="height: 32px; line-height: 32px; text-align: center; font-weight: 800; font-size: 0.95rem; border-radius: 8px; margin-bottom: 8px; visibility: hidden;">--</div>

          <div id="fluencyPrompt" style="font-size: 2.8rem; font-weight: 900; color: var(--text-main); text-align: center; margin-bottom: 12px; background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 12px;">--</div>

          <div id="fluencyAnswerBox" style="font-size: 2.2rem; font-weight: 800; height: 54px; line-height: 54px; text-align: center; background: var(--bg-card); border: 2px dashed var(--border-color); border-radius: 12px; margin-bottom: 16px; color: var(--accent);">?</div>

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

          <button class="btn" id="fKeyEnter" style="width: 100%; background: var(--accent); color: white; font-size: 1.2rem; font-weight: 800; padding: 14px 0;">↵ SUBMIT</button>
        </div>

      </div>
    </div>
  `;

  setupKeypad(currentUser, onFinishCallback);
  engine.startSession();
  updateClimber(0);
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
  clearTimeout(idleTimer);
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

function nextQuestion(currentUser, onFinishCallback) {
  const data = getStudentFluencyData(currentUser);
  currentQ = getFluencyQuestion(data.level);

  const promptEl = document.getElementById('fluencyPrompt');
  if (promptEl) promptEl.innerText = currentQ.prompt;

  userAnswerStr = '';
  updateBox();

  startIdleTimer(currentUser, onFinishCallback);
}

function updateClimber(step) {
  const safeStep = Math.min(10, Math.max(0, step));
  const climber = document.getElementById('climberAvatar');
  const title = document.getElementById('summitStageTitle');
  const coord = LEDGE_COORDINATES[safeStep];

  if (climber && coord) {
    climber.style.left = coord.left;
    climber.style.bottom = coord.bottom;
    climber.style.transform = 'translateX(-50%)';
  }
  if (title) title.innerText = `Ledge ${safeStep} / 10`;
}

function triggerIdleTimeout(onFinishCallback) {
  clearIdleTimer();

  const climber = document.getElementById('climberAvatar');
  const badge = document.getElementById('fluencyFeedbackBadge');
  const box = document.getElementById('fluencyAnswerBox');

  // Disable keypad buttons
  document.querySelectorAll('.f-key, #fKeyClear, #fKeyEnter').forEach(b => b.disabled = true);

  if (box) box.classList.add('flash-wrong');

  if (badge) {
    badge.style.visibility = 'visible';
    badge.style.background = 'rgba(239, 68, 68, 0.2)';
    badge.style.color = '#ef4444';
    badge.innerText = '⏰ 10s TIME OUT! Fell off the cliff! 💥';
  }

  // Animate climber tumbling to the ground
  if (climber) {
    climber.style.transition = 'bottom 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53), transform 0.8s ease-in';
    climber.style.bottom = '15px';
    climber.style.transform = 'translateX(-50%) rotate(180deg)';
  }

  const results = engine.handleTimeout();

  setTimeout(() => {
    onFinishCallback(results);
  }, 1000);
}

function submitAnswer(currentUser, onFinishCallback) {
  if (!userAnswerStr || !currentQ) return;

  clearIdleTimer();
  const res = engine.submitAnswer(userAnswerStr, currentQ);
  triggerFeedback(res.isCorrect);
  updateClimber(res.currentStep);

  if (res.gameOver) {
    setTimeout(() => onFinishCallback(res), 600);
  } else {
    setTimeout(() => nextQuestion(currentUser, onFinishCallback), 400);
  }
}

function triggerFeedback(isCorrect) {
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
    badge.innerText = isCorrect ? '✅ Correct! +1 Ledge ⬆️' : '❌ Slip! -1 Ledge ⬇️';
    setTimeout(() => { badge.style.visibility = 'hidden'; }, 500);
  }
}
