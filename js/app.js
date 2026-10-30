import { getAdaptiveQuestion, getQuestionByType, evaluateQuestion, renderQuestion } from './questions/registry.js';
import './questions/numberLine.js';
import './questions/gridShader.js';
import './questions/equivalence.js';
import './questions/placeValue.js';
import './questions/negativeNumbers.js';
import './questions/addSubtractNegatives.js';

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
let activeRedeemStudentCode = null;

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initApp() {
  const sheetInput = document.getElementById('sheetUrlInput');
  if (sheetInput) sheetInput.value = sheetWebAppUrl;

  setupEventHandlers();
  setupKeypad();
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

  // Extra Practice Handlers
  document.getElementById('startExtraBtn').onclick = startExtraPracticeSession;
  document.getElementById('extraSubmitBtn').onclick = handleExtraAnswerSubmit;
  document.getElementById('extraNextBtn').onclick = handleExtraNextQuestion;
  document.getElementById('goToExtraBtn').onclick = () => {
    const extraTabBtn = document.querySelector('.tab-btn[data-tab="extra"]');
    if (extraTabBtn) switchTab('extra', extraTabBtn);
  };

  // System Settings Handlers
  document.getElementById('saveSheetBtn').onclick = saveSheetUrl;
  if (document.getElementById('refreshTeacherDataBtn')) {
    document.getElementById('refreshTeacherDataBtn').onclick = fetchTeacherDashboardData;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  const teacherLogoutBtn = document.getElementById('teacherLogoutBtn');
  if (logoutBtn) logoutBtn.onclick = logout;
  if (teacherLogoutBtn) teacherLogoutBtn.onclick = logout;

  // Real-time Search Handler
  const searchInput = document.getElementById('rosterSearchInput');
  if (searchInput) {
    searchInput.oninput = (e) => filterRosterTable(e.target.value);
  }

  // Clickable Header Handlers for Teaching Demos
  document.querySelectorAll('.topic-hdr').forEach(hdr => {
    hdr.onclick = () => {
      const typeKey = hdr.getAttribute('data-type');
      openSampleQuestionModal(typeKey, hdr.innerText);
    };
  });

  // Modal Close Handlers
  document.getElementById('closeSampleModalBtn').onclick = () => {
    document.getElementById('sampleQuestionModal').classList.add('hidden');
  };

  document.getElementById('closeRedeemModalBtn').onclick = () => {
    document.getElementById('redeemTokenModal').classList.add('hidden');
  };

  document.getElementById('newSampleQBtn').onclick = () => {
    generateSampleQuestion(activeSampleTopicKey);
  };

  // Reward Selection Change Handler
  document.getElementById('redeemRewardSelect').onchange = (e) => {
    const customBox = document.getElementById('customTokenBox');
    if (e.target.value === 'custom') {
      customBox.classList.remove('hidden');
    } else {
      customBox.classList.add('hidden');
    }
  };

  document.getElementById('confirmRedeemBtn').onclick = processTokenRedemption;

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

  // 1. TEACHER DASHBOARD LOGIN (PIN 3005)
  if (enteredPin === '3005') {
    enteredPin = '';
    document.getElementById('pinDisplay').innerText = '••••';
    loadTeacherDashboard();
    return;
  }

  // 2. STUDENT LOGIN
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
          class: data.className || 'Sec 2',
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

  // Local Student Fallback
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

  // Check if student completed daily questions today
  if (currentUser.dailyDoneToday) {
    document.getElementById('dailyActiveCard').classList.add('hidden');
    document.getElementById('dailyLockedCard').classList.remove('hidden');
  } else {
    document.getElementById('dailyLockedCard').classList.add('hidden');
    document.getElementById('dailyActiveCard').classList.remove('hidden');
    startDailySession();
  }
}

// DAILY PRACTICE LOGIC
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
  currentUser.proficiency[qType] = currentUser.proficiency[qType].slice(-5);

  const fbBox = document.getElementById('feedbackBox');
  fbBox.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');

  if (isCorrect) {
    sessionScore++;
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
          topic: 'Daily Warm-up',
          tokensEarned: 10,
          xpEarned: sessionScore * 20,
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

// EXTRA PRACTICE LOGIC
function resetExtraPracticeUI() {
  document.getElementById('extraActiveCard').innerHTML = `
    <div class="q-header">
      <span id="extraQProgress" style="font-weight: 700;">Question 1 of 5 (Extra)</span>
      <span class="stat-badge" style="background: rgba(79, 70, 229, 0.1); color: var(--accent); font-size: 0.8rem;">
        ⚡ +2 XP per correct
      </span>
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
  currentUser.proficiency[qType] = currentUser.proficiency[qType].slice(-5);

  const fbBox = document.getElementById('extraFeedbackBox');
  fbBox.classList.remove('hidden', 'feedback-correct', 'feedback-incorrect');

  if (isCorrect) {
    extraSessionScore++;
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
          topic: `Extra Practice (${topicLabel})`,
          tokensEarned: 0,
          xpEarned: totalXPEarned,
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

// TEACHER DASHBOARD LOGIC
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
      renderTeacherKPIs(teacherRosterData);
      renderRosterTable(teacherRosterData);
    }
  } catch (e) {
    alert("Could not fetch roster data. Check your Web App URL connection.");
  }
}

function renderTeacherKPIs(students) {
  const total = students.length;
  let totalXP = 0;
  let strugglingCount = 0;
  let activeTodayCount = 0;

  const todayStr = getTodayDateString();

  students.forEach(s => {
    totalXP += s.xp || 0;
    if (s.lastActive && s.lastActive.split('T')[0] === todayStr) {
      activeTodayCount++;
    }

    const profs = s.proficiency || {};
    let scores = [];
    Object.keys(profs).forEach(k => {
      if (profs[k].length > 0) {
        const sum = profs[k].reduce((a, b) => a + b, 0);
        scores.push(sum / profs[k].length);
      }
    });

    if (scores.length > 0) {
      const avgAcc = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgAcc < 0.6) strugglingCount++;
    }
  });

  document.getElementById('kpiTotalStudents').innerText = total;
  document.getElementById('kpiActiveToday').innerText = activeTodayCount;
  document.getElementById('kpiAvgXP').innerText = total > 0 ? Math.round(totalXP / total) : 0;
  document.getElementById('kpiStruggling').innerText = strugglingCount;
}

function renderRosterTable(students) {
  const tbody = document.getElementById('rosterTableBody');
  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">No matching student records found.</td></tr>`;
    return;
  }

  const topicKeys = ['grid_shader', 'number_line', 'equivalence', 'placeValue', 'negative_numbers', 'add_subtract_negatives'];

  let html = '';
  students.forEach(s => {
    html += `
      <tr>
        <td class="sticky-col col-code">
          <span class="code-toggle" data-code="${s.code}" title="Tap to reveal/hide">••••</span>
        </td>
        <td class="sticky-col col-name">${s.name}</td>
        <td>${s.className}</td>
        <td>🔥 ${s.streak}</td>
        <td>⭐ ${s.xp}</td>
        <td>
          🎟️ <strong>${s.tokens}</strong>
          <button class="btn-redeem" data-code="${s.code}">Redeem</button>
        </td>
    `;

    topicKeys.forEach(tKey => {
      const history = (s.proficiency && s.proficiency[tKey]) || [];
      html += `<td>${getProfBadgeHtml(history)}</td>`;
    });

    html += `</tr>`;
  });

  tbody.innerHTML = html;

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

  tbody.querySelectorAll('.btn-redeem').forEach(btn => {
    btn.onclick = () => {
      const code = btn.getAttribute('data-code');
      openRedeemModal(code);
    };
  });
}

function getProfBadgeHtml(history) {
  if (!history || history.length === 0) {
    return `<span class="prof-badge prof-untried">Untried</span>`;
  }

  const score = history.reduce((a, b) => a + b, 0);
  const acc = score / history.length;
  const pct = Math.round(acc * 100);

  if (acc >= 0.8) {
    return `<span class="prof-badge prof-mastered">🟢 ${pct}%</span>`;
  } else if (acc >= 0.5) {
    return `<span class="prof-badge prof-developing">🟡 ${pct}%</span>`;
  } else {
    return `<span class="prof-badge prof-struggling">🔴 ${pct}%</span>`;
  }
}

function filterRosterTable(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderRosterTable(teacherRosterData);
    return;
  }

  const filtered = teacherRosterData.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.className.toLowerCase().includes(q) ||
    String(s.code).includes(q)
  );

  renderRosterTable(filtered);
}

