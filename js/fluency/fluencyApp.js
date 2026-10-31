import { BELT_TIERS, getStudentFluencyData, evaluateLevelProgression } from './fluencyMastery.js';
import { mountSummitMode } from './modes/summitMode.js';
// Import future modes here: e.g. import { mountSprintMode } from './modes/sprintMode.js';

let currentUserRef = null;
let syncCallbackRef = null;

export function initFluencyTab(currentUser, syncCallback) {
  currentUserRef = currentUser;
  syncCallbackRef = syncCallback;
  renderFluencyMenu();
}

export function renderFluencyMenu() {
  const container = document.getElementById('tabFluency');
  if (!container || !currentUserRef) return;

  const fluencyData = getStudentFluencyData(currentUserRef);
  const currentBelt = BELT_TIERS[fluencyData.level] || BELT_TIERS[1];
  const nextBelt = BELT_TIERS[Math.min(10, fluencyData.level + 1)];

  const accColor = fluencyData.lastAccuracy >= 90 ? '#10b981' : '#ef4444';
  const speedColor = (fluencyData.lastSpeed <= 2.5 && fluencyData.lastSpeed > 0) ? '#10b981' : '#ef4444';

  container.innerHTML = `
    <div id="fluencySetupCard" class="card" style="max-width: 950px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="margin: 0;">⚡ Speed Fluency Arena</h2>
          <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.95rem;">
            Choose a challenge mode to test your numerical fluency!
          </p>
        </div>
        <span style="background: rgba(79, 70, 229, 0.15); color: var(--accent); font-weight: 800; padding: 8px 16px; border-radius: 10px; font-size: 1.1rem;">
          ${currentBelt.badge} ${currentBelt.name} (Tier ${currentBelt.tier})
        </span>
      </div>

      <!-- RECENT ACCURACY / SPEED CARDS -->
      <div style="background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">
          🎯 Next Belt Unlock Targets (${nextBelt.badge} ${nextBelt.name}):
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center;">
          <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Recent Accuracy</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: ${accColor}; margin: 2px 0;">${fluencyData.lastAccuracy}%</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>≥ 90%</strong></div>
          </div>
          <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Recent Avg Speed</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: ${speedColor}; margin: 2px 0;">${fluencyData.lastSpeed > 0 ? fluencyData.lastSpeed + 's' : '--'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>< 2.5s / Q</strong></div>
          </div>
        </div>
      </div>

      <!-- AVAILABLE GAME MODES SELECTION -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
        
        <!-- SUMMIT QUEST CARD -->
        <div style="border: 2px solid var(--accent); border-radius: 12px; padding: 18px; background: rgba(79, 70, 229, 0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="margin: 0; color: var(--text-main);">🏔️ Summit Quest</h3>
            <span style="font-size: 0.8rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 6px;">STEP CLIMBER</span>
          </div>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin: 0 0 14px 0;">
            Climb to Ledge 10 (+1 Ledge on correct, -1 Ledge on wrong). Don't fall off Base Camp!
          </p>
          <button class="btn" id="startSummitBtn" style="background: var(--accent); font-weight: 800; width: 100%; padding: 12px;">
            🚀 Start Summit Quest
          </button>
        </div>

      </div>
    </div>

    <!-- MOUNTING CONTAINER FOR ACTIVE GAME MODES -->
    <div id="fluencyActiveContainer"></div>

    <!-- SUMMARY CONTAINER -->
    <div id="fluencySummaryCard" class="card hidden" style="text-align: center; max-width: 520px; margin: 0 auto;">
      <h2 id="summaryResultHeader" style="color: var(--accent); font-size: 2rem; margin-bottom: 8px;">🏔️ Quest Complete!</h2>
      <div id="fluencyLevelMsg" style="font-weight: 800; font-size: 1.1rem; color: #10b981; margin-bottom: 20px;"></div>

      <div style="background: var(--bg-primary); border-radius: 12px; padding: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; text-align: left; border: 1px solid var(--border-color);">
        <div>Accuracy: <strong id="sumAcc" style="color: var(--text-main); font-size: 1.1rem;">0%</strong></div>
        <div>Total Attempts: <strong id="sumQs" style="color: var(--text-main); font-size: 1.1rem;">0</strong></div>
        <div>Correct Answers: <strong id="sumCorrect" style="color: var(--text-main); font-size: 1.1rem;">0</strong></div>
        <div>Avg Speed: <strong id="sumSpeed" style="color: var(--text-main); font-size: 1.1rem;">0s</strong></div>
      </div>

      <button class="btn" id="btnRestartFluency" style="background: var(--accent); font-weight: 800; width: 100%; padding: 14px; font-size: 1.1rem;">
        ⚡ Return to Main Arena
      </button>
    </div>
  `;

  document.getElementById('startSummitBtn').onclick = () => {
    document.getElementById('fluencySetupCard').classList.add('hidden');
    const activeBox = document.getElementById('fluencyActiveContainer');
    mountSummitMode(activeBox, currentUserRef, handleSessionComplete);
  };

  document.getElementById('btnRestartFluency').onclick = renderFluencyMenu;
}

function handleSessionComplete(results) {
  document.getElementById('fluencyActiveContainer').innerHTML = '';
  document.getElementById('fluencySummaryCard').classList.remove('hidden');

  const headerEl = document.getElementById('summaryResultHeader');
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
