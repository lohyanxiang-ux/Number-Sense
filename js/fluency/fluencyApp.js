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
    <div id="fluencySetupCard" class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="margin: 0;">🏔️ Summit Quest Arena</h2>
          <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.9rem;">
            Scale the mountain ledges to earn your next martial arts belt!
          </p>
        </div>
        <span style="background: rgba(79, 70, 229, 0.15); color: var(--accent); font-weight: 800; padding: 8px 14px; border-radius: 10px; font-size: 1.05rem;">
          ${currentBelt.badge} ${currentBelt.name} (Tier ${currentBelt.tier})
        </span>
      </div>

      <!-- LIVE PROGRESS STATUS CARD -->
      <div style="background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">
          🎯 Next Belt Unlock Requirements (${nextBelt.badge} ${nextBelt.name}):
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center;">
          <div style="background: var(--bg-card); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">Recent Accuracy</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: ${accColor}; margin: 2px 0;">
              ${fluencyData.lastAccuracy}%
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>≥ 90%</strong></div>
          </div>

          <div style="background: var(--bg-card); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">Recent Avg Speed</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: ${speedColor}; margin: 2px 0;">
              ${fluencyData.lastSpeed > 0 ? fluencyData.lastSpeed + 's' : '--'}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>< 2.5s / Q</strong></div>
          </div>
        </div>
      </div>

      <!-- SUMMIT QUEST INFO CARD -->
      <div style="border: 2px solid var(--accent); border-radius: 12px; padding: 16px; background: rgba(79, 70, 229, 0.04); margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; color: var(--text-main);">🧗 Rules of Summit Quest</h3>
          <span style="font-size: 0.8rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 6px;">READY</span>
        </div>
        <ul style="font-size: 0.9rem; color: var(--text-muted); margin: 0 0 14px 20px; padding: 0; line-height: 1.5;">
          <li>Reach <strong>Ledge 10 (Summit)</strong> to complete the climb.</li>
          <li>Correct answer: <strong>Climb UP 1 Ledge ⬆️</strong></li>
          <li>Wrong answer: <strong>Slip DOWN 1 Ledge ⬇️</strong></li>
          <li>Slipping below Base Camp (Ledge 0) ends your climb!</li>
        </ul>
        <button class="btn" id="startSummitBtn" style="background: var(--accent); font-weight: 800; width: 100%;">
          🚀 Begin Summit Quest (${currentBelt.badge} ${currentBelt.name})
        </button>
      </div>
    </div>

    <!-- ACTIVE GAME ARENA -->
    <div id="fluencyActiveCard" class="card hidden" style="text-align: center; max-width: 520px; margin: 0 auto;">
      
      <!-- MOUNTAIN CLIMB VISUAL TRACK -->
      <div style="margin-bottom: 16px; background: var(--bg-primary); padding: 14px; border-radius: 12px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 800; font-size: 0.85rem; color: var(--text-muted);">
          <span>⛺ Base Camp</span>
          <span id="summitStageTitle" style="color: var(--accent); font-size: 1rem;">Ledge 0 / 10</span>
          <span>🏆 Summit</span>
        </div>

        <!-- PROGRESS LADDER TRACK -->
        <div style="position: relative; height: 16px; background: var(--border-color); border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
          <div id="summitProgressBar" style="position: absolute; top: 0; left: 0; height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent), #10b981); transition: width 0.35s ease-out; border-radius: 8px;"></div>
        </div>

        <!-- ANIMATED CLIMBER AVATAR -->
        <div style="position: relative; height: 32px;">
          <div id="climberAvatar" style="
            position: absolute;
            left: 0%;
            transform: translateX(-50%);
            font-size: 1.6rem;
            transition: left 0.35s ease-out, transform 0.2s ease;
          ">🧗‍♂️</div>
        </div>
      </div>

      <!-- QUESTION DISPLAY -->
      <div id="fluencyPrompt" style="font-size: 2.5rem; font-weight: 900; color: var(--text-main); margin: 16px 0 10px 0;">--</div>

      <!-- ANSWER DISPLAY -->
      <div id="fluencyAnswerBox" style="font-size: 2rem; font-weight: 800; height: 48px; line-height: 48px; background: var(--bg-primary); border: 2px dashed var(--border-color); border-radius: 10px; margin-bottom: 16px; color: var(--accent);">
        ?
      </div>

      <!-- ON-SCREEN KEYPAD WITH NEGATIVE SIGN SUPPORT -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 320px; margin: 0 auto 10px auto;">
        <button class="btn f-key" data-k="1">1</button>
        <button class="btn f-key" data-k="2">2</button>
        <button class="btn f-key" data-k="3">3</button>
        <button class="btn f-key" data-k="4">4</button>
        <button class="btn f-key" data-k="5">5</button>
        <button class="btn f-key" data-k="6">6</button>
        <button class="btn f-key" data-k="7">7</button>
        <button class="btn f-key" data-k="8">8</button>
        <button class="btn f-key" data-k="9">9</button>
        <button class="btn f-key" data-k="-">-</button>
        <button class="btn f-key" data-k="0">0</button>
        <button class="btn" id="fKeyClear" style="background: var(--bg-primary); color: var(--danger); border: 1px solid var(--border-color); font-weight: 800;">C</button>
      </div>
      <button class="btn" id="fKeyEnter" style="width: 100%; max-width: 320px; background: var(--accent); color: white; font-weight: 800; margin-top: 4px;">↵ SUBMIT</button>
    </div>

    <!-- GAME OVER SUMMARY CARD -->
    <div id="fluencySummaryCard" class="card hidden" style="text-align: center; max-width: 480px; margin: 0 auto;">
      <h2 id="summitResultHeader" style="color: var(--accent); font-size: 1.8rem; margin-bottom: 8px;">🏔️ Quest Complete!</h2>
      <div id="fluencyLevelMsg" style="font-weight: 800; font-size: 1.05rem; color: #10b981; margin-bottom: 16px;"></div>

      <div style="background: var(--bg-primary); border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; text-align: left;">
        <div>Accuracy: <strong id="sumAcc" style="color: var(--text-main);">0%</strong></div>
        <div>Total Attempts: <strong id="sumQs" style="color: var(--text-main);">0</strong></div>
        <div>Correct Answers: <strong id="sumCorrect" style="color: var(--text-main);">0</strong></div>
        <div>Avg Speed: <strong id="sumSpeed" style="color: var(--text-main);">0s</strong></div>
      </div>

      <button class="btn" id="btnRestartFluency" style="background: var(--accent); font-weight: 800;">
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
  updateClimberUI(0, false);
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

