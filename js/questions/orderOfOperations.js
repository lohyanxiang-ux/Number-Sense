render(q, container) {
    let selectedStart = null;
    let selectedEnd = null;
    let typedValue = '';

    const renderUI = () => {
      const isFinished = q.completed || q.failed;
      const currentStep = q.steps[q.currentStepIdx];

      const tokensHtml = q.tokens.map((tok, idx) => {
        let isSelected = false;
        if (selectedStart !== null && selectedEnd !== null) {
          const min = Math.min(selectedStart, selectedEnd);
          const max = Math.max(selectedStart, selectedEnd);
          isSelected = idx >= min && idx <= max;
        }

        const bg = isSelected ? 'var(--accent)' : 'var(--bg-card)';
        const color = isSelected ? '#ffffff' : 'var(--text-main)';
        const border = isSelected ? '2px solid var(--accent)' : '2px solid var(--border-color)';

        return `
          <button class="ooo-token-btn" data-idx="${idx}" style="
            background: ${bg};
            color: ${color};
            border: ${border};
            font-size: 1.25rem;
            font-weight: 800;
            padding: 6px 12px;
            border-radius: 8px;
            cursor: ${isFinished ? 'default' : 'pointer'};
            touch-action: manipulation;
            transition: all 0.15s ease;
          ">${tok.text}</button>
        `;
      }).join('');

      let selectedTextPreview = 'None';
      if (selectedStart !== null && selectedEnd !== null) {
        const min = Math.min(selectedStart, selectedEnd);
        const max = Math.max(selectedStart, selectedEnd);
        selectedTextPreview = q.tokens.slice(min, max + 1).map(t => t.text).join(' ');
      }

      const html = `
        <div class="ipad-responsive-grid" style="user-select: none;">
          
          <!-- LEFT COLUMN: EXPRESSION & TOKENS -->
          <div class="ipad-left-pane">
            <div style="
              background: var(--bg-card);
              border: 2px solid var(--border-color);
              border-radius: 12px;
              padding: 8px 14px;
              margin-bottom: 12px;
              font-weight: 800;
              font-size: 0.95rem;
              text-align: center;
              color: var(--text-main);
            ">
              ${isFinished 
                ? (q.failed ? `<span style="color:var(--danger)">❌ Attempt Failed</span>` : `<span style="color:var(--success)">🎉 All Steps Completed!</span>`)
                : `Step ${q.currentStepIdx + 1} of ${q.steps.length}: Tap tokens to select sub-expression`
              }
            </div>

            <div id="oooTokensContainer" style="
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 6px;
              padding: 14px;
              background: var(--bg-primary);
              border: 2px solid var(--border-color);
              border-radius: 14px;
              margin-bottom: 12px;
              min-height: 65px;
              align-items: center;
            ">
              ${tokensHtml}
            </div>

            ${q.failed ? `
              <div style="
                background: rgba(239, 68, 68, 0.12);
                border: 2px solid var(--danger);
                color: var(--danger);
                padding: 10px;
                border-radius: 10px;
                font-weight: 800;
                text-align: center;
              ">${q.failReason}</div>
            ` : ''}
          </div>

          <!-- RIGHT COLUMN: SELECTION & KEYPAD -->
          ${!isFinished ? `
            <div class="ipad-right-pane" style="text-align: center;">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
                Selected: <strong style="color: var(--accent); font-size: 1rem;">${selectedTextPreview}</strong>
              </div>

              <div style="font-size: 1.3rem; font-weight: 800; margin-bottom: 10px;">
                Value = <span id="oooTypedVal" style="
                  color: var(--accent);
                  border-bottom: 3px solid var(--accent);
                  padding: 0 8px;
                  min-width: 45px;
                  display: inline-block;
                ">${typedValue || '?'}</span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 260px; margin: 0 auto 10px auto;">
                <button class="ooo-key" data-k="1">1</button>
                <button class="ooo-key" data-k="2">2</button>
                <button class="ooo-key" data-k="3">3</button>
                <button class="ooo-key" data-k="4">4</button>
                <button class="ooo-key" data-k="5">5</button>
                <button class="ooo-key" data-k="6">6</button>
                <button class="ooo-key" data-k="7">7</button>
                <button class="ooo-key" data-k="8">8</button>
                <button class="ooo-key" data-k="9">9</button>
                <button class="ooo-key" data-k="-" style="background: rgba(79,70,229,0.1); color: var(--accent); font-weight: 800;">-</button>
                <button class="ooo-key" data-k="0">0</button>
                <button class="ooo-key" id="oooKeyDel" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight: 800;">⌫</button>
              </div>

              <button class="btn" id="oooApplyStepBtn" style="background: var(--accent); font-weight: 800; padding: 10px;">
                Confirm Step ➔
              </button>
            </div>
          ` : ''}

        </div>
      `;

      container.innerHTML = html;

      container.querySelectorAll('.ooo-key').forEach(btn => {
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

      if (!isFinished) {
        container.querySelectorAll('.ooo-token-btn').forEach(btn => {
          btn.onclick = () => {
            const idx = parseInt(btn.getAttribute('data-idx'), 10);
            if (selectedStart === null) {
              selectedStart = idx;
              selectedEnd = idx;
            } else if (selectedStart === idx && selectedEnd === idx) {
              selectedStart = null;
              selectedEnd = null;
            } else {
              selectedEnd = idx;
            }
            renderUI();
          };
        });

        container.querySelectorAll('.ooo-key[data-k]').forEach(btn => {
          btn.onclick = () => {
            const k = btn.getAttribute('data-k');
            if (k === '-') {
              if (typedValue.startsWith('-')) typedValue = typedValue.slice(1);
              else typedValue = '-' + typedValue;
            } else {
              if (typedValue === '0') typedValue = k;
              else typedValue += k;
            }
            const valEl = container.querySelector('#oooTypedVal');
            if (valEl) valEl.innerText = typedValue || '?';
          };
        });

        const delBtn = container.querySelector('#oooKeyDel');
        if (delBtn) {
          delBtn.onclick = () => {
            typedValue = typedValue.slice(0, -1);
            const valEl = container.querySelector('#oooTypedVal');
            if (valEl) valEl.innerText = typedValue || '?';
          };
        }

        const applyBtn = container.querySelector('#oooApplyStepBtn');
        if (applyBtn) {
          applyBtn.onclick = () => {
            if (selectedStart === null || selectedEnd === null) {
              alert("Please tap tokens to select a sub-expression first.");
              return;
            }

            const min = Math.min(selectedStart, selectedEnd);
            const max = Math.max(selectedStart, selectedEnd);
            const userVal = parseInt(typedValue, 10);

            if (isNaN(userVal)) {
              alert("Please key in the calculated value for the selected part.");
              return;
            }

            const isRangeValid = currentStep.validRanges.some(r => r[0] === min && r[1] === max);
            const isValCorrect = (userVal === currentStep.targetVal);

            if (!isRangeValid || !isValCorrect) {
              q.failed = true;
              if (!isRangeValid) {
                q.failReason = "❌ Order of Operations Rule Violated! You selected the wrong operation first.";
              } else {
                q.failReason = `❌ Incorrect Math! The answer for that sub-expression is ${currentStep.targetVal}.`;
              }
            } else {
              q.tokens = currentStep.nextTokens;
              q.currentStepIdx++;
              if (q.currentStepIdx >= q.steps.length) {
                q.completed = true;
              }
            }

            selectedStart = null;
            selectedEnd = null;
            typedValue = '';
            renderUI();
          };
        }
      }
    };

    renderUI();
  }
