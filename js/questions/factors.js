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

      // Vault Tumbler Status Indicators
      let tumblersHtml = '';
      for (let i = 0; i < totalFactorsCount; i++) {
        const isFilled = i < foundCount;
        tumblersHtml += `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${isFilled ? '#10b981' : 'rgba(239, 68, 68, 0.3)'};
              border: 2px solid ${isFilled ? '#10b981' : '#ef4444'};
              box-shadow: ${isFilled ? '0 0 10px #10b981' : 'none'};
              transition: all 0.3s ease;
            "></div>
            <span style="font-size: 0.65rem; font-weight: 800; color: #94a3b8;">T${i + 1}</span>
          </div>
        `;
      }

      // Display Factor Chips Submitted So Far
      let chipsHtml = '';
      for (let i = 0; i < totalFactorsCount; i++) {
        if (i < q.userFactors.length) {
          chipsHtml += `
            <div style="
              background: rgba(16, 185, 129, 0.15);
              border: 2px solid #10b981;
              color: #10b981;
              font-size: 1.3rem;
              font-weight: 800;
              padding: 8px 16px;
              border-radius: 12px;
              min-width: 50px;
              text-align: center;
              box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
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
              font-size: 1.3rem;
              font-weight: 800;
              padding: 8px 16px;
              border-radius: 12px;
              min-width: 50px;
              text-align: center;
            ">
              ?
            </div>
          `;
        }
      }

      // Strike indicator icons
      let strikesHtml = '';
      for (let s = 0; s < q.maxWrongAttempts; s++) {
        if (s < q.wrongAttempts) {
          strikesHtml += `<span style="color: #ef4444; font-size: 1rem;">❌</span>`;
        } else {
          strikesHtml += `<span style="color: #64748b; font-size: 1rem;">⚪</span>`;
        }
      }

      // Feedback message styling
      let fbColor = 'var(--text-muted)';
      if (feedbackType === 'success') fbColor = 'var(--success)';
      if (feedbackType === 'error') fbColor = 'var(--danger)';

      const html = `
        <div style="max-width: 520px; margin: 0 auto; text-align: center; user-select: none;">
          
          <!-- VAULT SAFE HEADER -->
          <div style="
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 3px solid ${isUnlocked ? '#10b981' : (isFailed ? '#ef4444' : '#3b82f6')};
            border-radius: 16px;
            padding: 16px;
            color: white;
            margin-bottom: 20px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.25);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.85rem; font-weight: 800; letter-spacing: 1px; color: #94a3b8; text-transform: uppercase;">
                Target Number: ${q.n}
              </span>
              <span style="
                font-size: 0.85rem;
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 20px;
                background: ${isUnlocked ? 'rgba(16, 185, 129, 0.2)' : (isFailed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.2)')};
                color: ${isUnlocked ? '#34d399' : (isFailed ? '#f87171' : '#60a5fa')};
                border: 1px solid ${isUnlocked ? '#34d399' : (isFailed ? '#f87171' : '#60a5fa')};
              ">
                ${isUnlocked ? '🔓 VAULT UNLOCKED' : (isFailed ? '🚨 ALARM TRIGGERED' : `🔒 ${foundCount}/${totalFactorsCount} FACTORS`)}
              </span>
            </div>

            <!-- VAULT DIAL DISPLAY -->
            <div style="
              font-size: 2.5rem;
              font-weight: 900;
              letter-spacing: 2px;
              color: ${isUnlocked ? '#34d399' : (isFailed ? '#f87171' : '#60a5fa')};
              margin-bottom: 10px;
            ">
              ${q.n}
            </div>

            <!-- STRIKES & TUMBLERS BAR -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 10px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; gap: 10px; align-items: center;">
                ${tumblersHtml}
              </div>
              <div style="display: flex; gap: 4px; align-items: center;" title="Wrong Attempts">
                <span style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-right: 2px;">STRIKES:</span>
                ${strikesHtml}
              </div>
            </div>
          </div>

          <!-- ENTERED FACTORS GRID -->
          <div style="
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
            min-height: 50px;
          ">
            ${chipsHtml}
          </div>

          <!-- KEYPAD & SUBMIT SECTION -->
          ${(!isUnlocked && !isFailed) ? `
            <div style="
              background: var(--bg-primary);
              border: 2px solid var(--border-color);
              border-radius: 14px;
              padding: 16px;
              max-width: 360px;
              margin: 0 auto;
            ">
              <!-- INPUT PREVIEW DISPLAY -->
              <div style="font-size: 1.4rem; font-weight: 800; margin-bottom: 10px;">
                Enter Factor: <span id="facTypedVal" style="
                  color: var(--accent);
                  border-bottom: 3px solid var(--accent);
                  padding: 0 10px;
                  min-width: 50px;
                  display: inline-block;
                ">${typedValue || '?'}</span>
              </div>

              <!-- FEEDBACK MESSAGE -->
              <div style="
                min-height: 22px;
                font-size: 0.85rem;
                font-weight: 800;
                color: ${fbColor};
                margin-bottom: 12px;
              ">
                ${feedbackMsg}
              </div>

              <!-- TOUCH KEYPAD -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
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

              <button class="btn" id="facSubmitBtn" style="background: var(--accent); font-weight: 800; width: 100%;">
                Submit Factor 🔓
              </button>
            </div>
          ` : (isUnlocked ? `
            <div style="
              background: rgba(16, 185, 129, 0.15);
              border: 2px solid #10b981;
              color: #10b981;
              padding: 16px;
              border-radius: 14px;
              font-weight: 800;
              font-size: 1.2rem;
            ">
              🎉 Vault Unlocked! All ${totalFactorsCount} factors found!
            </div>
          ` : `
            <div style="
              background: rgba(239, 68, 68, 0.15);
              border: 2px solid var(--danger);
              color: var(--danger);
              padding: 16px;
              border-radius: 14px;
              font-weight: 800;
              font-size: 1.1rem;
            ">
              🚨 Attempt Failed! 3 wrong factors entered.
            </div>
          `)}

        </div>
      `;

      container.innerHTML = html;

      // KEYPAD STYLING
      container.querySelectorAll('.fac-key').forEach(btn => {
        btn.style.height = '48px';
        btn.style.fontSize = '1.3rem';
        btn.style.fontWeight = '800';
        btn.style.borderRadius = '8px';
        btn.style.border = '2px solid var(--border-color)';
        btn.style.background = 'var(--bg-card)';
        btn.style.color = 'var(--text-main)';
        btn.style.cursor = 'pointer';
        btn.style.touchAction = 'manipulation';
      });

      if (!isUnlocked && !isFailed) {
        // KEYPAD BUTTON HANDLERS
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

        // SUBMIT FACTOR HANDLER
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
              feedbackMsg = `🎯 Spot on! ${num} is a factor of ${q.n}!`;
              feedbackType = 'success';
            } else {
              q.wrongAttempts++;
              if (q.wrongAttempts >= q.maxWrongAttempts) {
                q.failed = true;
                feedbackMsg = `🚨 3 wrong attempts reached! Safe alarm triggered.`;
                feedbackType = 'error';
              } else {
                feedbackMsg = `❌ ${num} is not a factor of ${q.n}! Strike ${q.wrongAttempts}/3`;
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
