import { registerQuestionType, formatMath } from './registry.js';

const placeValueModule = {
  generate() {
    // Generate a random number with whole and decimal parts
    const whole = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
    const dec = Math.floor(Math.random() * 900) + 100; // 100-999
    const numStr = `${whole}.${dec}`;

    // Pick a place value to test
    const places = [
      { name: 'Thousands', idx: 0 },
      { name: 'Hundreds', idx: 1 },
      { name: 'Tens', idx: 2 },
      { name: 'Ones', idx: 3 },
      { name: 'Tenths', idx: 5 },
      { name: 'Hundredths', idx: 6 },
      { name: 'Thousandths', idx: 7 }
    ];

    const targetPlace = places[Math.floor(Math.random() * places.length)];
    const targetDigit = numStr[targetPlace.idx];

    return {
      type: 'place_value', // UNDERSCORE KEY
      numStr: numStr,
      targetPlaceName: targetPlace.name,
      targetIdx: targetPlace.idx,
      targetDigit: targetDigit,
      prompt: `Tap the digit in the <strong>${targetPlace.name}</strong> place in <strong>${numStr}</strong>:`,
      explanation: `In <strong>${numStr}</strong>, the digit in the <strong>${targetPlace.name}</strong> position is <strong>${targetDigit}</strong>.`
    };
  },

  render(q, container) {
    let digitsHtml = '';
    for (let i = 0; i < q.numStr.length; i++) {
      const char = q.numStr[i];
      if (char === '.') {
        digitsHtml += `<span style="font-size: 2.2rem; font-weight: 800; margin: 0 2px; align-self: flex-end;">.</span>`;
      } else {
        digitsHtml += `
          <button class="pv-digit-btn" data-idx="${i}" style="
            font-size: 1.8rem;
            font-weight: 800;
            width: 48px;
            height: 58px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            background: var(--bg-card);
            color: var(--text-main);
            cursor: pointer;
            transition: all 0.15s ease;
          ">${char}</button>
        `;
      }
    }

    const html = `
      <div style="max-width: 450px; margin: 0 auto; text-align: center; user-select: none;">
        <div style="display: flex; justify-content: center; align-items: center; gap: 6px; margin: 20px 0;">
          ${digitsHtml}
        </div>
      </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll('.pv-digit-btn').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.pv-digit-btn').forEach(b => {
          b.style.borderColor = 'var(--border-color)';
          b.style.background = 'var(--bg-card)';
          b.style.color = 'var(--text-main)';
          b.classList.remove('selected');
        });

        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.classList.add('selected');
      };
    });
  },

  evaluate(q) {
    const selectedBtn = document.querySelector('.pv-digit-btn.selected');
    if (!selectedBtn) return false;

    const selectedIdx = parseInt(selectedBtn.getAttribute('data-idx'), 10);
    return selectedIdx === q.targetIdx;
  }
};

registerQuestionType('place_value', placeValueModule);
