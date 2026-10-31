import { BELT_TIERS, getStudentFluencyData, evaluateLevelProgression } from './fluencyMastery.js';
import { mountSummitMode } from './modes/summitMode.js';
import { mountBlitzMode } from './modes/blitzMode.js';

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
  const maxBelt = BELT_TIERS[fluencyData.maxLevel] || currentBelt;

  const accColor = fluencyData.lastAccuracy >= 90 ? '#10b981' : '#ef4444';
  const speedColor = (fluencyData.lastSpeed <= 2.5 && fluencyData.lastSpeed > 0) ? '#10b981' : '#ef4444';

  container.innerHTML = `
    <div id="fluencySetupCard" class="card" style="max-width: 950px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="margin: 0;">⚡ Speed Fluency Arena</h2>
          <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.95rem;">
            Select a mode to test your speed and unlock martial arts belts!
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${fluencyData.isRefresher ? `
            <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-weight: 800; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem;">
              ⚡ Refresher Mode (Highest: ${maxBelt.badge} Tier ${maxBelt.tier})
            </span>
          ` : ''}
          <span style="background: rgba(79, 70, 229, 0.15); color: var(--accent); font-weight: 800; padding: 8px 16px; border-radius: 10px; font-size: 1.1rem;">
            ${currentBelt.badge} ${currentBelt.name} (Tier ${currentBelt.tier})
          </span>
        </div>
      </div>

      <!-- TARGET REQUIREMENTS CARD -->
      <div style="background: var(--bg-primary); border: 2px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); margin-bottom: 10px; text-transform: uppercase;">
          🎯 ${fluencyData.isRefresher ? `Fast Recovery Target (Restore ${maxBelt.name}):` : `Rolling 3-Session Progress (${fluencyData.history.length}/3 runs completed):`}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center;">
          <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Rolling Accuracy</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: ${accColor}; margin: 2px 0;">${fluencyData.lastAccuracy}%</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>≥ 90%</strong></div>
          </div>
          <div style="background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Rolling Avg Speed</div>
            <div style="font-size: 1.6rem; font-weight: 900; color: ${speedColor}; margin: 2px 0;">${fluencyData.lastSpeed > 0 ? fluencyData.lastSpeed + 's' : '--'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Target: <strong>< 2.5s / Q</strong></div>
          </div>
        </div>
      </div>

      <!-- MODE SELECTION GRID -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        
        <!-- SUMMIT QUEST CARD -->
        <div style="border: 2px solid var(--accent); border-radius: 12px; padding: 18px; background: rgba(79, 70, 229, 0.04); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h3 style="margin: 0; color: var(--text-main);">🏔️ Summit Quest</h3>
              <span style="font-size: 0.75rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 6px;">PRECISION CLIMB</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0 0 14px 0;">
              Scale 10 mountain ledges. +1 step on correct, -1 on wrong. 10s idle timer!
            </p>
          </div>
          <button class="btn" id="startSummitBtn" style="background: var(--accent); font-weight: 800; width: 100%; padding: 12px;">
            🚀 Climb Summit
          </button>
        </div>

        <!-- LIGHTNING SHURIKEN BLITZ CARD -->
        <div style="border: 2px solid #6366f1; border-radius: 12px; padding: 18px; background: rgba(99, 102, 241, 0.04); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h3 style="margin: 0; color: var(--text-main);">⚡ Shuriken Blitz</h3>
              <span style="font-size: 0.75rem; font-weight: 800; color: #6366f1; background: rgba(99, 102, 241, 0.15); padding: 2px 8px; border-radius: 6px;">30s TIME ATTACK</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0 0 14px 0;">
              Rapid fire! Answer as many questions as possible in 30 seconds to build high streaks.
            </p>
          </div>
          <button class="btn" id="startBlitzBtn" style="background: #6366f1; color: white; font-weight: 800; width: 100%; padding: 12px;">
            ⚡ Start Shuriken Blitz
          </button>
        </div>

      </div>
    </div>

    <div id="fluencyActiveContainer"></div>

    <!-- SUMMARY CARD -->
    <div id="fluencySummaryCard" class="card hidden" style="text-align: center; max-width: 520px; margin: 0 auto;">
      <h2 id="summaryResultHeader" style="color: var(--accent); font-size: 2rem; margin-bottom: 8px;">⚡ Challenge Complete!</h2>
      <div id="fluencyLevelMsg" style="font-weight: 800; font-size: 1.05rem; margin-bottom: 20px;"></div>

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

  document.getElementById('startBlitzBtn').onclick = () => {
    document.getElementById('fluencySetupCard').classList.add('hidden');
    const activeBox = document.getElementById('fluencyActiveContainer');
    mountBlitzMode(activeBox, currentUserRef, handleSessionComplete);
  };

  document.getElementById('btnRestartFluency').onclick = renderFluencyMenu;
}

function handleSessionComplete(results) {
  document.getElementById('fluencyActiveContainer').innerHTML = '';
  document.getElementById('fluencySummaryCard').classList.remove('hidden');

  const headerEl = document.getElementById('summaryResultHeader');
  if (results.victory) {
    headerEl.innerText = '🏆 TRIAL COMPLETE!';
    headerEl.style.color = '#10b981';
  } else {
    headerEl.innerText = '⏱️ TIME EXPIRED!';
    headerEl.style.color = '#ef4444';
  }

  document.getElementById('sumAcc').innerText = `${results.accuracy}%`;
  document.getElementById('sumQs').innerText = `${results.totalQuestions}`;
  document.getElementById('sumCorrect').innerText = `${results.correctCount}`;
  document.getElementById('sumSpeed').innerText = `${results.avgSpeed}s / Q`;

  const progression = evaluateLevelProgression(currentUserRef, results);
  const msgEl = document.getElementById('fluencyLevelMsg');
  msgEl.innerText = progression.message;
  msgEl.style.color = progression.leveledUp || progression.restored ? '#10b981' : (progression.steppedDown ? '#f59e0b' : 'var(--text-main)');

  const xpEarned = results.correctCount * 5;
  if (xpEarned > 0) {
    currentUserRef.xp += xpEarned;
  }

  if (typeof syncCallbackRef === 'function') {
    syncCallbackRef(`Speed Fluency (Belt ${progression.currentLevel})`, xpEarned, 0, false);
  }
}
