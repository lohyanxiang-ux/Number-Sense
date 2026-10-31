import { SurvivalEngine } from './engines/survivalEngine.js';
import { getFluencyQuestion } from './fluencyRegistry.js';
import { getStudentFluencyData, evaluateLevelProgression } from './fluencyMastery.js';

let engine = null;
let currentQ = null;
let userAnswerStr = '';
let currentUserRef = null;
let syncCallbackRef = null;

export function initFluencyTab(currentUser, syncCallback) {
  currentUserRef = currentUser;
  syncCallbackRef = syncCallback;
  engine = new SurvivalEngine();

  renderFluencyMenu();
}

export function renderFluencyMenu() {
  const container = document.getElementById('tabFluency');
  if (!container || !currentUserRef) return;

  const fluencyData = getStudentFluencyData(currentUserRef);

  container.innerHTML = `
    <div id="fluencySetupCard" class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="margin: 0;">⚡ Speed Fluency Arena</h2>
        <span style="background: rgba(79, 70, 229, 0.15); color: var(--accent); font-weight: 800; padding: 6px 12px; border-radius: 8px; font-size: 0.95rem;">
          🏆 Global Level: ${fluencyData.level}
        </span>
      </div>

      <p style="color: var(--text-muted); margin-bottom: 20px;">
        Build rapid arithmetic recall! Beat the clock and reach <strong>≥ 90% accuracy</strong> under <strong>2.5 seconds/question</strong> to level up.
      </p>

      <!-- GAME MODE SELECTION CARD -->
      <div style="border: 2px solid var(--accent); border-radius: 12px; padding: 16px; background: rgba(79, 70, 229, 0.04); margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; color: var(--text-main);">⏳ Survival Mode</h3>
          <span style="font-size: 0.8rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 6px;">UNLOCKED</span>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0 0 12px 0; line-height: 1.4;">
          Start with <strong>15s</strong>. Get answers right to gain <strong>+3s</strong>. Wrong answers penalize <strong>-5s</strong>. Game ends when time reaches 0!
        </p>
        <button class="btn" id="startSurvivalBtn" style="background: var(--accent); font-weight: 800;">
          🚀 Start Survival Mode (Level ${fluencyData.level})
        </button>
      </div>
    </div>

    <!-- ACTIVE GAME ARENA -->
    <div id="fluencyActiveCard" class="card hidden" style="text-align: center; max-width: 500px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span id="fluencyScore" style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">Score: 0</span>
        <span id="fluencyTimer" style="font-weight: 800; font-size: 1.3rem; color: var(--danger); background: rgba(239, 68, 68, 0.1); padding: 4px 12px; border-radius: 8px;">15.0s</span>
        <span id="fluencyCombo" style="font-weight: 800; font-size: 1.1rem; color: #d97706;">Streak: 🔥 0</span>
      </div>

      <!-- QUESTION DISPLAY -->
      <div id="fluencyPrompt" style="font-size: 2.5rem; font-weight: 900; color: var(--text-main); margin: 24px 0 12px 0;">--</div>

      <!-- ANSWER DISPLAY -->
      <div id="fluencyAnswerBox" style="font-size: 2rem; font-weight: 800; height: 50px; line-height: 50px; background: var(--bg-primary); border: 2px dashed var(--border-color); border-radius: 10px; margin-bottom: 20px; color: var(--accent);">
        ?
      </div>

      <!-- ON-SCREEN KEYPAD -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 320px; margin: 0 auto 16px auto;">
        <button class="btn f-key" data-k="1">1</button>
        <button class="btn f-key" data-k="2">2</button>
        <button class="btn f-key" data-k="3">3</button>
        <button class="btn f-key" data-k="4">4</button>
        <button class="btn f-key" data-k="5">5</button>
        <button class="btn f-key" data-k="6">6</button>
        <button class="btn f-key" data-k="7">7</button>
        <button class="btn f-key" data-k="8">8</button>
        <button class="btn f-key" data-k="9">9</button>
        <button class="btn" id="fKeyClear" style="background: var(--bg-primary); color: var(--danger); border: 1px solid var(--border-color); font-weight: 800;">C</button>
        <button class="btn f-key" data-k="0">0</button>
        <button class="btn" id="fKeyEnter" style="background: var(--accent); color: white; font-weight: 800;">↵</button>
      </div>
    </div>

    <!-- GAME OVER SUMMARY CARD -->
    <div id="fluencySummaryCard" class="card hidden" style="text-align: center; max-width: 480px; margin: 0 auto;">
      <h2 style="color: var(--accent); font-size: 1.8rem; margin-bottom: 8px;">⏰ Time's Up!</h2>
      <div id="fluencyLevelMsg" style="font-weight: 800; font-size: 1rem; color: #10b981; margin-bottom: 16px;"></div>

      <div style="background: var(--bg-primary); border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; text-align: left;">
        <div>Score: <strong id="sumScore" style="color: var(--text-main);">0</strong></div>
        <div>Accuracy: <strong id="sumAcc" style="color: var(--text-main);">0%</strong></div>
        <div>Questions: <strong id="sumQs" style="color: var(--text-main);">0</strong></div>
        <div>Avg Speed: <strong id="sumSpeed" style="color: var(--text-main);">0s</strong></div>
      </div>

      <button class="btn" id="btnRestartFluency" style="background: var(--accent); font-weight: 800;">
        ⚡ Play Again
      </button>
    </div>
  `;

  document.getElementById('startSurvivalBtn').onclick = startSurvivalGame;
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

function startSurvivalGame() {
  const fluencyData = getStudentFluencyData(currentUserRef);

  document.getElementById('fluencySetupCard').classList.add('hidden');
  document.getElementById('fluencySummaryCard').classList.add('hidden');
  document.getElementById('fluencyActiveCard').classList.remove('hidden');

  userAnswerStr = '';
  updateAnswerBox();

  engine.startSession(fluencyData.level, {
    onTick: (timeLeft) => {
      const timerEl = document.getElementById('fluencyTimer');
      if (timerEl) timerEl.innerText = `${timeLeft}s`;
    },
    onGameOver: handleGameOver
  });

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

function submitCurrentAnswer() {
  if (!userAnswerStr || !currentQ) return;

  const res = engine.submitAnswer(userAnswerStr, currentQ);
  
  const scoreEl = document.getElementById('fluencyScore');
  const comboEl = document.getElementById('fluencyCombo');
  if (scoreEl) scoreEl.innerText = `Score: ${res.score}`;
  if (comboEl) comboEl.innerText = `Streak: 🔥 ${res.combo}`;

  if (!res.gameOver) {
    nextQuestion();
  }
}

function handleGameOver(results) {
  document.getElementById('fluencyActiveCard').classList.add('hidden');
  document.getElementById('fluencySummaryCard').classList.remove('hidden');

  document.getElementById('sumScore').innerText = results.score;
  document.getElementById('sumAcc').innerText = `${results.accuracy}%`;
  document.getElementById('sumQs').innerText = `${results.correctCount} / ${results.totalQuestions}`;
  document.getElementById('sumSpeed').innerText = `${results.avgSpeed}s / Q`;

  const progression = evaluateLevelProgression(currentUserRef, results);
  document.getElementById('fluencyLevelMsg').innerText = progression.message;

  // Award XP based on fluency score (+1 XP per 10 points)
  const xpEarned = Math.floor(results.score / 10);
  if (xpEarned > 0) {
    currentUserRef.xp += xpEarned;
  }

  // Sync session results to Google Sheet
  if (typeof syncCallbackRef === 'function') {
    syncCallbackRef(`Speed Fluency (Level ${progression.currentLevel})`, xpEarned, 0, false);
  }
}
