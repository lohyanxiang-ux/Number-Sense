import { getAdaptiveQuestion, evaluateQuestion, renderQuestion } from './questions/registry.js';
import './questions/numberLine.js';
import './questions/gridShader.js';
import './questions/equivalence.js';

let currentUser = null;
let sheetWebAppUrl = localStorage.getItem('NUMSENSE_SHEET_URL') || '';
let currentQIndex = 0;
let sessionScore = 0;
const TOTAL_QUESTIONS = 5;
let questions = [];
let currentQuestion = null;
let isExtraPractice = false;
let enteredPin = '';

function initApp() {
  const sheetInput = document.getElementById('sheetUrlInput');
  if (sheetInput) sheetInput.value = sheetWebAppUrl;
  
  setupEventHandlers();
  setupKeypad();

  const savedUser = localStorage.getItem('NUMSENSE_CURRENT_USER');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    if (!currentUser.proficiency) currentUser.proficiency = {};
    loadUserSession();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

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
        display.innerText = enteredPin.padEnd(4, '•');
      }
    };
  });

  document.getElementById('keyClear').onclick = () => {
    enteredPin = '';
    display.innerText = '••••';
  };

  document.getElementById('keyDel').onclick = () => {
    enteredPin = enteredPin.slice(0, -1);
    display.innerText = enteredPin.padEnd(4, '•');
  };
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
          lastActive: data.lastActive,
          proficiency: data.proficiency || {}
        };
        saveAndStart();
        return;
      }
    } catch (e) {}
  }

  // Local Fallback
  currentUser = { code: enteredPin, name: 'Student ' + enteredPin, class: 'Sec 2A', xp: 0, streak: 1, tokens: 0, proficiency: {} };
  saveAndStart();
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
  startDailySession(false);
}

function updateHeader() {
  document.getElementById('hdrStreak').innerText = currentUser.streak;
  document.getElementById('hdrXP').innerText = currentUser.xp;
  document.getElementById('hdrTokens').innerText = currentUser.tokens;
}

function startDailySession(extraMode = false) {
  isExtraPractice = extraMode;
  currentQIndex = 0;
  sessionScore = 0;

  // Adaptively build question set based on student proficiency map
  questions = Array.from({ length: TOTAL_QUESTIONS }, () => getAdaptiveQuestion(currentUser.proficiency));
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  currentQuestion = questions[currentQIndex];
  const modeTag = isExtraPractice ? ' (Extra Practice)' : '';
  document.getElementById('qProgress').innerText = `Question ${currentQIndex + 1} of ${TOTAL_QUESTIONS}${modeTag}`;
  document.getElementById('qPrompt').innerHTML = currentQuestion.prompt;
  
  const ws = document.getElementById('workspace');
  renderQuestion(currentQuestion, ws);

  document.getElementById('feedbackBox').classList.add('hidden');
  document.getElementById('submitBtn').classList.remove('hidden');
}

function handleAnswerSubmit() {
  const isCorrect = evaluateQuestion(currentQuestion);
  const qType = currentQuestion.type;

  // Initialize history array if missing
  if (!currentUser.proficiency[qType]) {
    currentUser.proficiency[qType] = [];
  }

  // Record outcome (1 = correct, 0 = incorrect) and restrict to last 5 attempts
  currentUser.proficiency[qType].push(isCorrect ? 1 : 0);
  currentUser.proficiency[qType] = currentUser.proficiency[qType].slice(-5);

  const fbBox = document.getElementById('feedbackBox');
  fbBox.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');

  if (isCorrect) {
    sessionScore++;
    fbBox.classList.add('feedback-correct');
    document.getElementById('feedbackTitle').innerText = "🎯 Spot On! (+20 XP)";
    currentUser.xp += 20;
    saveState();
  } else {
    fbBox.classList.add('feedback-incorrect');
    document.getElementById('feedbackTitle').innerText = "💡 Visual Explanation:";
  }

  document.getElementById('visualExp').innerHTML = currentQuestion.explanation;
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

function updateDailyStreak() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!currentUser.lastActive) {
    currentUser.streak = 1;
  } else {
    const last = new Date(currentUser.lastActive);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) currentUser.streak += 1;
    else if (diffDays > 1) currentUser.streak = 1;
  }
  currentUser.lastActive = new Date().toISOString();
}

async function finishSession() {
  if (!isExtraPractice) updateDailyStreak();
  currentUser.tokens += 10;
  saveState();

  const accuracy = Math.round((sessionScore / TOTAL_QUESTIONS) * 100);
  const modeText = isExtraPractice ? 'Extra Practice Complete!' : 'Warm-up Complete!';

  document.getElementById('workspace').innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: var(--success); font-size: 1.8rem;">🎉 ${modeText}</h2>
      <p style="font-size: 1.2rem; margin: 12px 0;">Score: <strong>${sessionScore} / ${TOTAL_QUESTIONS} (${accuracy}%)</strong></p>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Earned 🎟️ 10 Tokens! Day Streak: 🔥 ${currentUser.streak}</p>
      
      <!-- CONTINUATION OPTIONS -->
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <button class="btn" id="btnExtraPractice" style="width: auto; background: var(--accent);">
          ⚡ Keep Practicing (5 More Questions)
        </button>
        <button class="btn" id="btnFinish" style="width: auto; background: var(--text-muted);">
          ✅ Finish Session
        </button>
      </div>
    </div>
  `;

  document.getElementById('feedbackBox').classList.add('hidden');
  document.getElementById('qPrompt').innerText = "Great effort!";

  // Attach post-warmup button handlers
  document.getElementById('btnExtraPractice').onclick = () => startDailySession(true);
  document.getElementById('btnFinish').onclick = () => {
    document.getElementById('workspace').innerHTML = `<p style="text-align: center; font-size: 1.1rem; padding: 30px;">All done for today! See you tomorrow! 👋</p>`;
  };

  // Sync session and proficiency to Google Sheet
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
          topic: isExtraPractice ? 'Extra Practice' : 'Daily Warm-up',
          tokensEarned: 10,
          newTotalXP: currentUser.xp,
          newStreak: currentUser.streak,
          newTokens: currentUser.tokens,
          proficiency: currentUser.proficiency
        })
      });
    } catch(e) {}
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
