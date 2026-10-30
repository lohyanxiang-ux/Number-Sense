import { registerQuestionType } from './registry.js';

const targetNumbers = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 60];

function getFactorPairs(n) {
  const pairs = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      pairs.push([i, n / i]);
    }
  }
  return pairs;
}

const factorsModule = {
  generate() {
    const n = targetNumbers[Math.floor(Math.random() * targetNumbers.length)];
    const pairs = getFactorPairs(n);

    const allFactors = [];
    pairs.forEach(p => {
      allFactors.push(p[0]);
      if (p[0] !== p[1]) allFactors.push(p[1]);
    });
    allFactors.sort((a, b) => a - b);

    // Each pair requires filling in the missing partner digit
    const pairSlots = pairs.map(p => ({
      known: p[0],
      target: p[1],
      userAns: ''
    }));

    return {
      type: 'factors',
      n: n,
      pairs: pairSlots,
      allFactors: allFactors,
      prompt: `🔐 Crack the safe by finding all factor pairs of <strong>${n}</strong>:`,
      explanation: `The factors of <strong>${n}</strong> are <strong>${allFactors.join(', ')}</strong>.<br>Factor pairs: ` + 
        pairs.map(p => `(${p[0]} × ${p[1]})`).join(', ')
    };
  },

  render(q, container) {
    let activeSlotIdx = 0;

    const renderUI = () => {
      const allCorrect = q.pairs.every(p => parseInt(p.userAns, 10) === p.target);
      const totalPairs = q.pairs.length;
      const solvedPairsCount = q.pairs.filter(p => parseInt(p.userAns, 10) === p.target).length;

      // Vault Tumbler Indicator LEDs
      let tumblersHtml = '';
      for (let i = 0; i < totalPairs; i++) {
        const isSolved = parseInt(q.pairs[i].userAns, 10) === q.pairs[i].target;
        tumblersHtml += `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          ">
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${isSolved ? '#10b981' : 'rgba(239, 68, 68, 0.3)'};
              border: 2px solid ${isSolved ? '#10b981' : '#ef4444'};
              box-shadow: ${isSolved ? '0 0 10px #10b981' : 'none'};
              transition: all 0.3s ease;
            "></div>
            <span style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted);">T${i + 1}</span>
          </div>
        `;
      }

      // Factor Pair Input Rows
      let pairsRowsHtml = '';
      q.pairs.forEach((pair, idx) => {
        const isActive = idx === activeSlotIdx && !allCorrect;
        const isCorrect = parseInt(pair.userAns, 10) === pair.target;

        let slotBg = 'var(--bg-card)';
        let slotBorder = '2px solid var(--border-color)';
        let slotColor = 'var(--text-main)';

        if (isCorrect) {
          slotBg = 'rgba(16, 185, 129, 0.12)';
          slotBorder = '2px solid #10b981';
          slotColor = '#10b981';
        } else if (isActive) {
          slotBorder = '2px solid var(--accent)';
          slotBg = 'rgba(79, 70, 229, 0.08)';
        }

        pairsRowsHtml += `
          <div class="factor-pair-row" data-idx="${idx}" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 10px 16px;
            background: ${slotBg};
            border: ${slotBorder};
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1.3rem;
            font-weight: 800;
          ">
            <span>${pair.known} ×</span>
            <span style="
              min-width: 50px;
              padding: 2px 10px;
              border-bottom: 3px solid ${isActive ? 'var(--accent)' : (isCorrect ? '#10b981' : 'var(--text-muted)')};
              color: ${slotColor};
            ">${pair.userAns || '?'}</span>
            <span>= ${q.n}</span>
            <span style="font-size: 1.1rem; margin-left: auto;">${isCorrect ? '✅' : '🔒'}</span>
          </div>
        `;
      });

      const html = `
        <div style="max-width: 520px; margin: 0 auto; text-align: center; user-select: none;">
          
          <!-- VAULT SAFE HEADER -->
          <div style="
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 3px solid ${allCorrect ? '#10b981' : '#3b82f6'};
            border-radius: 16px;
            padding: 16px;
            color: white;
            margin-bottom: 20px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.25);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 0.85rem; font-weight: 800; letter-spacing: 1px; color: #94a3b8; text-transform: uppercase;">
                Vault Combination #${q.n}
              </span>
              <span style="
                font-size: 0.85rem;
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 20px;
                background: ${allCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
                color: ${allCorrect ? '#34d399' : '#f87171'};
                border: 1px solid ${allCorrect ? '#34d399' : '#f87171'};
              ">
                ${allCorrect ? '🔓 VAULT UNLOCKED' : '🔒 VAULT LOCKED'}
              </span>
            </div>

            <!-- VAULT DIAL DISPLAY -->
            <div style="
              font-size: 2.2rem;
              font-weight: 900;
              letter-spacing: 2px;
              color: ${allCorrect ? '#34d399' : '#60a5fa'};
              margin-bottom: 12px;
            ">
              ${q.n}
            </div>

            <!-- TUMBLER STATUS LEDS -->
            <div style="display: flex; justify-content: center; gap: 16px; align-items: center; background: rgba(0,0,0,0.3); padding: 8px 14px; border-radius: 10px;">
              ${tumblersHtml}
            </div>
          </div>

          <!-- FACTOR PAIRS LIST -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            ${pairsRowsHtml}
          </div>

          <!-- KEYPAD WORKSPACE -->
          ${!allCorrect ? `
            <div style="
              background: var(--bg-primary);
              border: 2px solid var(--border-color);
              border-radius: 14px;
              padding: 16px;
              max-width: 360px;
              margin: 0 auto;
            ">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 10px;">
                Key in missing factor for Row ${activeSlotIdx + 1}:
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
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
            </div>
          ` : ''}

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

      // ROW SELECT HANDLER
      container.querySelectorAll('.factor-pair-row').forEach(row => {
        row.onclick = () => {
          activeSlotIdx = parseInt(row.getAttribute('data-idx'), 10);
          renderUI();
        };
      });

      // KEYPAD EVENT HANDLERS
      if (!allCorrect) {
        container.querySelectorAll('.fac-key[data-k]').forEach(btn => {
          btn.onclick = () => {
            const k = btn.getAttribute('data-k');
            let currentVal = q.pairs[activeSlotIdx].userAns;

            if (currentVal === '0') currentVal = k;
            else currentVal += k;

            q.pairs[activeSlotIdx].userAns = currentVal;
            renderUI();
          };
        });

        const clearBtn = container.querySelector('#facClear');
        if (clearBtn) {
          clearBtn.onclick = () => {
            q.pairs[activeSlotIdx].userAns = '';
            renderUI();
          };
        }

        const delBtn = container.querySelector('#facDel');
        if (delBtn) {
          delBtn.onclick = () => {
            let currentVal = q.pairs[activeSlotIdx].userAns;
            q.pairs[activeSlotIdx].userAns = currentVal.slice(0, -1);
            renderUI();
          };
        }
      }
    };

    renderUI();
  },

  evaluate(q) {
    return q.pairs.every(p => parseInt(p.userAns, 10) === p.target);
  }
};

registerQuestionType('factors', factorsModule);
