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
      prompt: `Evaluate <strong>${exprStr}</strong>. Drag suitable groups into the workspace, then key in your final answer:`,
      explanation: `<strong>${exprStr}</strong> can be represented as <strong>${a} groups of ${b}</strong> (${Array(a).fill(b).join(' + ')} = <strong>${target}</strong>) or <strong>${b} groups of ${a}</strong> (${Array(b).fill(a).join(' + ')} = <strong>${target}</strong>).`
    };
  },

  render(q, container) {
    // Generate Side Bank Item Cards (Sizes 2 to 6)
    let bankCardsHtml = '';
    [2, 3, 4, 5, 6].forEach(size => {
      const obj = funObjects[size];
      let emojisHtml = '';
      for (let i = 0; i < size; i++) {
        emojisHtml += `<span style="font-size: 1.2rem;">${obj.emoji}</span>`;
      }

      bankCardsHtml += `
        <div class="bank-group-card" data-size="${size}" style="
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: grab;
          touch-action: none;
          user-select: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
          transition: transform 0.15s ease, border-color 0.15s ease;
        ">
          <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent);">Group of ${size}</span>
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; max-width: 75px;">
            ${emojisHtml}
          </div>
        </div>
      `;
    });

    const html = `
      <div style="max-width: 620px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- MAIN WORKSPACE LAYOUT (SIDE BANK + DROP ZONE) -->
        <div style="
          display: grid;
          grid-template-columns: 130px 1fr;
          gap: 14px;
          margin: 15px 0 20px 0;
          align-items: start;
        ">
          <!-- LEFT SIDE BANK -->
          <div style="
            background: var(--bg-primary);
            border: 2px solid var(--border-color);
            border-radius: 14px;
            padding: 10px 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 290px;
            overflow-y: auto;
          ">
            <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
              Available Groups
            </span>
            ${bankCardsHtml}
          </div>

          <!-- DROP ZONE WORKSPACE -->
          <div id="multDropZone" style="
            background: rgba(79, 70, 229, 0.03);
            border: 2px dashed var(--accent);
            border-radius: 14px;
            min-height: 270px;
            padding: 12px;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            justify-content: center;
            gap: 10px;
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
              font-size: 0.95rem;
              pointer-events: none;
            ">
              📥 Drag or tap groups here
            </div>
          </div>
        </div>

        <!-- REPEATED ADDITION LIVE TRACKER -->
        <div style="
          background: rgba(79, 70, 229, 0.08); 
          border: 2px solid var(--accent); 
          border-radius: 12px; 
          padding: 10px 18px; 
          display: inline-block; 
          margin-bottom: 20px;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--accent);
        ">
          <span style="font-size: 0.8rem; display: block; color: var(--text-muted); margin-bottom: 2px; font-weight: 700; text-transform: uppercase;">
            Repeated Addition View
          </span>
          <span id="repAddSentence">?</span>
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

    let droppedGroups = []; // Array of integers representing dropped group sizes
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
          // E.g., 1 group of 2 -> "2"
          sentenceEl.innerText = `${droppedGroups[0]}`;
        } else {
          // E.g., 2 groups of 2 -> "2 + 2 = 4", 3 groups of 2 -> "2 + 2 + 2 = 6"
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
        emojisHtml += `<span style="font-size: 1.3rem;">${obj.emoji}</span>`;
      }

      const cardEl = document.createElement('div');
      cardEl.className = 'workspace-dropped-card';
      cardEl.setAttribute('data-size', groupSize);
      cardEl.style.cssText = `
        background: var(--bg-card);
        border: 2px solid var(--accent);
        border-radius: 12px;
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        position: relative;
        box-shadow: 0 3px 6px rgba(0,0,0,0.12);
        animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      `;

      cardEl.innerHTML = `
        <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent);">+${groupSize}</span>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; max-width: 80px;">
          ${emojisHtml}
        </div>
        <span style="
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          font-size: 0.7rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        ">✕</span>
      `;

      // Click dropped item to remove it
      cardEl.onclick = () => {
        const idx = Array.from(dropZone.children).indexOf(cardEl) - 1; // subtract placeholder
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

    // INTERACTION 1: TAP TO ADD FROM SIDE BANK
    container.querySelectorAll('.bank-group-card').forEach(card => {
      card.onclick = () => {
        const size = card.getAttribute('data-size');
        addGroupToWorkspace(size);
      };
    });

    // INTERACTION 2: TOUCH / POINTER DRAG & DROP LOGIC
    container.querySelectorAll('.bank-group-card').forEach(card => {
      let clone = null;
      let startX = 0, startY = 0;

      card.onpointerdown = (e) => {
        startX = e.clientX;
        startY = e.clientY;

        clone = card.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.zIndex = '1000';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = '0.9';
        clone.style.transform = 'scale(1.05)';
        clone.style.left = `${e.clientX - 40}px`;
        clone.style.top = `${e.clientY - 40}px`;
        document.body.appendChild(clone);

        card.setPointerCapture(e.pointerId);

        card.onpointermove = (pe) => {
          if (clone) {
            clone.style.left = `${pe.clientX - 40}px`;
            clone.style.top = `${pe.clientY - 40}px`;
          }
        };

        card.onpointerup = (pe) => {
          card.onpointermove = null;
          card.onpointerup = null;
          if (clone) {
            clone.remove();
            clone = null;
          }

          const dzRect = dropZone.getBoundingClientRect();
          if (
            pe.clientX >= dzRect.left &&
            pe.clientX <= dzRect.right &&
            pe.clientY >= dzRect.top &&
            pe.clientY <= dzRect.bottom
          ) {
            const size = card.getAttribute('data-size');
            addGroupToWorkspace(size);
          }
        };
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

    container.querySelector('#multClear').onclick = () => {
      typedAnswer = '';
      ansDisplay.innerText = '?';
      ansDisplay.removeAttribute('data-typed');
    };

    updateSentenceDisplay();
  },

  evaluate(q) {
    const dropZone = document.getElementById('multDropZone');
    const ansDisplay = document.getElementById('ansDisplay');

    if (!dropZone || !ansDisplay) return false;

    const droppedSizesJson = dropZone.getAttribute('data-dropped-sizes');
    const droppedSizes = droppedSizesJson ? JSON.parse(droppedSizesJson) : [];
    const userTypedVal = parseInt(ansDisplay.getAttribute('data-typed'), 10);

    // Accept EITHER representation:
    // Option A: q.a groups of size q.b
    // Option B: q.b groups of size q.a
    const isValidOptionA = droppedSizes.length === q.a && droppedSizes.every(sz => sz === q.b);
    const isValidOptionB = droppedSizes.length === q.b && droppedSizes.every(sz => sz === q.a);

    const isVisualCorrect = isValidOptionA || isValidOptionB;
    const isAnswerCorrect = userTypedVal === q.target;

    return isVisualCorrect && isAnswerCorrect;
  }
};

registerQuestionType('multiplication', multiplicationModule);
