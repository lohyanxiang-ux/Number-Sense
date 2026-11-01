import { BELT_TIERS, getStudentFluencyData, evaluateLevelProgression } from './fluencyMastery.js';
import { showBeltTransitionAnimation } from './beltAnimation.js';
import { mountSummitMode } from './modes/summitMode.js';
import { mountBlitzMode } from './modes/blitzMode.js';
import { mountBoardMode } from './modes/boardMode.js';

let currentUserRef = null;
let syncCallbackRef = null;

export function initFluencyTab(currentUser, syncCallback) {
  currentUserRef = currentUser;
  syncCallbackRef = syncCallback;
  renderFluencyMenu();
}

// ... Keep existing renderFluencyMenu code ...

function handleSessionComplete(results) {
  document.getElementById('fluencyActiveContainer').innerHTML = '';

  const progression = evaluateLevelProgression(currentUserRef, results);

  const displaySummaryCard = () => {
    document.getElementById('fluencySummaryCard').classList.remove('hidden');

    const headerEl = document.getElementById('summaryResultHeader');
    if (results.victory) {
      headerEl.innerText = '🏆 SESSION COMPLETE!';
      headerEl.style.color = '#10b981';
    } else {
      headerEl.innerText = '💥 STANCE BROKEN!';
      headerEl.style.color = '#ef4444';
    }

    document.getElementById('sumAcc').innerText = `${results.accuracy}%`;
    document.getElementById('sumQs').innerText = `${results.totalQuestions}`;
    document.getElementById('sumCorrect').innerText = `${results.correctCount}`;
    document.getElementById('sumSpeed').innerText = `${results.avgSpeed}s / Q`;

    const msgEl = document.getElementById('fluencyLevelMsg');
    msgEl.innerText = progression.message;
    msgEl.style.color = (progression.leveledUp || progression.restored) ? '#10b981' : (progression.steppedDown ? '#f59e0b' : 'var(--text-main)');

    const xpEarned = results.correctCount * 5;
    if (xpEarned > 0) {
      currentUserRef.xp += xpEarned;
    }

    if (typeof syncCallbackRef === 'function') {
      syncCallbackRef(`Speed Fluency (Belt ${progression.currentLevel})`, xpEarned, 0, false);
    }
  };

  // Trigger ceremony overlay if tier changed, otherwise directly display summary card
  if (progression.transitionType) {
    showBeltTransitionAnimation(
      progression.previousLevel,
      progression.currentLevel,
      progression.transitionType,
      displaySummaryCard
    );
  } else {
    displaySummaryCard();
  }
}
