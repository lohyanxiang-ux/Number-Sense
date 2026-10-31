import { SummitEngine } from '../engines/summitEngine.js';
import { getFluencyQuestion } from '../fluencyRegistry.js';
import { getStudentFluencyData, evaluateLevelProgression } from '../fluencyMastery.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';

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
          <div style="display: flex; justify-content: space-between; align-items: center; z-index: 2;">
            <span style="color: #94a3b8; font-size: 0.85rem; font-weight: 800;">SUMMIT TRAIL</span>
            <span id="summitStageTitle" style="color: #38bdf8; font-size: 1.1rem; font-weight: 900; background: rgba(56, 189, 248, 0.15); padding: 4px 12px; border-radius: 8px;">
              Ledge 0 / 10
            </span>
          </div>

          <div style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;">
            <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
              <polygon points="200,40 370,380 30,380" fill="#334155" opacity="0.6" />
              <polygon points="200,40 290,380 110,380" fill="#475569" opacity="0.8" />
              <polygon points="200,40 235,110 215,100 200,115 185,100 165,110" fill="#f8fafc" />
              <polyline points="60,360 90,330 130,300 160,265 140,230 170,195 230,165 210,130 195,95 200,50" fill="none" stroke="#64748b" stroke-width="3" stroke-dasharray="6,6" />
            </svg>
          </div>

          <div id="climberAvatar" style="
            position: absolute; z-index: 10; font-size: 2.2rem;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
            left: 45px; bottom: 30px;
          ">🧗‍♂️</div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; z-index: 2; margin-top: auto;">
            <span style="font-size: 1.8rem;">⛺ <small style="font-size: 0.75rem; color: #94a3b8; display: block;">Base</small></span>
            <span style="font-size: 2rem;">🚩 <small style="font-size: 0.75rem; color: #facc15; display: block; text-align: right;">Summit</small></span>
          </div>
        </div>

        <!-- KEYPAD & PROMPT COLUMN -->
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

function updateClimber(step) {
  const safeStep = Math.min(10, Math.max(0, step));
  const climber = document.getElementById('climberAvatar');
  const title = document.getElementById('summitStageTitle');
  const coord = LEDGE_COORDINATES[safeStep];

  if (climber && coord) {
    climber.style.left = coord.left;
    climber.style.bottom = coord.bottom;
  }
  if (title) title.innerText = `Ledge ${safeStep} / 10`;
}

function submitAnswer(currentUser, onFinishCallback) {
  if (!userAnswerStr || !currentQ) return;

  const res = engine.submitAnswer(userAnswerStr, currentQ);
  triggerFeedback(res.isCorrect);
  updateClimber(res.currentStep);

  if (res.gameOver) {
    setTimeout(() => onFinishCallback(res), 600);
  } else {
    setTimeout(() => nextQuestion(currentUser), 400);
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
