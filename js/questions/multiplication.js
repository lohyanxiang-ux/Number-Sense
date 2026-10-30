import { registerQuestionType, formatMath } from './registry.js';

const funObjects = [
  { name: 'Apples', emoji: '🍎' },
  { name: 'Stars', emoji: '⭐' },
  { name: 'Frogs', emoji: '🐸' },
  { name: 'Cookies', emoji: '🍪' },
  { name: 'Gems', emoji: '💎' },
  { name: 'Balloons', emoji: '🎈' },
  { name: 'Donuts', emoji: '🍩' },
  { name: 'Rockets', emoji: '🚀' },
  { name: 'Soccer Balls', emoji: '⚽' }
];

const multiplicationModule = {
  generate() {
    // a = Number of groups (2 to 5)
    // b = Items per group (1 to 5)
    const a = Math.floor(Math.random() * 4) + 2; 
    const b = Math.floor(Math.random() * 5) + 1; 
    const target = a * b;

    const item = funObjects[Math.floor(Math.random() * funObjects.length)];
    const addArr = Array(a).fill(b);
    const additionStr = addArr.join(' + ');

    return {
      type: 'multiplication',
      a: a,
      b: b,
      target: target,
      itemEmoji: item.emoji,
      itemName: item.name,
      additionStr: additionStr,
      prompt: `Evaluate <strong>${a} × ${b}</strong>. Tap each of the <strong>${a} groups</strong> to add <strong>${b} ${item.emoji}</strong>, then key in your final answer:`,
      explanation: `<strong>${a} × ${b}</strong> represents <strong>${a} groups of ${b}</strong>.<br>${additionStr} = <strong>${target}</strong>.`
    };
  },

  render(q, container) {
    let traysHtml = '';
    for (let i = 0; i < q.a; i++) {
      traysHtml += `
        <div class="rep-tray-card" data-idx="${i}" data-filled="false" style="
          background: var(--bg-card);
          border: 2px dashed var(--accent);
          border-radius: 16px;
          padding: 12px;
          min-width: 100px;
          min-height: 110px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          touch-action: manipulation;
          user-select: none;
        ">
          <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
            Group ${i + 1}
          </span>
          
          <div class="tray-items-grid" style="
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 4px;
            margin: 8px 0;
            min-height: 48px;
          ">
            <span class="tray-placeholder" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
              Tap to fill
            </span>
          </div>

          <span class="tray-count-badge" style="
            font-size: 0.85rem;
            font-weight: 800;
            color: var(--accent);
            background: rgba(79, 70, 229, 0.1);
            padding: 2px 8px;
            border-radius: 8px;
            visibility: hidden;
          ">+${q.b}</span>
        </div>
      `;
    }

    const html = `
      <div style="max-width: 580px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- TRAYS CONTAINER GRID -->
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 15px 0 20px 0;
        ">
          ${traysHtml}
        </div>

        <!-- REPEATED ADDITION VISUALIZATION BRIDGE -->
        <div style="
          background: rgba(79, 70, 229, 0.08); 
          border: 2px solid var(--accent); 
          border-radius: 12px; 
          padding: 12px 20px; 
          display: inline-block; 
          margin-bottom: 20px;
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--accent);
        ">
          <span style="font-size: 0.85rem; display: block; color: var(--text-muted); margin-bottom: 2px; font-weight: 700; text-transform: uppercase;">
            Repeated Addition View
          </span>
          <span id="repAddSentence">?</span>
        </div>

        <!-- EQUATION INPUT & KEYPAD -->
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
            ${q.a} × ${q.b} = <span id="ansDisplay" style="
              color: var(--accent); 
              border-bottom: 3.5px solid var(--accent); 
              padding: 0 12px;
              min-width: 65px;
              display: inline-block;
            ">?</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="rep-key" data-k="1">1</button>
            <button class="rep-key" data-k="2">2</button>
            <button class="rep-key" data-k="3">3</button>
            <button class="rep-key" data-k="4">4</button>
            <button class="rep-key" data-k="5">5</button>
            <button class="rep-key" data-k="6">6</button>
            <button class="rep-key" data-k="7">7</button>
            <button class="rep-key" data-k="8">8</button>
            <button class="rep-key" data-k="9">9</button>
            <button class="rep-key" data-k="0" style="grid-column: span 2;">0</button>
            <button class="rep-key" id="repClear" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight: 800;">C</button>
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;

    // KEYPAD CSS STYLING
    container.querySelectorAll('.rep-key').forEach(btn => {
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

    let typedAnswer = '';
    const ansDisplay = container.querySelector('#ansDisplay');
    const sentenceEl = container.querySelector('#repAddSentence');
    const trayCards = container.querySelectorAll('.rep-tray-card');

    const updateSentenceDisplay = () => {
      let filledCount = 0;
      let terms = [];

      trayCards.forEach(card => {
        if (card.getAttribute('data-filled') === 'true') {
          filledCount++;
          terms.push(q.b);
        }
      });

      if (terms.length === 0) {
        sentenceEl.innerText = '?';
      } else {
        sentenceEl.innerText = `${terms.join(' + ')} = ?`;
      }

      container.setAttribute('data-filled-trays', filledCount);
    };

    trayCards.forEach(card => {
      card.onclick = () => {
        const isFilled = card.getAttribute('data-filled') === 'true';

        const grid = card.querySelector('.tray-items-grid');
        const badge = card.querySelector('.tray-count-badge');

        if (!isFilled) {
          card.setAttribute('data-filled', 'true');
          card.style.borderStyle = 'solid';
          card.style.background = 'rgba(79, 70, 229, 0.05)';

          let emojiIcons = '';
          for (let k = 0; k < q.b; k++) {
            emojiIcons += `<span style="font-size: 1.5rem;">${q.itemEmoji}</span>`;
          }
          grid.innerHTML = emojiIcons;
          badge.style.visibility = 'visible';
        } else {
          card.setAttribute('data-filled', 'false');
          card.style.borderStyle = 'dashed';
          card.style.background = 'var(--bg-card)';

          grid.innerHTML = `<span class="tray-placeholder" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Tap to fill</span>`;
          badge.style.visibility = 'hidden';
        }

        updateSentenceDisplay();
      };
    });

    container.querySelectorAll('.rep-key[data-k]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-k');
        if (typedAnswer === '0') typedAnswer = k;
        else typedAnswer += k;

        ansDisplay.innerText = typedAnswer || '?';
        ansDisplay.setAttribute('data-typed', typedAnswer);
      };
    });

    container.querySelector('#repClear').onclick = () => {
      typedAnswer = '';
      ansDisplay.innerText = '?';
      ansDisplay.removeAttribute('data-typed');
    };

    updateSentenceDisplay();
  },

  evaluate(q) {
    const container = document.querySelector('#workspace') || document.querySelector('#extraWorkspace') || document.querySelector('#sampleQWorkspace');
    const ansDisplay = document.getElementById('ansDisplay');

    if (!ansDisplay || !container) return false;

    const filledTrays = parseInt(container.getAttribute('data-filled-trays'), 10) || 0;
    const userTypedVal = parseInt(ansDisplay.getAttribute('data-typed'), 10);

    return filledTrays === q.a && userTypedVal === q.target;
  }
};

registerQuestionType('multiplication', multiplicationModule);
