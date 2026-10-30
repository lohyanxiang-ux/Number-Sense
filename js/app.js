import { getAdaptiveQuestion, getQuestionByType, evaluateQuestion, renderQuestion } from './questions/registry.js';
import './questions/numberLine.js';
import './questions/gridShader.js';
import './questions/equivalence.js';
import './questions/placeValue.js';
import './questions/negativeNumbers.js';
import './questions/addSubtractNegatives.js';
import './questions/multiplication.js';
import './questions/division.js';

let currentUser = null;
let sheetWebAppUrl = localStorage.getItem('NUMSENSE_SHEET_URL') || '';
let enteredPin = '';

// Daily Practice State
const TOTAL_QUESTIONS = 5;
let currentQIndex = 0;
let sessionScore = 0;
let questions = [];
let currentQuestion = null;

// Extra Practice State
let extraQuestions = [];
let extraQIndex = 0;
let extraSessionScore = 0;
let extraTotalQuestions = 5;
let currentExtraQuestion = null;
let activeExtraTopicKey = 'random';

// Teacher Dashboard State
let teacherRosterData = [];
let activeSampleTopicKey = '';
let activeManageStudentCode = null;
let activeRosterFilter = 'all'; 
let activeClassFilter = 'all'; 

// Manage Student Modal State
let manageTargetMode = 'xp'; 
let xpChangeVal = 0;
let tokenChangeVal = 0;
let isNegativeSign = false;
let currentDigits = '0';

const ALL_TOPICS = [
  { key: 'grid_shader', name: '📐 Grid Shader (Fractions / % / Dec)' },
  { key: 'number_line', name: '📏 Number Line' },
  { key: 'equivalence', name: '🃏 Equivalence Matching' },
  { key: 'place_value', name: '🔢 Place Value' },
  { key: 'negative_numbers', name: '➖ Negative Numbers' },
  { key: 'add_subtract_negatives', name: '➕➖ Adding & Subtracting Integers' },
  { key: 'multiplication', name: '✖️ Multiplication' },
  { key: 'division', name: '➗ Division' }
];

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initApp() {
  setupKeypad();
  
  const sheetInput = document.getElementById('sheetUrlInput');
  if (sheetInput) sheetInput.value = sheetWebAppUrl;

  setupEventHandlers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function setupKeypad() {
  const display = document.getElementById('pinDisplay');
  document.querySelectorAll('.key-btn[data-key]').forEach(btn => {
    btn.onclick = () => {
      if (enteredPin.length < 4) {
        enteredPin += btn.getAttribute('data-key');
        if (display) display.innerText = enteredPin.padEnd(4, '•');
      }
    };
  });

  const clearBtn = document.getElementById('keyClear');
  if (clearBtn) {
    clearBtn.onclick = () => {
      enteredPin = '';
      if (display) display.innerText = '••••';
    };
  }

  const delBtn = document.getElementById('keyDel');
  if (delBtn) {
    delBtn.onclick = () => {
      enteredPin = enteredPin.slice(0, -1);
      if (display) display.innerText = enteredPin.padEnd(4, '•');
    };
  }
}

function setupEventHandlers() {
  const bindClick = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.onclick = handler;
  };

  bindClick('loginBtn', handleLogin);
  bindClick('submitBtn', handleAnswerSubmit);
  bindClick('nextBtn', handleNextQuestion);
  bindClick('startExtraBtn', startExtraPracticeSession);
  bindClick('extraSubmitBtn', handleExtraAnswerSubmit);
  bindClick('extraNextBtn', handleExtraNextQuestion);
  bindClick('exitExtraBtn', exitExtraPractice);
  bindClick('saveSheetBtn', saveSheetUrl);
  bindClick('refreshTeacherDataBtn', fetchTeacherDashboardData);
  bindClick('logoutBtn', logout);
  bindClick('teacherLogoutBtn', logout);

  bindClick('goToExtraBtn', () => {
    const extraTabBtn = document.querySelector('.tab-btn[data-tab="extra"]');
    if (extraTabBtn) switchTab('extra', extraTabBtn);
  });

  const classSelect = document.getElementById('classFilterSelect');
  if (classSelect) {
    classSelect.onchange = (e) => {
      activeClassFilter = e.target.value;
      applyRosterFilters();
    };
  }

  bindClick('kpiCardTotal', () => setRosterFilter('all'));
  bindClick('kpiCardActiveToday', () => setRosterFilter('active_today'));
  bindClick('kpiCardStruggling', () => setRosterFilter('needs_attention'));

  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.onclick = () => {
      const filterType = btn.getAttribute('data-filter');
      setRosterFilter(filterType);
    };
  });

  document.querySelectorAll('.topic-hdr').forEach(hdr => {
    hdr.onclick = () => {
      const typeKey = hdr.getAttribute('data-type');
      openSampleQuestionModal(typeKey, hdr.innerText);
    };
  });

  bindClick('closeSampleModalBtn', () => {
    const m = document.getElementById('sampleQuestionModal');
    if (m) m.classList.add('hidden');
  });

  bindClick('closeManageModalBtn', () => {
    const m = document.getElementById('studentManageModal');
    if (m) m.classList.add('hidden');
  });

  bindClick('newSampleQBtn', () => {
    generateSampleQuestion(activeSampleTopicKey);
  });

  bindClick('tabModeXP', () => switchManageMode('xp'));
  bindClick('tabModeTokens', () => switchManageMode('tokens'));

  document.querySelectorAll('.m-num-key').forEach(btn => {
    btn.onclick = () => {
      const k = btn.getAttribute('data-k');
      if (currentDigits === '0') currentDigits = k;
      else currentDigits += k;
      updateManageKeypadDisplay();
    };
  });

  bindClick('mKeyToggleSign', () => {
    isNegativeSign = !isNegativeSign;
    updateManageKeypadDisplay();
  });

  bindClick('mKeyDel', () => {
    currentDigits = currentDigits.slice(0, -1);
    if (!currentDigits || currentDigits === '-') currentDigits = '0';
    updateManageKeypadDisplay();
  });

  document.querySelectorAll('.m-preset-btn').forEach(btn => {
    btn.onclick = () => {
      const val = btn.getAttribute('data-val');
      if (val.startsWith('-')) {
        isNegativeSign = true;
        currentDigits = val.replace('-', '');
      } else {
        isNegativeSign = false;
        currentDigits = val.replace('+', '');
      }
      updateManageKeypadDisplay();
    };
  });

  bindClick('saveStudentManageBtn', processStudentManagement);

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.onclick = (e) => switchTab(e.target.getAttribute('data-tab'), e.target);
  });
}

