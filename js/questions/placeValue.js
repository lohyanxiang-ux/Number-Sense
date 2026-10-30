import { registerQuestionType } from './registry.js';

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const placeValueModule = {
  generate() {
    // Mode 0: Place Value Name (Thousands, Tens, Tenths, etc.)
    // Mode 1: Decimal Place (1st decimal place, 2nd decimal place, etc.)
    // Mode 2: Significant Figure (1st sig fig, 2nd sig fig, etc.)
    const mode = Math.floor(Math.random() * 3);

    if (mode === 0) {
      // --- MODE 0: TRADITIONAL PLACE VALUE NAMES ---
      const whole = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
      const dec = Math.floor(Math.random() * 900) + 100; // 100-999
      const numStr = `${whole}.${dec}`;

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
        type: 'place_value',
        numStr: numStr,
        targetIdx: targetPlace.idx,
        targetDigit: targetDigit,
        userSelectedIdx: null,
        prompt: `Tap the digit in the <strong>${targetPlace.name}</strong> place in <strong>${numStr}</strong>:`,
        explanation: `In <strong>${numStr}</strong>, the digit in the <strong>${targetPlace.name}</strong> place is <strong>${targetDigit}</strong>.`
      };

    } else if (mode === 1) {
      // --- MODE 1: DECIMAL PLACES ---
      const whole = Math.floor(Math.random() * 50);
      const decCount = Math.floor(Math.random() * 3) + 4; // 4 to 6 decimal places
      let decStr = '';
      for (let i = 0; i < decCount; i++) {
        decStr += Math.floor(Math.random() * 10);
      }
      const numStr = `${whole}.${decStr}`;
      const dotIdx = numStr.indexOf('.');

      const targetDp = Math.floor(Math.random() * decCount) + 1; // 1 to decCount
      const targetIdx = dotIdx + targetDp;
      const targetDigit = numStr[targetIdx];
      const ordinal = getOrdinal(targetDp);

      return {
        type: 'place_value',
        numStr: numStr,
        targetIdx: targetIdx,
        targetDigit: targetDigit,
        userSelectedIdx: null,
        prompt: `Tap the digit in the <strong>${ordinal} decimal place</strong> in <strong>${numStr}</strong>:`,
        explanation: `In <strong>${numStr}</strong>, the <strong>${ordinal} decimal place</strong> is the ${ordinal} digit after the decimal point, which is <strong>${targetDigit}</strong>.`
      };

    } else {
      // --- MODE 2: SIGNIFICANT FIGURES / VALUES ---
      const zeroCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 leading zeros after point
      let zeros = '';
      for (let i = 0; i < zeroCount; i++) zeros += '0';

      const firstSigDigit = Math.floor(Math.random() * 9) + 1; // 1-9
      let remainingDigits = '';
      for (let i = 0; i < 3; i++) {
        remainingDigits += Math.floor(Math.random() * 10);
      }

      const isLeadingZeroType = Math.random() < 0.6;
      let numStr = '';

      if (isLeadingZeroType) {
        numStr = `0.${zeros}${firstSigDigit}${remainingDigits}`;
      } else {
        const whole = Math.floor(Math.random() * 90) + 10;
        numStr = `${whole}.${remainingDigits}`;
      }

      // Identify all valid significant figure indices
      const sigFigIndices = [];
      let foundFirstNonZero = false;

      for (let i = 0; i < numStr.length; i++) {
        const char = numStr[i];
        if (char === '.') continue;
        if (!foundFirstNonZero) {
          if (char !== '0') {
            foundFirstNonZero = true;
            sigFigIndices.push(i);
          }
        } else {
          sigFigIndices.push(i);
        }
      }

      const targetSigCount = Math.floor(Math.random() * Math.min(4, sigFigIndices.length)) + 1;
      const targetIdx = sigFigIndices[targetSigCount - 1];
      const targetDigit = numStr[targetIdx];
      const ordinal = getOrdinal(targetSigCount);
      const firstNonZeroChar = numStr[sigFigIndices[0]];

      return {
        type: 'place_value',
        numStr: numStr,
        targetIdx: targetIdx,
        targetDigit: targetDigit,
        userSelectedIdx: null,
        prompt: `Tap the <strong>${ordinal} significant figure</strong> in <strong>${numStr}</strong>:`,
        explanation: `In <strong>${numStr}</strong>, the first non-zero digit is <strong>${firstNonZeroChar}</strong>. Counting from there, the <strong>${ordinal} significant figure</strong> is <strong>${targetDigit}</strong>.`
      };
    }
  },

  render(q, container) {
    q.userSelectedIdx = null;

    let digitsHtml = '';
    for (let i = 0; i < q.numStr.length; i++) {
      const char = q.numStr[i];
      if (char === '.') {
        digitsHtml += `<span style="font-size: 2.2rem; font-weight: 800; margin: 0 2px; align-self: flex-end; color: var(--text-main);">.</span>`;
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
            touch-action: manipulation;
            transition: all 0.15s ease;
          ">${char}</button>
        `;
      }
    }

    const html = `
      <div style="max-width: 520px; margin: 0 auto; text-align: center; user-select: none;">
        <div style="display: flex; justify-content: center; align-items: center; gap: 6px; margin: 20px 0; flex-wrap: wrap;">
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

        q.userSelectedIdx = parseInt(btn.getAttribute('data-idx'), 10);
      };
    });
  },

  evaluate(q) {
    if (q.userSelectedIdx !== null && q.userSelectedIdx !== undefined) {
      return q.userSelectedIdx === q.targetIdx;
    }
    const selectedBtn = document.querySelector('.pv-digit-btn.selected');
    if (!selectedBtn) return false;

    const selectedIdx = parseInt(selectedBtn.getAttribute('data-idx'), 10);
    return selectedIdx === q.targetIdx;
  }
};

registerQuestionType('place_value', placeValueModule);
