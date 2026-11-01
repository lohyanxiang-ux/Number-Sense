import { getAdaptiveQuestion, evaluateQuestion, renderQuestion } from '../../questions/registry.js';
import { audioCore } from '../audio/fluencyAudioCore.js';
import { blitzAudio } from '../audio/blitzAudio.js';

export function mountBlitzMode(container, user, onComplete) {
  let timeLeft = 30;
  let correctCount = 0;
  let totalQuestions = 0;
  let timerInterval = null;
  let currentQuestion = null;
  const startTime = Date.now();

  audioCore.init();
  blitzAudio.startBGM();

  function updateMuteButtonState() {
    const btn = container.querySelector('#btnToggleBlitzSound');
    if (btn) {
      if (audioCore.isMuted) {
        btn.innerText = '🔇 Sound: OFF';
        btn.style.background = 'rgba(239, 68, 68, 0.15)';
        btn.style.color = '#ef4444';
        btn.style.borderColor = '#ef4444';
      } else {
        btn.innerText = '🔊 Sound: ON';
        btn.style.background = 'rgba(16, 185, 129, 0.15)';
        btn.style.color = '#10b981';
        btn.style.borderColor = '#10b981';
      }
    }
  }

  container.innerHTML = `
    <div class="card" style="max-width: 680px; margin: 0 auto; padding: 20px; user-select: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <span style="font-size: 1.2rem; font-weight: 900; color: #6366f1;">⚡ Shuriken Blitz</span>
          <button id="btnToggleBlitzSound" style="
            padding: 4px 10px;
            font-size: 0.8rem;
            font-weight: 800;
            border-radius: 8px;
            border: 1px solid;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            🔊 Sound: ON
          </button>
        </div>

        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="font-size: 0.9rem; font-weight: 800; color: var(--text-muted);">
            Targets Smashed: <span id="blitzScore" style="color: #6366f1; font-size: 1.2rem;">0</span>
          </div>
          <div style="background: rgba(99, 102, 241, 0.15); border: 2px solid #6366f1; color: #6366f1; font-weight: 900; font-size: 1.2rem; padding: 6px 14px; border-radius: 10px;" id="blitzTimer">
            ⏳ 30s
          </div>
        </div>
      </div>

      <div id="blitzPrompt" class="q-prompt" style="font-size: 1.2rem; margin-bottom: 14px;">Loading target...</div>
      <div id="blitzWorkspace"></div>

      <button class="btn" id="blitzSubmitBtn" style="margin-top: 20px; background: #6366f1; font-weight: 800; padding: 14px; font-size: 1.1rem;">
        🎯 Strike Target!
      </button>
    </div>
  `;

  const toggleBtn = container.querySelector('#btnToggleBlitzSound');
  if (toggleBtn) {
    updateMuteButtonState();
    toggleBtn.onclick = () => {
      audioCore.toggleMute();
      if (audioCore.isMuted) {
        blitzAudio.stopBGM();
      } else {
        blitzAudio.startBGM();
      }
      updateMuteButtonState();
    };
  }

  function loadNextQuestion() {
    currentQuestion = getAdaptiveQuestion(user.proficiency);
    document.getElementById('blitzPrompt').innerHTML = currentQuestion.prompt;
    const ws = document.getElementById('blitzWorkspace');
    renderQuestion(currentQuestion, ws);
  }

  function handleAnswer() {
    blitzAudio.playThrowSwoosh();

    const isCorrect = evaluateQuestion(currentQuestion);
    totalQuestions++;

    if (isCorrect) {
      correctCount++;
      blitzAudio.playTargetHit();
      document.getElementById('blitzScore').innerText = correctCount;
    } else {
      blitzAudio.playTargetMiss();
    }

    loadNextQuestion();
  }

  document.getElementById('blitzSubmitBtn').onclick = handleAnswer;

  timerInterval = setInterval(() => {
    timeLeft--;
    const timerEl = document.getElementById('blitzTimer');
    if (timerEl) {
      timerEl.innerText = `⏳ ${timeLeft}s`;

      if (timeLeft <= 5 && timeLeft > 0) {
        timerEl.style.color = '#ef4444';
        timerEl.style.borderColor = '#ef4444';
        timerEl.style.background = 'rgba(239, 68, 68, 0.15)';
        audioCore.playTick();
      }
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      blitzAudio.stopBGM();
      audioCore.playVictoryFanfare();

      const elapsedSec = (Date.now() - startTime) / 1000;
      const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const avgSpeed = totalQuestions > 0 ? Number((elapsedSec / totalQuestions).toFixed(1)) : 0;

      if (typeof onComplete === 'function') {
        onComplete({
          accuracy,
          avgSpeed,
          totalQuestions,
          correctCount,
          victory: correctCount >= 5
        });
      }
    }
  }, 1000);

  loadNextQuestion();
}