// REAL-TIME QUESTION PROGRESS SYNC TO GOOGLE SHEETS
async function syncQuestionProgressToSheet(topicLabel, xpEarned, tokensEarned, isDaily) {
  if (!sheetWebAppUrl || !currentUser) return;
  try {
    await fetch(sheetWebAppUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveProgress',
        studentCode: currentUser.code,
        studentName: currentUser.name,
        totalQuestions: 1,
        accuracy: 100,
        topic: topicLabel,
        tokensEarned: tokensEarned,
        xpEarned: xpEarned,
        newTotalXP: currentUser.xp,
        newStreak: currentUser.streak,
        newTokens: currentUser.tokens,
        isDailyWarmup: isDaily,
        proficiency: currentUser.proficiency
      })
    });
  } catch (e) {
    console.error("Error syncing question progress to Google Sheet:", e);
  }
}

async function handleLogin() {
  const errEl = document.getElementById('loginError');
  if (errEl) errEl.classList.add('hidden');

  if (enteredPin.length !== 4) {
    if (errEl) {
      errEl.innerText = "Please enter a 4-digit PIN.";
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (enteredPin === '3005') {
    enteredPin = '';
    const display = document.getElementById('pinDisplay');
    if (display) display.innerText = '••••';
    loadTeacherDashboard();
    return;
  }

  const todayStr = getTodayDateString();

  if (sheetWebAppUrl) {
    try {
      const res = await fetch(sheetWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', studentCode: enteredPin })
      });
      const data = await res.json();
      if (data.success && !data.isTeacher) {
        const isDoneToday = (data.lastDailyCompleted === todayStr) || 
                            (localStorage.getItem(`NUMSENSE_DAILY_DONE_${enteredPin}`) === todayStr);

        currentUser = {
          code: enteredPin,
          name: data.studentName,
          class: String(data.className || 'Sec 2').trim(),
          xp: data.xp,
          streak: data.streak,
          tokens: data.tokens,
          lastActive: data.lastActive,
          lastDailyCompleted: data.lastDailyCompleted,
          dailyDoneToday: isDoneToday,
          proficiency: data.proficiency || {}
        };
        enteredPin = '';
        startStudentSession();
        return;
      }
    } catch (e) {}
  }

  const localDoneToday = localStorage.getItem(`NUMSENSE_DAILY_DONE_${enteredPin}`) === todayStr;
  currentUser = { 
    code: enteredPin, 
    name: 'Student ' + enteredPin, 
    class: 'Sec 2A', 
    xp: 0, 
    streak: 1, 
    tokens: 0, 
    dailyDoneToday: localDoneToday,
    proficiency: {} 
  };
  enteredPin = '';
  startStudentSession();
}

function startStudentSession() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('teacherDashboard').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.getElementById('userStatsHeader').classList.remove('hidden');

  document.getElementById('hdrStudentName').innerText = currentUser.name;
  document.getElementById('hdrStudentClass').innerText = currentUser.class;

  updateHeader();

  if (currentUser.dailyDoneToday) {
    document.getElementById('dailyActiveCard').classList.add('hidden');
    document.getElementById('dailyLockedCard').classList.remove('hidden');
  } else {
    document.getElementById('dailyLockedCard').classList.add('hidden');
    document.getElementById('dailyActiveCard').classList.remove('hidden');
    startDailySession();
  }
}

