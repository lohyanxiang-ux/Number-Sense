import { registerQuestionType, formatMath } from './registry.js';

const placeValueModule = {
  generate() {
    const questionPool = [
      // Decimals (Tenths, Hundredths, Thousandths)
      {
        numStr: '4582.391',
        digits: ['4', '5', '8', '2', '.', '3', '9', '1'],
        prompt: 'Tap the digit in the <strong>hundredths</strong> place:',
        targetIdx: 6, // '9'
        exp: 'In 4582.391, 3 is in tenths (0.3), 9 is in hundredths (0.09), and 1 is in thousandths (0.001).'
      },
      {
        numStr: '703.452',
        digits: ['7', '0', '3', '.', '4', '5', '2'],
        prompt: 'Tap the digit that has a value of <strong>0.05</strong>:',
        targetIdx: 5, // '5'
        exp: 'The digit 5 is in the hundredths place, giving it a value of 5 hundredths (0.05).'
      },
      {
        numStr: '12.608',
        digits: ['1', '2', '.', '6', '0', '8'],
        prompt: 'Tap the digit in the <strong>thousandths</strong> place:',
        targetIdx: 5, // '8'
        exp: 'In 12.608, 6 is in tenths, 0 is in hundredths, and 8 is in thousandths.'
      },

      // Whole Numbers (Thousands, Hundreds, Tens, Ones)
      {
        numStr: '6492.15',
        digits: ['6', '4', '9', '2', '.', '1', '5'],
        prompt: 'Tap the digit that has a value of <strong>400</strong>:',
        targetIdx: 1, // '4'
        exp: 'The digit 4 is in the hundreds place, so its value is 4 x 100 = 400.'
      },
      {
        numStr: '8051.37',
        digits: ['8', '0', '5', '1', '.', '3', '7'],
        prompt: 'Tap the digit in the <strong>tens</strong> place:',
        targetIdx: 2, // '5'
        exp: 'In 8051.37, 8 is thousands, 0 is hundreds, 5 is tens, and 1 is ones.'
      }
    ];

    const q = questionPool[Math.floor(Math.random() * questionPool.length)];

    return {
      type: 'place_value',
      prompt: q.prompt,
      numStr: q.numStr,
      digits: q.digits,
      targetIdx: q.targetIdx,
      explanation: formatMath(q.exp)
    };
  },

  render(q, container) {
    let html = `
      <div style="text-align: center; margin: 24px 0;">
        <div class="pv-digit-row" style="
          display: inline-flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 16px 24px;
          border-radius: var(--radius);
          border: 2px solid var(--border-color);
        ">
    `;

    q.digits.forEach((char, idx) => {
      if (char === '.') {
        html += `
          <span style="
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--accent);
            padding: 0 4px;
            user-select: none;
          ">.</span>
        `;
      } else {
        html += `
          <button class="pv-digit-card" data-idx="${idx}" style="
            background: var(--bg-card);
            border: 2px solid var(--border-color);
            border-radius: 10px;
            width: 48px;
            height: 60px;
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--text-main);
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
            -webkit-user-select: none;
          ">${char}</button>
        `;
      }
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Single Selection Event Handler
    container.querySelectorAll('.pv-digit-card').forEach(card => {
      card.onclick = () => {
        container.querySelectorAll('.pv-digit-card').forEach(c => {
          c.style.borderColor = 'var(--border-color)';
          c.style.background = 'var(--bg-card)';
          c.style.color = 'var(--text-main)';
          c.classList.remove('selected');
        });

        card.style.borderColor = 'var(--accent)';
        card.style.background = 'var(--accent)';
        card.style.color = 'white';
        card.classList.add('selected');
      };
    });
  },

  evaluate(q) {
    const selected = document.querySelector('.pv-digit-card.selected');
    if (!selected) return false;
    const selectedIdx = parseInt(selected.getAttribute('data-idx'));
    return selectedIdx === q.targetIdx;
  }
};

registerQuestionType('place_value', placeValueModule);
