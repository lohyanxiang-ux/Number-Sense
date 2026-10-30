import { getAdaptiveQuestion, getQuestionByType, evaluateQuestion, renderQuestion } from './questions/registry.js';
import './questions/numberLine.js';
import './questions/gridShader.js';
import './questions/equivalence.js';
import './questions/placeValue.js';
import './questions/negativeNumbers.js';

let currentUser = null;
let sheetWebAppUrl = localStorage.getItem('NUMSENSE_SHEET_URL') || '';
let currentQIndex = 0;
let sessionScore = 0;
const TOTAL_QUESTIONS = 5;
let questions = [];
let currentQuestion = null;
let isExtraPractice = false;
let enteredPin = '';

// Teacher Dashboard State
let teacherRosterData = [];
let activeSampleTopicKey = '';
let activeRedeemStudentCode = null;

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
  if (sheetWebAppUrl) {
    try {
      const res = await fetch(sheetWebAppUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', studentCode: enteredPin })
      });
      const data = await res.json();
      if (data.success && !data.isTeacher) {
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
        enteredPin = '';
        startStudentSession();
        return;
      }
    } catch (e) {}
  }

  // Local Student Fallback
  currentUser = { code: enteredPin, name: 'Student ' + enteredPin, class: 'Sec 2A', xp: 0, streak: 1, tokens: 0, proficiency: {} };
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
  startDailySession(false);
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

  const todayStr = new Date().toISOString().split('T')[0];

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
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px;">No matching student records found.</td></tr>`;
    return;
  }

  const topicKeys = ['grid_shader', 'number_line', 'equivalence', 'place_value'];

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

  // Toggle Masked Student Code Handler
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

  // Attach Redeem Button Handlers
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

// Search Filter Logic
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

// Sample Question Teaching Demo
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

// Token Redemption Logic
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
          newTotalXP: student.xp,
          newStreak: student.streak,
          newTokens: student.tokens,
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

function startDailySession(extraMode = false) {
  isExtraPractice = extraMode;
  currentQIndex = 0;
  sessionScore = 0;
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
  updateHeader();

  const accuracy = Math.round((sessionScore / TOTAL_QUESTIONS) * 100);
  const modeText = isExtraPractice ? 'Extra Practice Complete!' : 'Warm-up Complete!';

  document.getElementById('workspace').innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: var(--success); font-size: 1.8rem;">🎉 ${modeText}</h2>
      <p style="font-size: 1.2rem; margin: 12px 0;">Score: <strong>${sessionScore} / ${TOTAL_QUESTIONS} (${accuracy}%)</strong></p>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Earned 🎟️ 10 Tokens! Day Streak: 🔥 ${currentUser.streak}</p>
      
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

  document.getElementById('btnExtraPractice').onclick = () => startDailySession(true);
  document.getElementById('btnFinish').onclick = () => {
    document.getElementById('workspace').innerHTML = `<p style="text-align: center; font-size: 1.1rem; padding: 30px;">All done for today! See you tomorrow! 👋</p>`;
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

  if (tabName === 'practice') document.getElementById('tabPractice').classList.remove('hidden');
  if (tabName === 'shop') document.getElementById('tabShop').classList.remove('hidden');

  targetBtn.classList.add('active');
}

function saveSheetUrl() {
  const url = document.getElementById('sheetUrlInput').value.trim();
  sheetWebAppUrl = url;
  localStorage.setItem('NUMSENSE_SHEET_URL', url);
  alert('Saved connection URL!');
}
