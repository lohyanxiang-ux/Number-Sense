import { registerQuestionType } from './registry.js';

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
    const b = Math.floor(Math.random() * 4) + 2;
    const target = Math.floor(Math.random() * 5) + 2;
    const a = b * target;
    const item = funObjects[Math.floor(Math.random() * funObjects.length)];

    return {
      type: 'division',
      a: a,
      b: b,
      target: target,
      itemEmoji: item.emoji,
      itemName: item.name,
      exprStr: `${a} ÷ ${b}`,
      prompt: `Evaluate <strong>${a} ÷ ${b} by dividing into equal groups</strong>:`,
      explanation: `<strong>${a} ÷ ${b}</strong> means dividing <strong>${a} ${item.emoji}</strong> equally into <strong>${b} groups</strong>.<br>Each group gets <strong>${target} ${item.emoji}</strong>.`,
      userSelectedGroups: 0,
      userGroupCounts: [],
      userTypedAnswer: ''
    };
  },

  render(q, container) {
    let unallocatedCount = q.a;
    let selectedGroupCount = q.userSelectedGroups || 0;
    let groupCounts = q.userGroupCounts || [];
    let typedAnswer = q.userTypedAnswer || '';

    q.userSelectedGroups = selectedGroupCount;
    q.userGroupCounts = groupCounts;
    q.userTypedAnswer = typedAnswer;

    const html = `
      <div class="ipad-responsive-grid" style="user-select: none;">
        
        <!-- LEFT COLUMN: VISUAL GROUPING WORKSPACE -->
        <div class="ipad-left-pane">
          <!-- STEP 1: GROUP COUNT SELECTOR -->
          <div style="
            background: var(--bg-card);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 8px 12px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
          ">
            <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-main);">
              1. Select Number of Groups:
            </span>
            <div id="groupBtnContainer" style="display: flex; gap: 6px;">
              ${[2, 3, 4, 5, 6].map(num => `
                <button class="div-group-btn" data-cnt="${num}" style="
                  background: var(--bg-primary);
                  border: 2px solid var(--border-color);
                  color: var(--text-main);
                  font-weight: 800;
                  font-size: 0.95rem;
                  padding: 4px 12px;
                  border-radius: 8px;
                  cursor: pointer;
                  touch-action: manipulation;
                ">${num}</button>
              `).join('')}
            </div>
          </div>

          <!-- STEP 2: UNALLOCATED ITEM POOL -->
          <div style="
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 10px;
            margin-bottom: 12px;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 0 4px;">
              <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
                Items to Divide (Total: ${q.a})
              </span>
              <span id="poolCountBadge" style="font-size: 0.8rem; font-weight: 800; color: var(--accent);">
                ${unallocatedCount} Remaining
              </span>
            </div>
            
            <div id="itemPool" style="
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 6px;
              min-height: 48px;
              padding: 6px;
              background: var(--bg-card);
              border: 2px dashed var(--accent);
              border-radius: 10px;
            ">
            </div>
          </div>

          <!-- STEP 3: DYNAMIC GROUP TRAYS -->
          <div id="divTraysContainer" style="
            display: flex;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            min-height: 100px;
          ">
            <div style="color: var(--text-muted); font-weight: 700; font-size: 0.85rem; padding: 20px 0;">
              👆 Select group count above to start dividing
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: EQUATION & KEYPAD -->
        <div class="ipad-right-pane" style="text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 12px;">
            ${q.a} ÷ ${q.b} = <span id="ansDisplay" style="
              color: var(--accent); 
              border-bottom: 3px solid var(--accent); 
              padding: 0 10px;
              min-width: 55px;
              display: inline-block;
            ">${typedAnswer || '?'}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 280px; margin: 0 auto;">
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

    container.querySelectorAll('.div-key').forEach(btn => {
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

    const poolEl = container.querySelector('#itemPool');
    const poolBadge = container.querySelector('#poolCountBadge');
    const traysContainer = container.querySelector('#divTraysContainer');
    const ansDisplay = container.querySelector('#ansDisplay');

    const renderPool = () => {
      let poolHtml = '';
      for (let i = 0; i < unallocatedCount; i++) {
        poolHtml += `
          <div class="div-pool-item" style="
            font-size: 1.4rem;
            padding: 3px 6px;
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

            container.querySelectorAll('.div-tray-card').forEach((tray, gIdx) => {
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
      });
    };

    const allocateToGroup = (gIdx) => {
      if (unallocatedCount > 0) {
        unallocatedCount--;
        groupCounts[gIdx]++;
        q.userGroupCounts = [...groupCounts];
        renderPool();
        renderTrays();
      }
    };

    const deallocateFromGroup = (gIdx) => {
      if (groupCounts[gIdx] > 0) {
        groupCounts[gIdx]--;
        unallocatedCount++;
        q.userGroupCounts = [...groupCounts];
        renderPool();
        renderTrays();
      }
    };

    const renderTrays = () => {
      if (selectedGroupCount === 0) return;

      const isAllDivided = (unallocatedCount === 0);
      const isAllEqual = groupCounts.length > 0 && groupCounts.every(val => val === groupCounts[0] && val > 0);
      const isFullyEqual = isAllDivided && isAllEqual;

      const trayBorderColor = isFullyEqual ? '#10b981' : '#ef4444';
      const trayBg = isFullyEqual ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)';
      const badgeBg = isFullyEqual ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      const badgeColor = isFullyEqual ? '#10b981' : '#ef4444';

      let traysHtml = '';
      for (let g = 0; g < selectedGroupCount; g++) {
        const cnt = groupCounts[g];
        let itemsHtml = '';
        for (let k = 0; k < cnt; k++) {
          itemsHtml += `<span style="font-size: 1.2rem;">${q.itemEmoji}</span>`;
        }

        traysHtml += `
          <div class="div-tray-card" data-gidx="${g}" style="
            background: ${trayBg};
            border: 2px solid ${trayBorderColor};
            border-radius: 12px;
            padding: 8px;
            min-width: 80px;
            min-height: 95px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            transition: all 0.2s ease;
          ">
            <span style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
              Group ${g + 1}
            </span>

            <div style="
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 2px;
              margin: 4px 0;
              min-height: 36px;
            ">
              ${itemsHtml || `<span style="font-size: 0.7rem; color: var(--text-muted);">Tap</span>`}
            </div>

            <span style="
              font-size: 0.75rem;
              font-weight: 800;
              color: ${badgeColor};
              background: ${badgeBg};
              padding: 2px 6px;
              border-radius: 6px;
            ">${cnt} items</span>
          </div>
        `;
      }

      traysContainer.innerHTML = traysHtml;

      traysContainer.querySelectorAll('.div-tray-card').forEach((trayEl, gIdx) => {
        trayEl.onclick = () => {
          if (unallocatedCount > 0) allocateToGroup(gIdx);
          else deallocateFromGroup(gIdx);
        };
      });
    };

    container.querySelectorAll('.div-group-btn').forEach(btn => {
      btn.onclick = () => {
        const count = parseInt(btn.getAttribute('data-cnt'), 10);
        selectedGroupCount = count;
        unallocatedCount = q.a;
        groupCounts = Array(count).fill(0);

        q.userSelectedGroups = count;
        q.userGroupCounts = [...groupCounts];

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
      };
    });

    container.querySelectorAll('.div-key[data-k]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-k');
        if (typedAnswer === '0') typedAnswer = k;
        else typedAnswer += k;

        q.userTypedAnswer = typedAnswer;
        ansDisplay.innerText = typedAnswer || '?';
      };
    });

    const clearBtn = container.querySelector('#divClear');
    if (clearBtn) {
      clearBtn.onclick = () => {
        typedAnswer = '';
        q.userTypedAnswer = '';
        ansDisplay.innerText = '?';
      };
    }

    renderPool();
  },

  evaluate(q) {
    const selectedGroups = q.userSelectedGroups || 0;
    const groupCounts = q.userGroupCounts || [];
    const userTypedVal = parseInt(q.userTypedAnswer, 10);

    const isGroupCountCorrect = (selectedGroups === q.b);
    const isDistributionCorrect = (groupCounts.length === q.b) && groupCounts.every(cnt => cnt === q.target);
    const isTypedAnswerCorrect = (userTypedVal === q.target);

    return isGroupCountCorrect && isDistributionCorrect && isTypedAnswerCorrect;
  }
};

registerQuestionType('division', divisionModule);