function updateHeader() {
  if (!currentUser) return;
  const streakEl = document.getElementById('hdrStreak');
  const xpEl = document.getElementById('hdrXP');
  const tokensEl = document.getElementById('hdrTokens');

  if (streakEl) streakEl.innerText = currentUser.streak || 0;
  if (xpEl) xpEl.innerText = currentUser.xp || 0;
  if (tokensEl) tokensEl.innerText = currentUser.tokens || 0;
}

function switchTab(tabKey, targetBtn) {
  document.querySelectorAll('.nav-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  if (targetBtn) targetBtn.classList.add('active');

  const tabs = ['Practice', 'Extra', 'Progress', 'Shop'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab${t}`);
    if (el) el.classList.add('hidden');
  });

  const activeTabEl = document.getElementById(`tab${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
  if (activeTabEl) activeTabEl.classList.remove('hidden');

  if (tabKey === 'progress') {
    renderStudentProgressTab();
  }
}

function logout() {
  currentUser = null;
  enteredPin = '';
  const display = document.getElementById('pinDisplay');
  if (display) display.innerText = '••••';

  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('teacherDashboard').classList.add('hidden');
  document.getElementById('userStatsHeader').classList.add('hidden');
  document.getElementById('teacherHeader').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function saveSheetUrl() {
  const sheetInput = document.getElementById('sheetUrlInput');
  if (sheetInput) {
    sheetWebAppUrl = sheetInput.value.trim();
    localStorage.setItem('NUMSENSE_SHEET_URL', sheetWebAppUrl);
    alert('Google Sheet Web App URL saved successfully!');
  }
}

function startDailySession() {
  currentQIndex = 0;
  sessionScore = 0;
  questions = Array.from({ length: TOTAL_QUESTIONS }, () => getAdaptiveQuestion(currentUser.proficiency));
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  currentQuestion = questions[currentQIndex];
  document.getElementById('qProgress').innerText = `Question ${currentQIndex + 1} of ${TOTAL_QUESTIONS}`;
  document.getElementById('qPrompt').innerHTML = currentQuestion.prompt;
  
  const ws = document.getElementById('workspace');
  renderQuestion(currentQuestion, ws);

  document.getElementById('feedbackBox').classList.add('hidden');
  document.getElementById('submitBtn').classList.remove('hidden');
}

function handleAnswerSubmit() {
  const isCorrect = evaluateQuestion(currentQuestion);
  const qType = currentQuestion.type;

  if (!currentUser.proficiency[qType]) {
    currentUser.proficiency[qType] = [];
  }

  currentUser.proficiency[qType].push(isCorrect ? 1 : 0);
  currentUser.proficiency[qType] = currentUser.proficiency[qType].slice(-10);

  const fbBox = document.getElementById('feedbackBox');
  fbBox.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');

  let xpEarned = 0;
  if (isCorrect) {
    sessionScore++;
    xpEarned = 20;
    fbBox.classList.add('feedback-correct');
    document.getElementById('feedbackTitle').innerText = "🎯 Spot On! (+20 XP)";
    currentUser.xp += 20;
    updateHeader();
  } else {
    fbBox.classList.add('feedback-incorrect');
    document.getElementById('feedbackTitle').innerText = "💡 Visual Explanation:";
  }

  document.getElementById('visualExp').innerHTML = currentQuestion.explanation;
  document.getElementById('submitBtn').classList.add('hidden');

  // WRITE IMMEDIATELY TO GOOGLE SHEETS
  const topicObj = ALL_TOPICS.find(t => t.key === qType);
  const topicName = topicObj ? topicObj.name : qType;
  syncQuestionProgressToSheet(topicName, xpEarned, 0, true);
}

function handleNextQuestion() {
  currentQIndex++;
  if (currentQIndex < TOTAL_QUESTIONS) {
    renderCurrentQuestion();
  } else {
    finishDailySession();
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

async function finishDailySession() {
  updateDailyStreak();
  currentUser.tokens += 10;
  currentUser.dailyDoneToday = true;
  
  const todayStr = getTodayDateString();
  localStorage.setItem(`NUMSENSE_DAILY_DONE_${currentUser.code}`, todayStr);
  updateHeader();

  const accuracy = Math.round((sessionScore / TOTAL_QUESTIONS) * 100);

  document.getElementById('dailyActiveCard').innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: var(--success); font-size: 1.8rem;">🎉 Daily Warm-up Complete!</h2>
      <p style="font-size: 1.2rem; margin: 12px 0;">Score: <strong>${sessionScore} / ${TOTAL_QUESTIONS} (${accuracy}%)</strong></p>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Earned 🎟️ 10 Tokens! Day Streak: 🔥 ${currentUser.streak}</p>
      
      <button class="btn" id="btnFinishDaily" style="width: auto; background: var(--accent);">
        ⚡ Continue to Extra Practice
      </button>
    </div>
  `;

  document.getElementById('btnFinishDaily').onclick = () => {
    const extraTabBtn = document.querySelector('.tab-btn[data-tab="extra"]');
    if (extraTabBtn) switchTab('extra', extraTabBtn);
  };

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
          topic: 'Daily Warm-up (Completed)',
          tokensEarned: 10,
          xpEarned: 0,
          newTotalXP: currentUser.xp,
          newStreak: currentUser.streak,
          newTokens: currentUser.tokens,
          isDailyWarmup: true,
          proficiency: currentUser.proficiency
        })
      });
    } catch(e) {}
  }
}

function resetExtraPracticeUI() {
  document.getElementById('extraActiveCard').innerHTML = `
    <div class="q-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <span id="extraQProgress" style="font-weight: 700;">Question 1 of 5 (Extra)</span>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="stat-badge" style="background: rgba(79, 70, 229, 0.1); color: var(--accent); font-size: 0.8rem;">
          ⚡ +2 XP per correct
        </span>
        <button class="btn" id="exitExtraBtn" style="width: auto; padding: 4px 10px; font-size: 0.8rem; background: var(--bg-primary); color: var(--text-main); border: 1px solid var(--border-color);">
          🚪 Exit
        </button>
      </div>
    </div>

    <div id="extraQPrompt" class="q-prompt">Loading extra question...</div>
    <div id="extraWorkspace"></div>

    <div id="extraFeedbackBox" class="feedback-box hidden">
      <h3 id="extraFeedbackTitle" style="margin-bottom: 6px;">Explanation</h3>
      <div id="extraVisualExp" class="visual-explanation"></div>
      <button class="btn" id="extraNextBtn" style="margin-top: 16px;">Next Question ➔</button>
    </div>

    <button class="btn" id="extraSubmitBtn" style="margin-top: 20px;">Check Answer</button>
  `;

  document.getElementById('extraSubmitBtn').onclick = handleExtraAnswerSubmit;
  document.getElementById('extraNextBtn').onclick = handleExtraNextQuestion;
  document.getElementById('exitExtraBtn').onclick = exitExtraPractice;
}

function exitExtraPractice() {
  resetExtraPracticeUI();
  document.getElementById('extraActiveCard').classList.add('hidden');
  document.getElementById('extraSetupCard').classList.remove('hidden');
}

function startExtraPracticeSession() {
  activeExtraTopicKey = document.getElementById('extraTopicSelect').value;
  extraTotalQuestions = parseInt(document.getElementById('extraCountSelect').value, 10);
  extraQIndex = 0;
  extraSessionScore = 0;

  extraQuestions = [];
  for (let i = 0; i < extraTotalQuestions; i++) {
    if (activeExtraTopicKey === 'random') {
      extraQuestions.push(getAdaptiveQuestion(currentUser.proficiency));
    } else {
      extraQuestions.push(getQuestionByType(activeExtraTopicKey));
    }
  }

  document.getElementById('extraSetupCard').classList.add('hidden');
  document.getElementById('extraActiveCard').classList.remove('hidden');

  renderCurrentExtraQuestion();
}

function renderCurrentExtraQuestion() {
  currentExtraQuestion = extraQuestions[extraQIndex];
  document.getElementById('extraQProgress').innerText = `Question ${extraQIndex + 1} of ${extraTotalQuestions} (Extra)`;
  document.getElementById('extraQPrompt').innerHTML = currentExtraQuestion.prompt;

  const ws = document.getElementById('extraWorkspace');
  renderQuestion(currentExtraQuestion, ws);

  document.getElementById('extraFeedbackBox').classList.add('hidden');
  document.getElementById('extraSubmitBtn').classList.remove('hidden');
}

function handleExtraAnswerSubmit() {
  const isCorrect = evaluateQuestion(currentExtraQuestion);
  const qType = currentExtraQuestion.type;

  if (!currentUser.proficiency[qType]) {
    currentUser.proficiency[qType] = [];
  }

  currentUser.proficiency[qType].push(isCorrect ? 1 : 0);
  currentUser.proficiency[qType] = currentUser.proficiency[qType].slice(-10);

  const fbBox = document.getElementById('extraFeedbackBox');
  fbBox.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');

  let xpEarned = 0;
  if (isCorrect) {
    extraSessionScore++;
    xpEarned = 2;
    fbBox.classList.add('feedback-correct');
    document.getElementById('extraFeedbackTitle').innerText = "🎯 Correct! (+2 XP)";
    currentUser.xp += 2;
    updateHeader();
  } else {
    fbBox.classList.add('feedback-incorrect');
    document.getElementById('extraFeedbackTitle').innerText = "💡 Visual Explanation:";
  }

  document.getElementById('extraVisualExp').innerHTML = currentExtraQuestion.explanation;
  document.getElementById('extraSubmitBtn').classList.add('hidden');

  // WRITE IMMEDIATELY TO GOOGLE SHEETS
  const topicLabel = activeExtraTopicKey === 'random' ? 'Random Mix' : activeExtraTopicKey;
  syncQuestionProgressToSheet(`Extra Practice (${topicLabel})`, xpEarned, 0, false);
}

function handleExtraNextQuestion() {
  extraQIndex++;
  if (extraQIndex < extraTotalQuestions) {
    renderCurrentExtraQuestion();
  } else {
    finishExtraPracticeSession();
  }
}

async function finishExtraPracticeSession() {
  const accuracy = Math.round((extraSessionScore / extraTotalQuestions) * 100);
  const totalXPEarned = extraSessionScore * 2;

  const topicLabel = activeExtraTopicKey === 'random' ? 'Random Mix' : activeExtraTopicKey;

  document.getElementById('extraActiveCard').innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: var(--success); font-size: 1.8rem;">🎉 Extra Practice Complete!</h2>
      <p style="font-size: 1.2rem; margin: 12px 0;">Score: <strong>${extraSessionScore} / ${extraTotalQuestions} (${accuracy}%)</strong></p>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Earned <strong>+${totalXPEarned} XP</strong>!</p>
      
      <button class="btn" id="btnRestartExtra" style="width: auto; background: var(--accent);">
        ⚡ Start Another Extra Practice
      </button>
    </div>
  `;

  document.getElementById('btnRestartExtra').onclick = () => {
    resetExtraPracticeUI();
    document.getElementById('extraActiveCard').classList.add('hidden');
    document.getElementById('extraSetupCard').classList.remove('hidden');
  };

  if (sheetWebAppUrl) {
    try {
      await fetch(sheetWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveProgress',
          studentCode: currentUser.code,
          studentName: currentUser.name,
          totalQuestions: extraTotalQuestions,
          accuracy: accuracy,
          topic: `Extra Practice (${topicLabel}) (Completed)`,
          tokensEarned: 0,
          xpEarned: 0,
          newTotalXP: currentUser.xp,
          newStreak: currentUser.streak,
          newTokens: currentUser.tokens,
          isDailyWarmup: false,
          proficiency: currentUser.proficiency
        })
      });
    } catch(e) {}
  }
}

function renderStudentProgressTab() {
  const container = document.getElementById('studentProgressContainer');
  if (!container || !currentUser) return;

  let html = '';
  ALL_TOPICS.forEach(topic => {
    let history = (currentUser.proficiency && currentUser.proficiency[topic.key]) || [];
    if (topic.key === 'place_value' && history.length === 0 && currentUser.proficiency) {
      history = currentUser.proficiency['placeValue'] || [];
    }

    const numHistory = history.map(v => Number(v));
    const attemptsCount = numHistory.length;
    
    let accuracyPct = 0;
    let badgeHtml = `<span style="background: var(--bg-primary); color: var(--text-muted); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 0.85rem;">⚪ Untried</span>`;

    if (attemptsCount > 0) {
      const score = numHistory.reduce((a, b) => a + b, 0);
      const acc = score / attemptsCount;
      accuracyPct = Math.round(acc * 100);

      if (acc > 0.80) {
        badgeHtml = `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.85rem;">🟢 Mastered (${accuracyPct}%)</span>`;
      } else if (acc >= 0.50) {
        badgeHtml = `<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.85rem;">🟡 Developing (${accuracyPct}%)</span>`;
      } else {
        badgeHtml = `<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.85rem;">🔴 Needs Practice (${accuracyPct}%)</span>`;
      }
    }

    let dotsHtml = '';
    for (let i = 0; i < 10; i++) {
      if (i < attemptsCount) {
        const val = numHistory[i];
        if (val === 1) {
          dotsHtml += `<span title="Attempt ${i+1}: Correct" style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#10b981; color:white; font-size:0.75rem; font-weight:800; text-align:center;">✓</span>`;
        } else {
          dotsHtml += `<span title="Attempt ${i+1}: Incorrect" style="display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:#ef4444; color:white; font-size:0.75rem; font-weight:800; text-align:center;">✕</span>`;
        }
      } else {
        dotsHtml += `<span title="Attempt ${i+1}: Empty" style="display:inline-block; width:22px; height:22px; border-radius:50%; background:var(--bg-primary); border:2px dashed var(--border-color);"></span>`;
      }
    }

    html += `
      <div style="background: var(--bg-card); border: 2px solid var(--border-color); border-radius: var(--radius); padding: 18px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${topic.name}</h3>
          ${badgeHtml}
        </div>

        <div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 6px;">Recent 10 Attempts History:</span>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            ${dotsHtml}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Total Logged: <strong>${attemptsCount} / 10</strong></span>
          <button class="btn btn-practice-topic" data-key="${topic.key}" style="width: auto; padding: 6px 14px; font-size: 0.85rem; background: var(--accent);">
            ⚡ Practice Topic Now
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.btn-practice-topic').forEach(btn => {
    btn.onclick = () => {
      const topicKey = btn.getAttribute('data-key');
      const extraSelect = document.getElementById('extraTopicSelect');
      if (extraSelect) extraSelect.value = topicKey;

      // DEFAULT QUESTION COUNT TO 3
      const extraCount = document.getElementById('extraCountSelect');
      if (extraCount) extraCount.value = '3';

      resetExtraPracticeUI();
      const extraTabBtn = document.querySelector('.tab-btn[data-tab="extra"]');
      if (extraTabBtn) switchTab('extra', extraTabBtn);

      startExtraPracticeSession();
    };
  });
}

async function loadTeacherDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('userStatsHeader').classList.add('hidden');
  document.getElementById('teacherHeader').classList.remove('hidden');
  document.getElementById('teacherDashboard').classList.remove('hidden');

  await fetchTeacherDashboardData();
}

async function fetchTeacherDashboardData() {
  if (!sheetWebAppUrl) {
    renderRosterTable([]);
    return;
  }

  try {
    const res = await fetch(sheetWebAppUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'login', studentCode: '3005' })
    });
    const data = await res.json();

    if (data.success && data.isTeacher) {
      teacherRosterData = data.students || [];
      populateClassDropdown(teacherRosterData);
      applyRosterFilters();
    }
  } catch (e) {
    alert("Could not fetch roster data. Check your Web App URL connection.");
  }
}

function populateClassDropdown(students) {
  const classSelect = document.getElementById('classFilterSelect');
  if (!classSelect) return;

  const currentSelection = activeClassFilter.trim();
  const classes = [...new Set(students.map(s => String(s.className || '').trim()).filter(Boolean))].sort();

  let html = `<option value="all">All Classes</option>`;
  classes.forEach(c => {
    html += `<option value="${c}" ${c === currentSelection ? 'selected' : ''}>${c}</option>`;
  });

  classSelect.innerHTML = html;
}

function setRosterFilter(filterType) {
  activeRosterFilter = filterType;

  document.querySelectorAll('.filter-chip').forEach(btn => {
    if (btn.getAttribute('data-filter') === filterType) {
      btn.classList.add('active');
      btn.style.background = 'var(--accent)';
      btn.style.color = 'white';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'var(--bg-primary)';
      btn.style.color = 'var(--text-main)';
    }
  });

  applyRosterFilters();
}

function applyRosterFilters() {
  let filtered = [...teacherRosterData];
  const todayStr = getTodayDateString();

  if (activeClassFilter !== 'all') {
    filtered = filtered.filter(s => String(s.className || '').trim() === activeClassFilter);
  }

  renderTeacherKPIs(filtered);
  updateHeaderTopicAverages(filtered);

  if (activeRosterFilter === 'active_today') {
    filtered = filtered.filter(s => s.lastActive && s.lastActive.split('T')[0] === todayStr);
  } else if (activeRosterFilter === 'needs_attention') {
    filtered = filtered.filter(s => {
      const profs = s.proficiency || {};
      let scores = [];
      Object.keys(profs).forEach(k => {
        if (profs[k].length > 0) {
          const numArr = profs[k].map(Number);
          scores.push(numArr.reduce((a, b) => a + b, 0) / numArr.length);
        }
      });
      return scores.length > 0 && (scores.reduce((a, b) => a + b, 0) / scores.length) < 0.50;
    });
  } else if (activeRosterFilter === 'uncompleted_daily') {
    filtered = filtered.filter(s => s.lastDailyCompleted !== todayStr);
  }

  renderRosterTable(filtered);
}

function renderTeacherKPIs(studentsInSelectedClass) {
  const total = studentsInSelectedClass.length;
  let totalXP = 0;
  let strugglingCount = 0;
  let activeTodayCount = 0;

  const todayStr = getTodayDateString();

  studentsInSelectedClass.forEach(s => {
    totalXP += s.xp || 0;
    if (s.lastActive && s.lastActive.split('T')[0] === todayStr) {
      activeTodayCount++;
    }

    const profs = s.proficiency || {};
    let scores = [];
    Object.keys(profs).forEach(k => {
      if (profs[k].length > 0) {
        const numArr = profs[k].map(Number);
        const sum = numArr.reduce((a, b) => a + b, 0);
        scores.push(sum / numArr.length);
      }
    });

    if (scores.length > 0) {
      const avgAcc = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgAcc < 0.50) strugglingCount++;
    }
  });

  document.getElementById('kpiTotalStudents').innerText = total;
  document.getElementById('kpiActiveToday').innerText = activeTodayCount;
  document.getElementById('kpiAvgXP').innerText = total > 0 ? Math.round(totalXP / total) : 0;
  document.getElementById('kpiStruggling').innerText = strugglingCount;
}

function updateHeaderTopicAverages(students) {
  ALL_TOPICS.forEach(topic => {
    const el = document.getElementById(`hdrAvg_${topic.key}`);
    if (!el) return;

    if (!students || students.length === 0) {
      el.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem; font-weight:600;">(--)</span>`;
      return;
    }

    let totalAccSum = 0;
    let studentsWithAttempts = 0;

    students.forEach(s => {
      let history = (s.proficiency && s.proficiency[topic.key]) || [];
      if (topic.key === 'place_value' && history.length === 0 && s.proficiency) {
        history = s.proficiency['placeValue'] || [];
      }

      if (history.length > 0) {
        const numArr = history.map(Number);
        const avg = numArr.reduce((a, b) => a + b, 0) / numArr.length;
        totalAccSum += avg;
        studentsWithAttempts++;
      }
    });

    if (studentsWithAttempts === 0) {
      el.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem; font-weight:600;">(⚪ Untried)</span>`;
    } else {
      const topicAvgAcc = totalAccSum / studentsWithAttempts;
      const pct = Math.round(topicAvgAcc * 100);

      if (topicAvgAcc > 0.80) {
        el.innerHTML = `<span style="color:#10b981; font-size:0.75rem; font-weight:800;">(🟢 ${pct}%)</span>`;
      } else if (topicAvgAcc >= 0.50) {
        el.innerHTML = `<span style="color:#d97706; font-size:0.75rem; font-weight:800;">(🟡 ${pct}%)</span>`;
      } else {
        el.innerHTML = `<span style="color:#ef4444; font-size:0.75rem; font-weight:800;">(🔴 ${pct}%)</span>`;
      }
    }
  });
}

function renderRosterTable(students) {
  const tbody = document.getElementById('rosterTableBody');
  if (!tbody) return;

  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="15" style="text-align:center; padding: 20px;">No matching student records found.</td></tr>`;
    return;
  }

  const topicKeys = ALL_TOPICS.map(t => t.key);

  let html = '';
  students.forEach(s => {
    const lastDateDisplay = s.lastDailyCompleted ? s.lastDailyCompleted : '<span style="color:var(--text-muted);">Never</span>';

    html += `
      <tr>
        <td class="sticky-col col-code">
          <span class="code-toggle" data-code="${s.code}" title="Tap to reveal/hide">••••</span>
        </td>
        <td class="sticky-col col-name">
          <span class="student-name-link" data-code="${s.code}" style="color: var(--accent); font-weight: 700; cursor: pointer; text-decoration: underline;" title="Tap to manage XP and Tokens">${s.name}</span>
        </td>
        <td>${s.className}</td>
        <td>${lastDateDisplay}</td>
        <td>🔥 ${s.streak}</td>
        <td>⭐ ${s.xp}</td>
        <td>🎟️ <strong>${s.tokens}</strong></td>
    `;

    topicKeys.forEach(tKey => {
      let history = (s.proficiency && s.proficiency[tKey]) || [];
      if (tKey === 'place_value' && history.length === 0 && s.proficiency) {
        history = s.proficiency['placeValue'] || [];
      }
      html += `<td>${getProfBadgeHtml(history)}</td>`;
    });

    html += `</tr>`;
  });

  tbody.innerHTML = html;

  tbody.querySelectorAll('.student-name-link').forEach(el => {
    el.onclick = () => {
      const code = el.getAttribute('data-code');
      openStudentManageModal(code);
    };
  });

  tbody.querySelectorAll('.code-toggle').forEach(el => {
    el.onclick = () => {
      const realCode = el.getAttribute('data-code');
      if (el.innerText === '••••') {
        el.innerText = realCode;
        el.style.letterSpacing = 'normal';
      } else {
        el.innerText = '••••';
        el.style.letterSpacing = '2px';
      }
    };
  });
}

function getProfBadgeHtml(history) {
  if (!history || history.length === 0) {
    return `<span class="prof-badge prof-untried" style="background: var(--bg-primary); color: var(--text-muted); border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 6px; font-weight: 700;">Untried</span>`;
  }

  const numHistory = history.map(v => Number(v));
  const score = numHistory.reduce((a, b) => a + b, 0);
  const acc = score / numHistory.length;
  const pct = Math.round(acc * 100);

  if (acc > 0.80) {
    return `<span class="prof-badge prof-mastered" style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 6px; font-weight: 700;">🟢 ${pct}%</span>`;
  } else if (acc >= 0.50) {
    return `<span class="prof-badge prof-developing" style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 4px 8px; border-radius: 6px; font-weight: 700;">🟡 ${pct}%</span>`;
  } else {
    return `<span class="prof-badge prof-struggling" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 8px; border-radius: 6px; font-weight: 700;">🔴 ${pct}%</span>`;
  }
}

function openSampleQuestionModal(typeKey, topicTitle) {
  activeSampleTopicKey = typeKey;
  document.getElementById('sampleModalTitle').innerText = `Sample Question: ${topicTitle}`;
  generateSampleQuestion(typeKey);
  document.getElementById('sampleQuestionModal').classList.remove('hidden');
}

function generateSampleQuestion(typeKey) {
  const q = getQuestionByType(typeKey);
  if (!q) return;

  document.getElementById('sampleQPrompt').innerHTML = q.prompt;
  const ws = document.getElementById('sampleQWorkspace');
  renderQuestion(q, ws);
}

function openStudentManageModal(studentCode) {
  const student = teacherRosterData.find(s => s.code === studentCode);
  if (!student) return;

  activeManageStudentCode = studentCode;
  document.getElementById('mStudentName').innerText = student.name;
  document.getElementById('mStudentClass').innerText = student.className;
  document.getElementById('mStudentCode').innerText = student.code;
  document.getElementById('mCurrentXP').innerText = student.xp || 0;
  document.getElementById('mCurrentTokens').innerText = student.tokens || 0;

  switchManageMode('xp');
  document.getElementById('studentManageModal').classList.remove('hidden');
}

function switchManageMode(mode) {
  manageTargetMode = mode;
  currentDigits = '0';
  isNegativeSign = false;

  const btnXP = document.getElementById('tabModeXP');
  const btnTokens = document.getElementById('tabModeTokens');
  const lbl = document.getElementById('mActiveModeLabel');

  if (mode === 'xp') {
    if (btnXP) { btnXP.style.background = 'var(--accent)'; btnXP.style.color = 'white'; }
    if (btnTokens) { btnTokens.style.background = 'var(--bg-primary)'; btnTokens.style.color = 'var(--text-main)'; }
    if (lbl) lbl.innerText = 'XP Adjustment:';
  } else {
    if (btnTokens) { btnTokens.style.background = '#d97706'; btnTokens.style.color = 'white'; }
    if (btnXP) { btnXP.style.background = 'var(--bg-primary)'; btnXP.style.color = 'var(--text-main)'; }
    if (lbl) lbl.innerText = 'Tokens Adjustment:';
  }

  updateManageKeypadDisplay();
}

function updateManageKeypadDisplay() {
  const display = document.getElementById('mKeypadDisplay');
  if (!display) return;

  const val = parseInt(currentDigits, 10) || 0;
  const signedVal = isNegativeSign ? -val : val;

  if (manageTargetMode === 'xp') {
    xpChangeVal = signedVal;
  } else {
    tokenChangeVal = signedVal;
  }

  const prefix = signedVal > 0 ? '+' : '';
  display.innerText = `${prefix}${signedVal}`;
  display.style.color = signedVal < 0 ? 'var(--danger)' : (manageTargetMode === 'xp' ? 'var(--accent)' : '#d97706');
}

async function processStudentManagement() {
  if (!activeManageStudentCode || !sheetWebAppUrl) return;

  const student = teacherRosterData.find(s => s.code === activeManageStudentCode);
  if (!student) return;

  const newXP = Math.max(0, (student.xp || 0) + xpChangeVal);
  const newTokens = Math.max(0, (student.tokens || 0) + tokenChangeVal);

  try {
    const res = await fetch(sheetWebAppUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'adminUpdateStudent',
        studentCode: activeManageStudentCode,
        xpAdjustment: xpChangeVal,
        tokenAdjustment: tokenChangeVal
      })
    });
    const data = await res.json();

    if (data.success) {
      student.xp = newXP;
      student.tokens = newTokens;
      applyRosterFilters();
      document.getElementById('studentManageModal').classList.add('hidden');
    } else {
      alert("Failed to update student: " + (data.error || "Unknown error"));
    }
  } catch (e) {
    alert("Network error updating student details.");
  }
}
