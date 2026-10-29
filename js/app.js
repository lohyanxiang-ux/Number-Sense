import { getRandomQuestion, evaluateQuestion, renderQuestion } from './questions/registry.js';
import './questions/numberLine.js';
import './questions/gridShader.js';
import './questions/equivalence.js';

let currentUser = null;
let sheetWebAppUrl = localStorage.getItem('NUMSENSE_SHEET_URL') || 'https://script.google.com/macros/s/AKfycbxs1uvyTFFuFmmmmXQAMm3I57kNeE2VlCqYOd3DOvMwGcHZj6kRP_ZjMpd-Tqg5_OTw/exec';
let currentQIndex = 0;
let sessionScore = 0;
const TOTAL_QUESTIONS = 5;
let questions = [];
let enteredPin = '';

const localRoster = {
  '1001': { name: 'Alex Tan', class: 'Sec 2A', xp: 120, streak: 3, tokens: 15 },
  '1002': { name: 'Sarah Lim', class: 'Sec 2A', xp: 240, streak: 5, tokens: 30 }
};

function initApp() {
  const sheetInput = document.getElementById('sheetUrlInput');
  if (sheetInput) sheetInput.value = sheetWebAppUrl;
  
  setupEventHandlers();
  setupKeypad();

  const savedUser = localStorage.getItem('NUMSENSE_CURRENT_USER');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    loadUserSession();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// PERSISTENCE HELPER
function saveState() {
  if (currentUser) {
    localStorage.setItem('NUMSENSE_CURRENT_USER', JSON.stringify(currentUser));
    updateHeader();
  }
}

function setupKeypad() {
  const display = document.getElementById('pinDisplay');
  
  document.querySelectorAll('.key-btn[data-key]').forEach(btn => {
    btn.onclick = () => {
      if (enteredPin.length < 4) {
        enteredPin += btn.getAttribute('data-key');
        updatePinDisplay();
      }
    };
  });

  document.getElementById('keyClear').onclick = () => {
    enteredPin = '';
    updatePinDisplay();
  };

  document.getElementById('keyDel').onclick = () => {
    enteredPin = enteredPin.slice(0, -1);
    updatePinDisplay();
  };

  function updatePinDisplay() {
    display.innerText = enteredPin.padEnd(4, '•');
  }
}

function setupEventHandlers() {
  document.getElementById('loginBtn').onclick = handleLogin;
  document.getElementById('submitBtn').onclick = handleAnswerSubmit;
  document.getElementById('nextBtn').onclick = handleNextQuestion;
  document.getElementById('saveSheetBtn').onclick = saveSheetUrl;
  document.getElementById('themeBtn').onclick = toggleTheme;

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.onclick = (e) => switchTab(e.target.getAttribute('data-tab'), e.target);
  });

  document.querySelectorAll('.shop-buy-btn').forEach(btn => {
    btn.onclick = () => redeemPrivilege(btn.getAttribute('data-item'), parseInt(btn.getAttribute('data-cost')));
  });
}

async function handleLogin() {
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (enteredPin.length !== 4) {
    errEl.innerText = "Please enter a 4-digit PIN.";
    errEl.classList.remove('hidden');
    return;
  }

  if (sheetWebAppUrl) {
    try {
      const res = await fetch(sheetWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', studentCode: enteredPin })
      });
      const data = await res.json();
      if (data.success) {
        currentUser = {
          code: enteredPin,
          name: data.studentName,
          class: data.className || 'Sec 2',
          xp: data.xp,
          streak: data.streak,
          tokens: data.tokens,
          lastActive: data.lastActive
        };
        saveAndStart();
        return;
      }
    } catch (e) {}
  }

  if (localRoster[enteredPin]) {
    const u = localRoster[enteredPin];
    currentUser = { code: enteredPin, name: u.name, class: u.class, xp: u.xp, streak: u.streak, tokens: u.tokens, lastActive: null };
    saveAndStart();
  } else {
    errEl.innerText = "Code not found. (Try: 1001 or 1002)";
    errEl.classList.remove('hidden');
  }
}

function saveAndStart() {
  saveState();
  loadUserSession();
}

function loadUserSession() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.getElementById('userStatsHeader').classList.remove('hidden');

  document.getElementById('hdrStudentName').innerText = currentUser.name;
  document.getElementById('hdrStudentClass').innerText = currentUser.class;

  updateHeader();
  startDailySession();
}

function updateHeader() {
  document.getElementById('hdrStreak').innerText = currentUser.streak;
  document.getElementById('hdrXP').innerText = currentUser.xp;
  document.getElementById('hdrTokens').innerText = currentUser.tokens;
}