function updateClimberUI(step, isWrong) {
  const pct = Math.min(100, Math.max(0, (step / 10) * 100));
  
  const progressBar = document.getElementById('summitProgressBar');
  const avatar = document.getElementById('climberAvatar');
  const title = document.getElementById('summitStageTitle');

  if (progressBar) progressBar.style.width = `${pct}%`;
  if (title) title.innerText = `Ledge ${step} / 10`;

  if (avatar) {
    avatar.style.left = `${pct}%`;
    if (isWrong) {
      avatar.style.transform = 'translateX(-50%) translateY(4px) scale(0.9)';
      setTimeout(() => { avatar.style.transform = 'translateX(-50%)'; }, 250);
    } else {
      avatar.style.transform = 'translateX(-50%) translateY(-6px) scale(1.15)';
      setTimeout(() => { avatar.style.transform = 'translateX(-50%)'; }, 250);
    }
  }
}

function submitCurrentAnswer() {
  if (!userAnswerStr || !currentQ) return;

  const res = engine.submitAnswer(userAnswerStr, currentQ);
  updateClimberUI(res.currentStep, !res.isCorrect);

  if (res.gameOver) {
    setTimeout(() => handleGameOver(res), 400);
  } else {
    nextQuestion();
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

  // XP calculation based on total correct answers
  const xpEarned = results.correctCount * 5;
  if (xpEarned > 0) {
    currentUserRef.xp += xpEarned;
  }

  // Google Sheet Column I sync
  if (typeof syncCallbackRef === 'function') {
    syncCallbackRef(`Speed Fluency (Belt ${progression.currentLevel})`, xpEarned, 0, false);
  }
}
