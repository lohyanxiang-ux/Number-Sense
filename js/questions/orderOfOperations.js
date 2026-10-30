import { registerQuestionType } from './registry.js';

const generators = [
  // Type 1: A + B(C + D) -> e.g., 3 + 4(2 + 5)
  () => {
    const c = Math.floor(Math.random() * 6) + 1;
    const d = Math.floor(Math.random() * 6) + 1;
    const b = Math.floor(Math.random() * 5) + 2;
    const a = Math.floor(Math.random() * 10) + 1;

    const cdSum = c + d;
    const bcdProd = b * cdSum;
    const total = a + bcdProd;

    return {
      exprStr: `${a} + ${b}(${c} + ${d})`,
      initialTokens: [
        { text: `${a}` }, { text: '+' }, { text: `${b}` }, { text: '(' },
        { text: `${c}` }, { text: '+' }, { text: `${d}` }, { text: ')' }
      ],
      steps: [
        {
          opName: 'Brackets',
          calcText: `${c} + ${d} = ${cdSum}`,
          nextExprStr: `${a} + ${b}(${cdSum})`,
          validRanges: [[4, 6], [3, 7]],
          targetVal: cdSum,
          nextTokens: [
            { text: `${a}` }, { text: '+' }, { text: `${b}` }, { text: '(' },
            { text: `${cdSum}` }, { text: ')' }
          ]
        },
        {
          opName: 'Multiply',
          calcText: `${b} × ${cdSum} = ${bcdProd}`,
          nextExprStr: `${a} + ${bcdProd}`,
          validRanges: [[2, 5], [2, 4]],
          targetVal: bcdProd,
          nextTokens: [
            { text: `${a}` }, { text: '+' }, { text: `${bcdProd}` }
          ]
        },
        {
          opName: 'Add',
          calcText: `${a} + ${bcdProd} = ${total}`,
          nextExprStr: null,
          validRanges: [[0, 2]],
          targetVal: total,
          nextTokens: [
            { text: `${total}` }
          ]
        }
      ]
    };
  },

  // Type 2: A - (B ÷ C) -> e.g., 18 - (8 ÷ 2)
  () => {
    const c = Math.floor(Math.random() * 4) + 2;
    const divQuotient = Math.floor(Math.random() * 5) + 2;
    const b = c * divQuotient;
    const a = b + Math.floor(Math.random() * 10) + 5;
    const total = a - divQuotient;

    return {
      exprStr: `${a} - (${b} ÷ ${c})`,
      initialTokens: [
        { text: `${a}` }, { text: '-' }, { text: '(' },
        { text: `${b}` }, { text: '÷' }, { text: `${c}` }, { text: ')' }
      ],
      steps: [
        {
          opName: 'Brackets',
          calcText: `${b} ÷ ${c} = ${divQuotient}`,
          nextExprStr: `${a} - ${divQuotient}`,
          validRanges: [[3, 5], [2, 6]],
          targetVal: divQuotient,
          nextTokens: [
            { text: `${a}` }, { text: '-' }, { text: `${divQuotient}` }
          ]
        },
        {
          opName: 'Subtract',
          calcText: `${a} - ${divQuotient} = ${total}`,
          nextExprStr: null,
          validRanges: [[0, 2]],
          targetVal: total,
          nextTokens: [
            { text: `${total}` }
          ]
        }
      ]
    };
  },

  // Type 3: (A + B) ÷ C - D -> e.g., (12 + 6) ÷ 3 - 2
  () => {
    const c = Math.floor(Math.random() * 4) + 2;
    const targetQuotient = Math.floor(Math.random() * 5) + 2;
    const abSum = c * targetQuotient;
    const a = Math.floor(Math.random() * (abSum - 2)) + 1;
    const b = abSum - a;
    const d = Math.floor(Math.random() * (targetQuotient - 1)) + 1;
    const total = targetQuotient - d;

    return {
      exprStr: `(${a} + ${b}) ÷ ${c} - ${d}`,
      initialTokens: [
        { text: '(' }, { text: `${a}` }, { text: '+' }, { text: `${b}` }, { text: ')' },
        { text: '÷' }, { text: `${c}` }, { text: '-' }, { text: `${d}` }
      ],
      steps: [
        {
          opName: 'Brackets',
          calcText: `${a} + ${b} = ${abSum}`,
          nextExprStr: `${abSum} ÷ ${c} - ${d}`,
          validRanges: [[1, 3], [0, 4]],
          targetVal: abSum,
          nextTokens: [
            { text: `${abSum}` }, { text: '÷' }, { text: `${c}` },
            { text: '-' }, { text: `${d}` }
          ]
        },
        {
          opName: 'Division',
          calcText: `${abSum} ÷ ${c} = ${targetQuotient}`,
          nextExprStr: `${targetQuotient} - ${d}`,
          validRanges: [[0, 2]],
          targetVal: targetQuotient,
          nextTokens: [
            { text: `${targetQuotient}` }, { text: '-' }, { text: `${d}` }
          ]
        },
        {
          opName: 'Subtract',
          calcText: `${targetQuotient} - ${d} = ${total}`,
          nextExprStr: null,
          validRanges: [[0, 2]],
          targetVal: total,
          nextTokens: [
            { text: `${total}` }
          ]
        }
      ]
    };
  },

  // Type 4: A + B × C - D -> e.g., 10 + 3 × 4 - 5
  () => {
    const b = Math.floor(Math.random() * 5) + 2;
    const c = Math.floor(Math.random() * 5) + 2;
    const bcProd = b * c;
    const a = Math.floor(Math.random() * 10) + 1;
    const d = Math.floor(Math.random() * 5) + 1;

    const sum1 = a + bcProd;
    const total = sum1 - d;

    return {
      exprStr: `${a} + ${b} × ${c} - ${d}`,
      initialTokens: [
        { text: `${a}` }, { text: '+' }, { text: `${b}` }, { text: '×' },
        { text: `${c}` }, { text: '-' }, { text: `${d}` }
      ],
      steps: [
        {
          opName: 'Multiply',
          calcText: `${b} × ${c} = ${bcProd}`,
          nextExprStr: `${a} + ${bcProd} - ${d}`,
          validRanges: [[2, 4]],
          targetVal: bcProd,
          nextTokens: [
            { text: `${a}` }, { text: '+' }, { text: `${bcProd}` },
            { text: '-' }, { text: `${d}` }
          ]
        },
        {
          opName: 'Add',
          calcText: `${a} + ${bcProd} = ${sum1}`,
          nextExprStr: `${sum1} - ${d}`,
          validRanges: [[0, 2]],
          targetVal: sum1,
          nextTokens: [
            { text: `${sum1}` }, { text: '-' }, { text: `${d}` }
          ]
        },
        {
          opName: 'Subtract',
          calcText: `${sum1} - ${d} = ${total}`,
          nextExprStr: null,
          validRanges: [[0, 2]],
          targetVal: total,
          nextTokens: [
            { text: `${total}` }
          ]
        }
      ]
    };
  },

  // Type 5: A × (B - C) + D -> e.g., 5 × (9 - 3) + 4
  () => {
    const c = Math.floor(Math.random() * 5) + 1;
    const diff = Math.floor(Math.random() * 5) + 2;
    const b = c + diff;
    const a = Math.floor(Math.random() * 5) + 2;
    const d = Math.floor(Math.random() * 10) + 1;

    const aBcProd = a * diff;
    const total = aBcProd + d;

    return {
      exprStr: `${a} × (${b} - ${c}) + ${d}`,
      initialTokens: [
        { text: `${a}` }, { text: '×' }, { text: '(' },
        { text: `${b}` }, { text: '-' }, { text: `${c}` }, { text: ')' },
        { text: '+' }, { text: `${d}` }
      ],
      steps: [
        {
          opName: 'Brackets',
          calcText: `${b} - ${c} = ${diff}`,
          nextExprStr: `${a} × ${diff} + ${d}`,
          validRanges: [[3, 5], [2, 6]],
          targetVal: diff,
          nextTokens: [
            { text: `${a}` }, { text: '×' }, { text: `${diff}` },
            { text: '+' }, { text: `${d}` }
          ]
        },
        {
          opName: 'Multiply',
          calcText: `${a} × ${diff} = ${aBcProd}`,
          nextExprStr: `${aBcProd} + ${d}`,
          validRanges: [[0, 2]],
          targetVal: aBcProd,
          nextTokens: [
            { text: `${aBcProd}` }, { text: '+' }, { text: `${d}` }
          ]
        },
        {
          opName: 'Add',
          calcText: `${aBcProd} + ${d} = ${total}`,
          nextExprStr: null,
          validRanges: [[0, 2]],
          targetVal: total,
          nextTokens: [
            { text: `${total}` }
          ]
        }
      ]
    };
  },

  // Type 6: A + B ÷ C × D -> e.g., 4 + 12 ÷ 3 × 2
  () => {
    const c = Math.floor(Math.random() * 4) + 2;
    const bcQuot = Math.floor(Math.random() * 5) + 2;
    const b = c * bcQuot;
    const d = Math.floor(Math.random() * 4) + 2;
    const a = Math.floor(Math.random() * 10) + 1;

    const prod = bcQuot * d;
    const total = a + prod;

    return {
      exprStr: `${a} + ${b} ÷ ${c} × ${d}`,
      initialTokens: [
        { text: `${a}` }, { text: '+' }, { text: `${b}` }, { text: '÷' },
        { text: `${c}` }, { text: '×' }, { text: `${d}` }
      ],
      steps: [
        {
          opName: 'Division',
          calcText: `${b} ÷ ${c} = ${bcQuot}`,
          nextExprStr: `${a} + ${bcQuot} × ${d}`,
          validRanges: [[2, 4]],
          targetVal: bcQuot,
          nextTokens: [
            { text: `${a}` }, { text: '+' }, { text: `${bcQuot}` },
            { text: '×' }, { text: `${d}` }
          ]
        },
        {
          opName: 'Multiply',
          calcText: `${bcQuot} × ${d} = ${prod}`,
          nextExprStr: `${a} + ${prod}`,
          validRanges: [[2, 4]],
          targetVal: prod,
          nextTokens: [
            { text: `${a}` }, { text: '+' }, { text: `${prod}` }
          ]
        },
        {
          opName: 'Add',
          calcText: `${a} + ${prod} = ${total}`,
          nextExprStr: null,
          validRanges: [[0, 2]],
          targetVal: total,
          nextTokens: [
            { text: `${total}` }
          ]
        }
      ]
    };
  },

  // Type 7: (A - B) × (C + D) -> e.g., (10 - 4) × (2 + 3)
  () => {
    const b = Math.floor(Math.random() * 5) + 1;
    const abDiff = Math.floor(Math.random() * 5) + 2;
    const a = b + abDiff;
    const c = Math.floor(Math.random() * 5) + 1;
    const d = Math.floor(Math.random() * 5) + 1;

    const cdSum = c + d;
    const total = abDiff * cdSum;

    return {
      exprStr: `(${a} - ${b}) × (${c} + ${d})`,
      initialTokens: [
        { text: '(' }, { text: `${a}` }, { text: '-' }, { text: `${b}` }, { text: ')' },
        { text: '×' },
        { text: '(' }, { text: `${c}` }, { text: '+' }, { text: `${d}` }, { text: ')' }
      ],
      steps: [
        {
          opName: 'Brackets',
          calcText: `${a} - ${b} = ${abDiff}`,
          nextExprStr: `${abDiff} × (${c} + ${d})`,
          validRanges: [[1, 3], [0, 4]],
          targetVal: abDiff,
          nextTokens: [
            { text: `${abDiff}` }, { text: '×' },
            { text: '(' }, { text: `${c}` }, { text: '+' }, { text: `${d}` }, { text: ')' }
          ]
        },
        {
          opName: 'Brackets',
          calcText: `${c} + ${d} = ${cdSum}`,
          nextExprStr: `${abDiff} × ${cdSum}`,
          validRanges: [[3, 5], [2, 6]],
          targetVal: cdSum,
          nextTokens: [
            { text: `${abDiff}` }, { text: '×' }, { text: `${cdSum}` }
          ]
        },
        {
          opName: 'Multiply',
          calcText: `${abDiff} × ${cdSum} = ${total}`,
          nextExprStr: null,
          validRanges: [[0, 2]],
          targetVal: total,
          nextTokens: [
            { text: `${total}` }
          ]
        }
      ]
    };
  }
];

