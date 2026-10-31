import { registerQuestionType, formatMath } from './registry.js';

const funObjects = {
  2: { emoji: '🍎', name: 'Apples' },
  3: { emoji: '⭐', name: 'Stars' },
  4: { emoji: '🐸', name: 'Frogs' },
  5: { emoji: '🍪', name: 'Cookies' },
  6: { emoji: '💎', name: 'Gems' }
};

const multiplicationModule = {
  generate() {
    // Generate factors between 2 and 6
    const a = Math.floor(Math.random() * 5) + 2; // 2 to 6
    const b = Math.floor(Math.random() * 5) + 2; // 2 to 6
    const target = a * b;

    const exprStr = `${a} × ${b}`;

    return {
      type: 'multiplication',
      a: a,
      b: b,
      target: target,
      exprStr: exprStr,
      prompt: `Evaluate <strong>${formatMath(exprStr)}</strong>. Drag suitable groups into the workspace, then key in your final answer:`,
      explanation: `<strong>${formatMath(exprStr)}</strong> can be represented as <strong>${a} groups of ${b}</strong> (${Array(a).fill(b).join(' + ')} = <strong>${target}</strong>) or <strong>${b} groups of ${a}</strong> (${Array(b).fill(a).join(' + ')} = <strong>${target}</strong>).`
    };
  },

  render(q, container) {
    // Generate Side Bank Item Cards (Sizes 2 to 6)
    let bankCardsHtml = '';
    [2, 3, 4, 5, 6].forEach(size => {
      const obj = funObjects[size];
      let emojisHtml = '';
      for (let i = 0; i < size; i++) {
        emojisHtml += `<span style="font-size: 1.1rem; pointer-events: none;">${obj.emoji}</span>`;
      }

      bankCardsHtml += `
        <div class="bank-group-card" data-size="${size}" style="
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: 10px;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
          transition: transform 0.15s ease, border-color 0.15s ease;
        ">
          <span style="font-size: 0.7rem; font-weight: 800; color: var(--accent); pointer-events: none;">Group of ${size}</span>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; max-width: 65px; pointer-events: none;">
            ${emojisHtml}
          </div>
        </div>
      `;
    });

    const html = `
      <div class="ipad-responsive-grid" style="user-select: none; -webkit-user-select: none;">
        
        <!-- LEFT COLUMN: ITEM BANK & INTERACTIVE DROP ZONE WORKSPACE -->
        <div class="ipad-left-pane">
          <div style="
            display: grid;
            grid-template-columns: 110px 1fr;
            gap: 10px;
            margin-bottom: 12px;
            align-items: start;
          ">
            <!-- SIDE ITEM BANK -->
            <div style="
              background: var(--bg-primary);
              border: 2px solid var(--border-color);
              border-radius: 12px;
              padding: 8px 6px;
              display: flex;
              flex-direction: column;
              gap: 6px;
              max-height: 270px;
              overflow-y: auto;
            ">
              <span style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; text-align: center;">
                Groups
              </span>
              ${bankCardsHtml}
            </div>

            <!-- DROP ZONE WORKSPACE -->
            <div id="multDropZone" style="
              background: rgba(79, 70, 229, 0.03);
              border: 2px dashed var(--accent);
              border-radius: 12px;
              min-height: 250px;
              padding: 10px;
              display: flex;
              flex-wrap: wrap;
              align-content: flex-start;
              justify-content: center;
              gap: 8px;
              position: relative;
              touch-action: none;
            ">
              <div id="dropPlaceholder" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--text-muted);
                font-weight: 700;
                font-size: 0.88rem;
                pointer-events: none;
                text-align: center;
              ">
                📥 Drag or tap groups here
              </div>
            </div>
          </div>

          <!-- REPEATED ADDITION LIVE TRACKER -->
          <div style="
            background: rgba(79, 70, 229, 0.08); 
            border: 2px solid var(--accent); 
            border-radius: 10px; 
            padding: 8px 14px; 
            text-align: center;
            font-size: 1.15rem;
            font-weight: 800;
            color: var(--accent);
          ">
            <span style="font-size: 0.75rem; display: block; color: var(--text-muted); margin-bottom: 2px; font-weight: 700; text-transform: uppercase;">
              Repeated Addition View
            </span>
            <span id="repAddSentence">?</span>
          </div>
        </div>

        <!-- RIGHT COLUMN: EQUATION INPUT & KEYPAD -->
        <div class="ipad-right-pane" style="text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 12px;">
            ${q.exprStr} = <span id="ansDisplay" style="
              color: var(--accent); 
              border-bottom: 3.5px solid var(--accent); 
              padding: 0 10px;
              min-width: 55px;
              display: inline-block;
            ">?</span>
          </div>

          <!-- KEYPAD GRID -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 260px; margin: 0 auto;">
            <button class="mult-key" data-k="1">1</button>
            <button class="mult-key" data-k="2">2</button>
            <button class="mult-key" data-k="3">3</button>
            <button class="mult-key" data-k="4">4</button>
            <button class="mult-key" data-k="5">5</button>
            <button class="mult-key" data-k="6">6</button>
            <button class="mult-key" data-k="7">7</button>
            <button class="mult-key" data-k="8">8</button>
            <button class="mult-key" data-k="9">9</button>
            <button class="mult-key" data-k="0" style="grid-column: span 2;">0</button>
            <button class="mult-key" id="multClear" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight: 800;">C</button>
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;

    // STYLING KEYPAD BUTTONS
    container.querySelectorAll('.mult-key').forEach(btn => {
      btn.style.height = '46px';
      btn.style.fontSize = '1.2rem';
      btn.style.fontWeight = '800';
      btn.style.borderRadius = '8px';
      btn.style.border = '2px solid var(--border-color)';
      btn.style.background = 'var(--bg-card)';
      btn.style.color = 'var(--text-main)';
      btn.style.cursor = 'pointer';
      btn.style.touchAction = 'manipulation';
    });

    let droppedGroups = [];
    let typedAnswer = '';

    const dropZone = container.querySelector('#multDropZone');
    const placeholder = container.querySelector('#dropPlaceholder');
    const sentenceEl = container.querySelector('#repAddSentence');
    const ansDisplay = container.querySelector('#ansDisplay');

    // REPEATED ADDITION SENTENCE UPDATE LOGIC
    const updateSentenceDisplay = () => {
      if (droppedGroups.length === 0) {
        placeholder.style.display = 'block';
        sentenceEl.innerText = '?';
      } else {
        placeholder.style.display = 'none';
        
        if (droppedGroups.length === 1) {
          sentenceEl.innerText = `${droppedGroups[0]}`;
        } else {
          const sum = droppedGroups.reduce((acc, curr) => acc + curr, 0);
          sentenceEl.innerText = `${droppedGroups.join(' + ')} = ${sum}`;
        }
      }
      dropZone.setAttribute('data-dropped-sizes', JSON.stringify(droppedGroups));
    };

    // ADD A GROUP TO WORKSPACE
    const addGroupToWorkspace = (size) => {
      const groupSize = parseInt(size, 10);
      droppedGroups.push(groupSize);

      const obj = funObjects[groupSize];
      let emojisHtml = '';
      for (let i = 0; i < groupSize; i++) {
        emojisHtml += `<span style="font-size: 1.1rem; pointer-events: none;">${obj.emoji}</span>`;
      }

      const cardEl = document.createElement('div');
      cardEl.className = 'workspace-dropped-card';
      cardEl.setAttribute('data-size', groupSize);
      cardEl.style.cssText = `
        background: var(--bg-card);
        border: 2px solid var(--accent);
        border-radius: 10px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        cursor: pointer;
        position: relative;
        box-shadow: 0 3px 6px rgba(0,0,0,0.12);
      `;

      cardEl.innerHTML = `
        <span style="font-size: 0.7rem; font-weight: 800; color: var(--accent); pointer-events: none;">+${groupSize}</span>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; max-width: 70px; pointer-events: none;">
          ${emojisHtml}
        </div>
        <span class="remove-btn" style="
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 0.65rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        ">✕</span>
      `;

      // Click dropped item to remove it
      cardEl.onclick = (e) => {
        e.stopPropagation();
        const foundIndex = droppedGroups.indexOf(groupSize);
        if (foundIndex > -1) {
          droppedGroups.splice(foundIndex, 1);
        }
        cardEl.remove();
        updateSentenceDisplay();
      };

      dropZone.appendChild(cardEl);
      updateSentenceDisplay();
    };

    // UNIFIED TOUCH / POINTER DRAG & TAP LOGIC
    container.querySelectorAll('.bank-group-card').forEach(card => {
      let clone = null;
      let startX = 0;
      let startY = 0;
      let hasDragged = false;

      card.onpointerdown = (e) => {
        startX = e.clientX;
        startY = e.clientY;
        hasDragged = false;

        clone = card.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.zIndex = '1000';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = '0.85';
        clone.style.transform = 'scale(1.05)';
        clone.style.left = `${e.clientX - 40}px`;
        clone.style.top = `${e.clientY - 40}px`;
        document.body.appendChild(clone);

        try {
          card.setPointerCapture(e.pointerId);
        } catch (err) {}

        card.onpointermove = (pe) => {
          if (Math.hypot(pe.clientX - startX, pe.clientY - startY) > 5) {
            hasDragged = true;
          }
          if (clone) {
            clone.style.left = `${pe.clientX - 40}px`;
            clone.style.top = `${pe.clientY - 40}px`;
          }
        };

        const cleanUp = (pe) => {
          card.onpointermove = null;
          card.onpointerup = null;
          card.onpointercancel = null;

          try {
            card.releasePointerCapture(pe.pointerId);
          } catch (err) {}

          if (clone) {
            clone.remove();
            clone = null;
          }

          const size = card.getAttribute('data-size');

          if (!hasDragged) {
            // Tap gesture
            addGroupToWorkspace(size);
          } else {
            // Drag gesture
            const elem = document.elementFromPoint(pe.clientX, pe.clientY);
            if (elem && (elem === dropZone || dropZone.contains(elem))) {
              addGroupToWorkspace(size);
            }
          }
        };

        card.onpointerup = cleanUp;
        card.onpointercancel = cleanUp;
      };
    });

    // KEYPAD LOGIC
    container.querySelectorAll('.mult-key[data-k]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-k');
        if (typedAnswer === '0') typedAnswer = k;
        else typedAnswer += k;

        ansDisplay.innerText = typedAnswer || '?';
        ansDisplay.setAttribute('data-typed', typedAnswer);
      };
    });

    const clearBtn = container.querySelector('#multClear');
    if (clearBtn) {
      clearBtn.onclick = () => {
        typedAnswer = '';
        ansDisplay.innerText = '?';
        ansDisplay.removeAttribute('data-typed');
      };
    }

    updateSentenceDisplay();
  },

  evaluate(q) {
    const dropZone = document.getElementById('multDropZone');
    const ansDisplay = document.getElementById('ansDisplay');

    if (!dropZone || !ansDisplay) return false;

    const droppedSizesJson = dropZone.getAttribute('data-dropped-sizes');
    const droppedSizes = droppedSizesJson ? JSON.parse(droppedSizesJson) : [];
    const userTypedVal = parseInt(ansDisplay.getAttribute('data-typed'), 10);

    const isValidOptionA = droppedSizes.length === q.a && droppedSizes.every(sz => sz === q.b);
    const isValidOptionB = droppedSizes.length === q.b && droppedSizes.every(sz => sz === q.a);

    const isVisualCorrect = isValidOptionA || isValidOptionB;
    const isAnswerCorrect = userTypedVal === q.target;

    return isVisualCorrect && isAnswerCorrect;
  }
};

registerQuestionType('multiplication', multiplicationModule);