function openSampleQuestionModal(typeKey, titleText) {
  activeSampleTopicKey = typeKey;
  document.getElementById('sampleModalTitle').innerText = titleText.replace('👁️', '') + ' - Teaching Sample';
  document.getElementById('sampleQuestionModal').classList.remove('hidden');
  generateSampleQuestion(typeKey);
}

function generateSampleQuestion(typeKey) {
  const sampleQ = getQuestionByType(typeKey);
  if (!sampleQ) return;

  document.getElementById('sampleQPrompt').innerHTML = sampleQ.prompt;
  const ws = document.getElementById('sampleQWorkspace');
  renderQuestion(sampleQ, ws);
}

function openRedeemModal(studentCode) {
  const student = teacherRosterData.find(s => String(s.code) === String(studentCode));
  if (!student) return;

  activeRedeemStudentCode = studentCode;
  document.getElementById('redeemStudentName').innerText = student.name;
  document.getElementById('redeemCurrentTokens').innerText = student.tokens;
  document.getElementById('redeemRewardSelect').value = '50';
  document.getElementById('customTokenBox').classList.add('hidden');
  document.getElementById('customTokenInput').value = '';

  document.getElementById('redeemTokenModal').classList.remove('hidden');
}

async function processTokenRedemption() {
  const student = teacherRosterData.find(s => String(s.code) === String(activeRedeemStudentCode));
  if (!student) return;

  const selVal = document.getElementById('redeemRewardSelect').value;
  let cost = 0;

  if (selVal === 'custom') {
    cost = parseInt(document.getElementById('customTokenInput').value, 10);
    if (isNaN(cost) || cost <= 0) {
      alert("Please enter a valid token amount.");
      return;
    }
  } else {
    cost = parseInt(selVal, 10);
  }

  if (student.tokens < cost) {
    alert(`Student only has ${student.tokens} tokens (Needs ${cost}).`);
    return;
  }

  student.tokens -= cost;

  if (sheetWebAppUrl) {
    try {
      await fetch(sheetWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveProgress',
          studentCode: student.code,
          studentName: student.name,
          totalQuestions: 0,
          accuracy: 100,
          topic: 'Reward Redemption',
          tokensEarned: -cost,
          xpEarned: 0,
          newTotalXP: student.xp,
          newStreak: student.streak,
          newTokens: student.tokens,
          isDailyWarmup: false,
          proficiency: student.proficiency
        })
      });
    } catch(e) {}
  }

  document.getElementById('redeemTokenModal').classList.add('hidden');
  renderRosterTable(teacherRosterData);
  alert(`Redeemed! ${cost} tokens deducted from ${student.name}.`);
}

function logout() {
  currentUser = null;
  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('teacherDashboard').classList.add('hidden');
  document.getElementById('userStatsHeader').classList.add('hidden');
  document.getElementById('teacherHeader').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('pinDisplay').innerText = '••••';
}

function updateHeader() {
  document.getElementById('hdrStreak').innerText = currentUser.streak;
  document.getElementById('hdrXP').innerText = currentUser.xp;
  document.getElementById('hdrTokens').innerText = currentUser.tokens;
}

function switchTab(tabName, targetBtn) {
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
  document.getElementById('tabPractice').classList.add('hidden');
  document.getElementById('tabExtra').classList.add('hidden');
  document.getElementById('tabShop').classList.add('hidden');

  if (tabName === 'practice') document.getElementById('tabPractice').classList.remove('hidden');
  if (tabName === 'extra') document.getElementById('tabExtra').classList.remove('hidden');
  if (tabName === 'shop') document.getElementById('tabShop').classList.remove('hidden');

  targetBtn.classList.add('active');
}

function saveSheetUrl() {
  const url = document.getElementById('sheetUrlInput').value.trim();
  sheetWebAppUrl = url;
  localStorage.setItem('NUMSENSE_SHEET_URL', url);
  alert('Saved connection URL!');
}