const orderOfOperationsModule = {
  generate() {
    const gen = generators[Math.floor(Math.random() * generators.length)];
    const data = gen();

    return {
      type: 'order_of_operations',
      exprStr: data.exprStr,
      tokens: data.initialTokens,
      steps: data.steps,
      currentStepIdx: 0,
      completed: false,
      failed: false,
      failReason: '',
      prompt: `Evaluate <strong>${data.exprStr}</strong> step by step:`,
      explanation: `To evaluate <strong>${data.exprStr}</strong>:<br>` + 
        data.steps.map((s, i) => 
          `Step ${i + 1}: ${s.opName} ${s.calcText}${s.nextExprStr ? `, simplify to ${s.nextExprStr}` : ''}`
        ).join('<br>')
    };
  },

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
            font-size: 1.3rem;
            font-weight: 800;
            padding: 8px 14px;
            border-radius: 10px;
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
        <div style="max-width: 580px; margin: 0 auto; text-align: center; user-select: none;">
          
          <!-- STEP STATUS HEADER -->
          <div style="
            background: var(--bg-card);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 10px 16px;
            margin-bottom: 16px;
            font-weight: 800;
            font-size: 1rem;
            color: var(--text-main);
          ">
            ${isFinished 
              ? (q.failed ? `<span style="color:var(--danger)">❌ Attempt Failed</span>` : `<span style="color:var(--success)">🎉 All Steps Completed!</span>`)
              : `Step ${q.currentStepIdx + 1} of ${q.steps.length}: Tap tokens to select sub-expression`
            }
          </div>

          <!-- INTERACTIVE TOKENS ROW -->
          <div id="oooTokensContainer" style="
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
            padding: 16px;
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 14px;
            margin-bottom: 16px;
            min-height: 70px;
            align-items: center;
          ">
            ${tokensHtml}
          </div>

          ${q.failed ? `
            <div style="
              background: rgba(239, 68, 68, 0.12);
              border: 2px solid var(--danger);
              color: var(--danger);
              padding: 12px;
              border-radius: 12px;
              font-weight: 800;
              margin-bottom: 16px;
            ">${q.failReason}</div>
          ` : ''}

          <!-- SELECTION & INPUT WORKSPACE -->
          ${!isFinished ? `
            <div style="
              background: var(--bg-primary);
              border: 2px solid var(--border-color);
              border-radius: 14px;
              padding: 16px;
              margin-bottom: 16px;
            ">
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">
                Selected Part: <strong style="color: var(--accent); font-size: 1.1rem;">${selectedTextPreview}</strong>
              </div>

              <div style="font-size: 1.4rem; font-weight: 800; margin-bottom: 14px;">
                Calculated Value = <span id="oooTypedVal" style="
                  color: var(--accent);
                  border-bottom: 3px solid var(--accent);
                  padding: 0 10px;
                  min-width: 50px;
                  display: inline-block;
                ">${typedValue || '?'}</span>
              </div>

              <!-- TOUCH KEYPAD -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 320px; margin: 0 auto 14px auto;">
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

              <button class="btn" id="oooApplyStepBtn" style="background: var(--accent); font-weight: 800;">
                Confirm Step ➔
              </button>
            </div>
          ` : ''}

        </div>
      `;

      container.innerHTML = html;

      // STYLES FOR KEYPAD
      container.querySelectorAll('.ooo-key').forEach(btn => {
        btn.style.height = '48px';
        btn.style.fontSize = '1.2rem';
        btn.style.fontWeight = '800';
        btn.style.borderRadius = '8px';
        btn.style.border = '2px solid var(--border-color)';
        btn.style.background = 'var(--bg-card)';
        btn.style.color = 'var(--text-main)';
        btn.style.cursor = 'pointer';
        btn.style.touchAction = 'manipulation';
      });

      // TOKEN CLICK HANDLERS
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

        // KEYPAD CLICK HANDLERS
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

        // APPLY STEP HANDLER
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

            // VALIDATE ORDER OF OPERATIONS & CALCULATION
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
              // ADVANCE TO NEXT STEP
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
  },

  evaluate(q) {
    return q.completed && !q.failed;
  }
};

registerQuestionType('order_of_operations', orderOfOperationsModule);