function startDailySession() {
  currentQIndex = 0;
  sessionScore = 0;
  questions = Array.from({ length: TOTAL_QUESTIONS }, () => getRandomQuestion());
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const q = questions[currentQIndex];
  document.getElementById('qProgress').innerText = `Question ${currentQIndex + 1} of ${TOTAL_QUESTIONS}`;
  document.getElementById('qPrompt').innerHTML = q.prompt;
  
  const ws = document.getElementById('workspace');
  renderQuestion(q, ws);

  document.getElementById('feedbackBox').classList.add('hidden');
  document.getElementById('submitBtn').classList.remove('hidden');
}

function handleAnswerSubmit() {
  const q = questions[currentQIndex];
  const isCorrect = evaluateQuestion(q);

  const fbBox = document.getElementById('feedbackBox');
  fbBox.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');

  if (isCorrect) {
    sessionScore++;
    fbBox.classList.add('feedback-correct');
    document.getElementById('feedbackTitle').innerText = "🎯 Spot On! (+20 XP)";
    currentUser.xp += 20;
    saveState(); // Instantly save updated XP
  } else {
    fbBox.classList.add('feedback-incorrect');
    document.getElementById('feedbackTitle').innerText = "💡 Visual Explanation:";
  }

  document.getElementById('visualExp').innerHTML = q.explanation;
  document.getElementById('submitBtn').classList.add('hidden');
}

function handleNextQuestion() {
  currentQIndex++;
  if (currentQIndex < TOTAL_QUESTIONS) {
    renderCurrentQuestion();
  } else {
    finishSession();
  }
}

// CALENDAR DAY STREAK CALCULATOR
function updateDailyStreak() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!currentUser.lastActive) {
    currentUser.streak = 1;
  } else {
    const last = new Date(currentUser.lastActive);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentUser.streak += 1; // Consecutive day practice
    } else if (diffDays > 1) {
      currentUser.streak = 1;  // Missed days, reset streak
    }
    // If diffDays === 0, student practiced twice today; streak remains unchanged
  }
  currentUser.lastActive = new Date().toISOString();
}

async function finishSession() {
  updateDailyStreak();
  currentUser.tokens += 10;
  saveState(); // Save locally first

  const accuracy = Math.round((sessionScore / TOTAL_QUESTIONS) * 100);
  document.getElementById('workspace').innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: var(--success); font-size: 2rem;">🎉 Warm-up Complete!</h2>
      <p style="font-size: 1.2rem; margin: 12px 0;">Score: <strong>${sessionScore} / ${TOTAL_QUESTIONS} (${accuracy}%)</strong></p>
      <p style="color: var(--text-muted);">Earned 🎟️ 10 Tokens! Day Streak: 🔥 ${currentUser.streak}</p>
    </div>
  `;
  document.getElementById('feedbackBox').classList.add('hidden');
  document.getElementById('qPrompt').innerText = "Great job!";

  // Sync to Google Sheet Backend
  if (sheetWebAppUrl) {
    try {
      await fetch(sheetWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveProgress',
          studentCode: currentUser.code,
          studentName: currentUser.name,
          totalQuestions: TOTAL_QUESTIONS,
          accuracy: accuracy,
          topic: 'Area Representation Practice',
          tokensEarned: 10,
          newTotalXP: currentUser.xp,
          newStreak: currentUser.streak,
          newTokens: currentUser.tokens
        })
      });
    } catch(e) {}
  }
}

function redeemPrivilege(item, cost) {
  if (currentUser.tokens >= cost) {
    currentUser.tokens -= cost;
    saveState(); // Save deducted tokens
    alert(`Redeemed: ${item}!`);
  } else {
    alert(`Need ${cost - currentUser.tokens} more tokens.`);
  }
}

function switchTab(tabName, targetBtn) {
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
  document.getElementById('tabPractice').classList.add('hidden');
  document.getElementById('tabShop').classList.add('hidden');
  document.getElementById('tabTeacher').classList.add('hidden');

  if (tabName === 'practice') document.getElementById('tabPractice').classList.remove('hidden');
  if (tabName === 'shop') document.getElementById('tabShop').classList.remove('hidden');
  if (tabName === 'teacher') document.getElementById('tabTeacher').classList.remove('hidden');

  targetBtn.classList.add('active');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', current === 'cyberpunk' ? 'default' : 'cyberpunk');
}

function saveSheetUrl() {
  const url = document.getElementById('sheetUrlInput').value.trim();
  sheetWebAppUrl = url;
  localStorage.setItem('NUMSENSE_SHEET_URL', url);
  alert('Saved connection URL!');
}
