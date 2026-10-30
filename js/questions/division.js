import { registerQuestionType, formatMath } from './registry.js';

const funObjects = [
  { name: 'Bananas', emoji: '🍌' },
  { name: 'Pizzas', emoji: '🍕' },
  { name: 'Ice Creams', emoji: '🍦' },
  { name: 'Gifts', emoji: '🎁' },
  { name: 'Soccer Balls', emoji: '⚽' },
  { name: 'Cats', emoji: '🐱' },
  { name: 'Cars', emoji: '🚗' },
  { name: 'Donuts', emoji: '🍩' },
  { name: 'Strawberries', emoji: '🍓' },
  { name: 'Balloons', emoji: '🎈' }
];

const divisionModule = {
  generate() {
    const b = Math.floor(Math.random() * 4) + 2; // Divisor (groups): 2 to 5
    const target = Math.floor(Math.random() * 5) + 2; // Quotient (per group): 2 to 6
    const a = b * target; // Dividend (total items): e.g. 8

    const item = funObjects[Math.floor(Math.random() * funObjects.length)];
    const exprStr = `${a} ÷ ${b}`;

    return {
      type: 'division',
      a: a,
      b: b,
      target: target,
      itemEmoji: item.emoji,
      itemName: item.name,
      exprStr: exprStr,
      prompt: `Evaluate <strong>${exprStr}</strong>. Set to <strong>${b} groups</strong>, divide the <strong>${a} ${item.emoji}</strong> equally into each group, then key in your final answer:`,
      explanation: `<strong>${exprStr}</strong> means sharing <strong>${a} ${item.emoji}</strong> equally into <strong>${b} groups</strong>.<br>Each group gets <strong>${target} ${item.emoji}</strong>.`
    };
  },

  render(q, container) {
    let unallocatedCount = q.a;
    let selectedGroupCount = 0; // Starts unselected or default
    let groupCounts = []; // Array tracking items allocated per group
    let typedAnswer = '';

    const html = `
      <div style="max-width: 620px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- STEP 1: GROUP COUNT SELECTOR -->
        <div style="
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        ">
          <span style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">
            1. Select Number of Groups:
          </span>
          <div id="groupBtnContainer" style="display: flex; gap: 6px;">
            ${[2, 3, 4, 5, 6].map(num => `
              <button class="div-group-btn" data-cnt="${num}" style="
                background: var(--bg-primary);
                border: 2px solid var(--border-color);
                color: var(--text-main);
                font-weight: 800;
                font-size: 1rem;
                padding: 6px 14px;
                border-radius: 8px;
                cursor: pointer;
                touch-action: manipulation;
                transition: all 0.2s ease;
              ">${num}</button>
            `).join('')}
          </div>
        </div>

        <!-- STEP 2: UNALLOCATED ITEM POOL -->
        <div style="
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 16px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 0 4px;">
            <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
              Items to Divide (Total: ${q.a})
            </span>
            <span id="poolCountBadge" style="font-size: 0.85rem; font-weight: 800; color: var(--accent);">
              ${unallocatedCount} Remaining
            </span>
          </div>
          
          <div id="itemPool" style="
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 6px;
            min-height: 52px;
            padding: 8px;
            background: var(--bg-card);
            border: 2px dashed var(--accent);
            border-radius: 10px;
          ">
            <!-- Pool emoji items generated dynamically -->
          </div>
        </div>

        <!-- STEP 3: DYNAMIC GROUP TRAYS WORKSPACE -->
        <div id="divTraysContainer" style="
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          min-height: 120px;
        ">
          <div style="color: var(--text-muted); font-weight: 700; font-size: 0.9rem; padding: 30px 0;">
            👆 Select the number of groups above to start dividing
          </div>
        </div>

        <!-- REPEATED / EQUAL DIVISION LIVE TRACKER -->
        <div style="
          background: rgba(79, 70, 229, 0.08); 
          border: 2px solid var(--accent); 
          border-radius: 12px; 
          padding: 10px 18px; 
          display: inline-block; 
          margin-bottom: 20px;
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--accent);
        ">
          <span style="font-size: 0.8rem; display: block; color: var(--text-muted); margin-bottom: 2px; font-weight: 700; text-transform: uppercase;">
            Sharing View
          </span>
          <span id="divAddSentence">Select groups to begin</span>
        </div>

        <!-- EQUATION INPUT & ENLARGED TOUCH KEYPAD -->
        <div style="
          background: var(--bg-primary); 
          border: 2px solid var(--border-color); 
          border-radius: var(--radius); 
          padding: 20px; 
          max-width: 380px; 
          margin: 0 auto;
          box-shadow: var(--shadow);
        ">
          <div style="font-size: 1.6rem; font-weight: 800; margin-bottom: 14px;">
            ${q.exprStr} = <span id="ansDisplay" style="
              color: var(--accent); 
              border-bottom: 3.5px solid var(--accent); 
              padding: 0 12px;
              min-width: 65px;
              display: inline-block;
            ">?</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="div-key" data-k="1">1</button>
            <button class="div-key" data-k="2">2</button>
            <button class="div-key" data-k="3">3</button>
            <button class="div-key" data-k="4">4</button>
            <button class="div-key" data-k="5">5</button>
            <button class="div-key" data-k="6">6</button>
            <button class="div-key" data-k="7">7</button>
            <button class="div-key" data-k="8">8</button>
            <button class="div-key" data-k="9">9</button>
            <button class="div-key" data-k="0" style="grid-column: span 2;">0</button>
            <button class="div-key" id="divClear" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight: 800;">C</button>
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;

    // KEYPAD CSS STYLING
    container.querySelectorAll('.div-key').forEach(btn => {
      btn.style.height = '58px';
      btn.style.fontSize = '1.4rem';
      btn.style.fontWeight = '800';
      btn.style.borderRadius = '10px';
      btn.style.border = '2px solid var(--border-color)';
      btn.style.background = 'var(--bg-card)';
      btn.style.color = 'var(--text-main)';
      btn.style.cursor = 'pointer';
      btn.style.touchAction = 'manipulation';
    });

    const poolEl = container.querySelector('#itemPool');
    const poolBadge = container.querySelector('#poolCountBadge');
    const traysContainer = container.querySelector('#divTraysContainer');
    const sentenceEl = container.querySelector('#divAddSentence');
    const ansDisplay = container.querySelector('#ansDisplay');

    // RENDER POOL EMOJIS
    const renderPool = () => {
      let poolHtml = '';
      for (let i = 0; i < unallocatedCount; i++) {
        poolHtml += `
          <div class="div-pool-item" style="
            font-size: 1.5rem;
            padding: 4px 8px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            cursor: grab;
            touch-action: none;
            user-select: none;
          ">${q.itemEmoji}</div>
        `;
      }
      poolEl.innerHTML = poolHtml;
      poolBadge.innerText = `${unallocatedCount} Remaining`;

      // Enable touch drag / tap on pool items
      poolEl.querySelectorAll('.div-pool-item').forEach(itemEl => {
        let clone = null;

        itemEl.onpointerdown = (e) => {
          if (selectedGroupCount === 0 || unallocatedCount === 0) return;

          clone = itemEl.cloneNode(true);
          clone.style.position = 'fixed';
          clone.style.zIndex = '1000';
          clone.style.pointerEvents = 'none';
          clone.style.opacity = '0.85';
          clone.style.transform = 'scale(1.2)';
          clone.style.left = `${e.clientX - 20}px`;
          clone.style.top = `${e.clientY - 20}px`;
          document.body.appendChild(clone);

          itemEl.setPointerCapture(e.pointerId);

          itemEl.onpointermove = (pe) => {
            if (clone) {
              clone.style.left = `${pe.clientX - 20}px`;
              clone.style.top = `${pe.clientY - 20}px`;
            }
          };

          itemEl.onpointerup = (pe) => {
            itemEl.onpointermove = null;
            itemEl.onpointerup = null;
            if (clone) {
              clone.remove();
              clone = null;
            }

            // Check if dropped onto a group tray
            document.querySelectorAll('.div-tray-card').forEach((tray, gIdx) => {
              const rect = tray.getBoundingClientRect();
              if (
                pe.clientX >= rect.left && pe.clientX <= rect.right &&
                pe.clientY >= rect.top && pe.clientY <= rect.bottom
              ) {
                allocateToGroup(gIdx);
              }
            });
          };
        };
      };
    };

    // UPDATE REPEATED DIVISION SENTENCE DISPLAY
    const updateSentenceDisplay = () => {
      if (selectedGroupCount === 0) {
        sentenceEl.innerText = 'Select groups to begin';
        return;
      }

      const totalAllocated = q.a - unallocatedCount;
      const allEqual = groupCounts.length > 0 && groupCounts.every(val => val === groupCounts[0] && val > 0);

      if (totalAllocated === 0) {
        sentenceEl.innerText = `${q.a} items to share into ${selectedGroupCount} groups`;
      } else if (unallocatedCount === 0 && allEqual) {
        sentenceEl.innerText = `${q.a} ÷ ${selectedGroupCount} = ${groupCounts[0]} in each group`;
      } else if (allEqual) {
        sentenceEl.innerText = `${totalAllocated} shared equally (${groupCounts[0]} per group)`;
      } else {
        sentenceEl.innerText = `Divide items equally into all ${selectedGroupCount} groups`;
      }

      container.setAttribute('data-selected-groups', selectedGroupCount);
      container.setAttribute('data-group-counts', JSON.stringify(groupCounts));
    };

    // ALLOCATE ONE ITEM TO A SPECIFIC GROUP
    const allocateToGroup = (gIdx) => {
      if (unallocatedCount > 0) {
        unallocatedCount--;
        groupCounts[gIdx]++;
        renderPool();
        renderTrays();
        updateSentenceDisplay();
      }
    };

    // DE-ALLOCATE ONE ITEM FROM A GROUP BACK TO POOL
    const deallocateFromGroup = (gIdx) => {
      if (groupCounts[gIdx] > 0) {
        groupCounts[gIdx]--;
        unallocatedCount++;
        renderPool();
        renderTrays();
        updateSentenceDisplay();
      }
    };

    // RENDER GROUP TRAYS
    const renderTrays = () => {
      if (selectedGroupCount === 0) return;

      let traysHtml = '';
      for (let g = 0; g < selectedGroupCount; g++) {
        const cnt = groupCounts[g];
        let itemsHtml = '';
        for (let k = 0; k < cnt; k++) {
          itemsHtml += `<span style="font-size: 1.3rem;">${q.itemEmoji}</span>`;
        }

        traysHtml += `
          <div class="div-tray-card" data-gidx="${g}" style="
            background: var(--bg-card);
            border: 2px solid var(--accent);
            border-radius: 14px;
            padding: 10px;
            min-width: 90px;
            min-height: 110px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            transition: transform 0.15s ease;
          ">
            <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
              Group ${g + 1}
            </span>

            <div style="
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 3px;
              margin: 6px 0;
              min-height: 42px;
            ">
              ${itemsHtml || `<span style="font-size: 0.75rem; color: var(--text-muted);">Tap to add</span>`}
            </div>

            <span style="
              font-size: 0.85rem;
              font-weight: 800;
              color: var(--accent);
              background: rgba(79, 70, 229, 0.1);
              padding: 2px 8px;
              border-radius: 8px;
            ">${cnt} items</span>
          </div>
        `;
      }

      traysContainer.innerHTML = traysHtml;

      // Group tray tap handlers
      traysContainer.querySelectorAll('.div-tray-card').forEach((trayEl, gIdx) => {
        trayEl.onclick = () => {
          if (unallocatedCount > 0) {
            allocateToGroup(gIdx);
          } else {
            deallocateFromGroup(gIdx);
          }
        };
      });
    };

    // STEP 1: SELECT NUMBER OF GROUPS HANDLER
    container.querySelectorAll('.div-group-btn').forEach(btn => {
      btn.onclick = () => {
        const count = parseInt(btn.getAttribute('data-cnt'), 10);
        selectedGroupCount = count;

        // Reset selections & allocation counts
        unallocatedCount = q.a;
        groupCounts = Array(count).fill(0);

        // Highlight selected button
        container.querySelectorAll('.div-group-btn').forEach(b => {
          if (parseInt(b.getAttribute('data-cnt'), 10) === count) {
            b.style.background = 'var(--accent)';
            b.style.color = 'white';
            b.style.borderColor = 'var(--accent)';
          } else {
            b.style.background = 'var(--bg-primary)';
            b.style.color = 'var(--text-main)';
            b.style.borderColor = 'var(--border-color)';
          }
        });

        renderPool();
        renderTrays();
        updateSentenceDisplay();
      };
    });

    // KEYPAD EVENT HANDLERS
    container.querySelectorAll('.div-key[data-k]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-k');
        if (typedAnswer === '0') typedAnswer = k;
        else typedAnswer += k;

        ansDisplay.innerText = typedAnswer || '?';
        ansDisplay.setAttribute('data-typed', typedAnswer);
      };
    });

    container.querySelector('#divClear').onclick = () => {
      typedAnswer = '';
      ansDisplay.innerText = '?';
      ansDisplay.removeAttribute('data-typed');
    };

    renderPool();
    updateSentenceDisplay();
  },

  evaluate(q) {
    const container = document.querySelector('#workspace') || document.querySelector('#extraWorkspace') || document.querySelector('#sampleQWorkspace');
    const ansDisplay = document.getElementById('ansDisplay');

    if (!ansDisplay || !container) return false;

    const selectedGroups = parseInt(container.getAttribute('data-selected-groups'), 10) || 0;
    const groupCountsJson = container.getAttribute('data-group-counts');
    const groupCounts = groupCountsJson ? JSON.parse(groupCountsJson) : [];
    const userTypedVal = parseInt(ansDisplay.getAttribute('data-typed'), 10);

    // Evaluation checks:
    // 1. Group count matches divisor (q.b)
    // 2. All groups have exactly the target quotient items (q.target)
    // 3. User typed answer matches quotient (q.target)
    const isGroupCountCorrect = selectedGroups === q.b;
    const isDistributionCorrect = groupCounts.length === q.b && groupCounts.every(cnt => cnt === q.target);
    const isTypedAnswerCorrect = userTypedVal === q.target;

    return isGroupCountCorrect && isDistributionCorrect && isTypedAnswerCorrect;
  }
};

registerQuestionType('division', divisionModule);
