import { registerQuestionType } from './registry.js';

// Non-prime composite numbers capped at max 40
const targetNumbers = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25, 27, 28, 30, 32, 35, 36, 40];

function getAllFactors(n) {
  const factors = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) factors.push(i);
  }
  return factors;
}

const factorsModule = {
  generate() {
    const n = targetNumbers[Math.floor(Math.random() * targetNumbers.length)];
    const factors = getAllFactors(n);

    return {
      type: 'factors',
      n: n,
      allFactors: factors,
      userFactors: [],
      wrongAttempts: 0,
      maxWrongAttempts: 3,
      failed: false,
      prompt: `🔐 Crack the safe by finding all <strong>${factors.length}</strong> distinct factors of <strong>${n}</strong> (3 strikes max):`,
      explanation: `The factors of <strong>${n}</strong> are <strong>${factors.join(', ')}</strong> (total of ${factors.length} factors).`
    };
  },

  render(q, container) {
    let typedValue = '';
    let feedbackMsg = '';
    let feedbackType = 'info';

    const renderUI = () => {
      const totalFactorsCount = q.allFactors.length;
      const foundCount = q.userFactors.length;
      const isUnlocked = foundCount === totalFactorsCount;
      const isFailed = q.failed || q.wrongAttempts >= q.maxWrongAttempts;

      let tumblersHtml = '';
      for (let i = 0; i < totalFactorsCount; i++) {
        const isFilled = i < foundCount;
        tumblersHtml += `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: ${isFilled ? '#10b981' : 'rgba(239, 68, 68, 0.3)'};
              border: 2px solid ${isFilled ? '#10b981' : '#ef4444'};
              box-shadow: ${isFilled ? '0 0 8px #10b981' : 'none'};
            "></div>
            <span style="font-size: 0.65rem; font-weight: 800; color: #94a3b8;">T${i + 1}</span>
          </div>
        `;
      }

      let chipsHtml = '';
      for (let i = 0; i < totalFactorsCount; i++) {
        if (i < q.userFactors.length) {
          chipsHtml += `
            <div style="
              background: rgba(16, 185, 129, 0.15);
              border: 2px solid #10b981;
              color: #10b981;
              font-size: 1.2rem;
              font-weight: 800;
              padding: 6px 14px;
              border-radius: 10px;
              min-width: 44px;
              text-align: center;
            ">
              ${q.userFactors[i]}
            </div>
          `;
        } else {
          chipsHtml += `
            <div style="
              background: var(--bg-card);
              border: 2px dashed var(--border-color);
              color: var(--text-muted);
              font-size: 1.2rem;
              font-weight: 800;
              padding: 6px 14px;
              border-radius: 10px;
              min-width: 44px;
              text-align: center;
            ">
              ?
            </div>
          `;
        }
      }

      let strikesHtml = '';
      for (let s = 0; s < q.maxWrongAttempts; s++) {
        if (s < q.wrongAttempts) {
          strikesHtml += `<span style="color: #ef4444; font-size: 0.9rem;">❌</span>`;
        } else {
          strikesHtml += `<span style="color: #64748b; font-size: 0.9rem;">⚪</span>`;
        }
      }

      let fbColor = 'var(--text-muted)';
      if (feedbackType === 'success') fbColor = 'var(--success)';
      if (feedbackType === 'error') fbColor = 'var(--danger)';

      const html = `
        <div class="ipad-responsive-grid" style="user-select: none;">
          
          <!-- LEFT COLUMN: VAULT & FACTORS CHIPS -->
          <div class="ipad-left-pane">
            <div style="
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              border: 3px solid ${isUnlocked ? '#10b981' : (isFailed ? '#ef4444' : '#3b82f6')};
              border-radius: 14px;
              padding: 12px;
              color: white;
              margin-bottom: 12px;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 0.8rem; font-weight: 800; letter-spacing: 1px; color: #94a3b8;">
                  Target Number: ${q.n}
                </span>
                <span style="
                  font-size: 0.75rem;
                  font-weight: 800;
                  padding: 3px 8px;
                  border-radius: 16px;
                  background: ${isUnlocked ? 'rgba(16, 185, 129, 0.2)' : (isFailed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)')};
                  color: ${isUnlocked ? '#34d399' : (isFailed ? '#f87171' : '#60a5fa')};
                ">
                  ${isUnlocked ? '🔓 UNLOCKED' : (isFailed ? '🚨 ALARM' : `🔒 ${foundCount}/${totalFactorsCount}`)}
                </span>
              </div>

              <div style="
                font-size: 2.2rem;
                font-weight: 900;
                text-align: center;
                color: ${isUnlocked ? '#34d399' : (isFailed ? '#f87171' : '#60a5fa')};
                margin-bottom: 8px;
              ">
                ${q.n}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 8px;">
                <div style="display: flex; gap: 8px; align-items: center;">${tumblersHtml}</div>
                <div style="display: flex; gap: 3px; align-items: center;">
                  <span style="font-size: 0.7rem; font-weight: 800; color: #94a3b8;">STRIKES:</span>
                  ${strikesHtml}
                </div>
              </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
              ${chipsHtml}
            </div>
          </div>

          <!-- RIGHT COLUMN: KEYPAD & SUBMIT -->
          ${(!isUnlocked && !isFailed) ? `
            <div class="ipad-right-pane" style="text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">
                Factor: <span id="facTypedVal" style="
                  color: var(--accent);
                  border-bottom: 3px solid var(--accent);
                  padding: 0 8px;
                  min-width: 45px;
                  display: inline-block;
                ">${typedValue || '?'}</span>
              </div>

              <div style="min-height: 20px; font-size: 0.8rem; font-weight: 800; color: ${fbColor}; margin-bottom: 10px;">
                ${feedbackMsg}
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 260px; margin: 0 auto 10px auto;">
                <button class="fac-key" data-k="1">1</button>
                <button class="fac-key" data-k="2">2</button>
                <button class="fac-key" data-k="3">3</button>
                <button class="fac-key" data-k="4">4</button>
                <button class="fac-key" data-k="5">5</button>
                <button class="fac-key" data-k="6">6</button>
                <button class="fac-key" data-k="7">7</button>
                <button class="fac-key" data-k="8">8</button>
                <button class="fac-key" data-k="9">9</button>
                <button class="fac-key" id="facClear" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight: 800;">C</button>
                <button class="fac-key" data-k="0">0</button>
                <button class="fac-key" id="facDel" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight: 800;">⌫</button>
              </div>

              <button class="btn" id="facSubmitBtn" style="background: var(--accent); font-weight: 800; padding: 10px;">
                Submit Factor 🔓
              </button>
            </div>
          ` : (isUnlocked ? `
            <div style="background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; color: #10b981; padding: 14px; border-radius: 12px; font-weight: 800; text-align: center;">
              🎉 Vault Unlocked! All ${totalFactorsCount} factors found!
            </div>
          ` : `
            <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid var(--danger); color: var(--danger); padding: 14px; border-radius: 12px; font-weight: 800; text-align: center;">
              🚨 Attempt Failed! 3 wrong factors entered.
            </div>
          `)}

        </div>
      `;

      container.innerHTML = html;

      container.querySelectorAll('.fac-key').forEach(btn => {
        btn.style.height = '44px';
        btn.style.fontSize = '1.1rem';
        btn.style.fontWeight = '800';
        btn.style.borderRadius = '8px';
        btn.style.border = '2px solid var(--border-color)';
        btn.style.background = 'var(--bg-card)';
        btn.style.color = 'var(--text-main)';
        btn.style.cursor = 'pointer';
        btn.style.touchAction = 'manipulation';
      });

      if (!isUnlocked && !isFailed) {
        container.querySelectorAll('.fac-key[data-k]').forEach(btn => {
          btn.onclick = () => {
            const k = btn.getAttribute('data-k');
            if (typedValue === '0') typedValue = k;
            else typedValue += k;

            const valEl = container.querySelector('#facTypedVal');
            if (valEl) valEl.innerText = typedValue || '?';
          };
        });

        const clearBtn = container.querySelector('#facClear');
        if (clearBtn) {
          clearBtn.onclick = () => {
            typedValue = '';
            const valEl = container.querySelector('#facTypedVal');
            if (valEl) valEl.innerText = '?';
          };
        }

        const delBtn = container.querySelector('#facDel');
        if (delBtn) {
          delBtn.onclick = () => {
            typedValue = typedValue.slice(0, -1);
            const valEl = container.querySelector('#facTypedVal');
            if (valEl) valEl.innerText = typedValue || '?';
          };
        }

        const submitBtn = container.querySelector('#facSubmitBtn');
        if (submitBtn) {
          submitBtn.onclick = () => {
            const num = parseInt(typedValue, 10);

            if (isNaN(num) || num <= 0) {
              feedbackMsg = '⚠️ Key in a positive integer factor!';
              feedbackType = 'error';
              renderUI();
              return;
            }

            if (q.userFactors.includes(num)) {
              feedbackMsg = `ℹ️ ${num} is already unlocked!`;
              feedbackType = 'info';
            } else if (q.allFactors.includes(num)) {
              q.userFactors.push(num);
              feedbackMsg = `🎯 Spot on! ${num} is a factor!`;
              feedbackType = 'success';
            } else {
              q.wrongAttempts++;
              if (q.wrongAttempts >= q.maxWrongAttempts) {
                q.failed = true;
                feedbackMsg = `🚨 3 wrong attempts reached! Safe alarm triggered.`;
                feedbackType = 'error';
              } else {
                feedbackMsg = `❌ ${num} is not a factor of ${q.n}!`;
                feedbackType = 'error';
              }
            }

            typedValue = '';
            renderUI();
          };
        }
      }
    };

    renderUI();
  },

  evaluate(q) {
    return !q.failed && (q.userFactors.length === q.allFactors.length);
  }
};

registerQuestionType('factors', factorsModule);
