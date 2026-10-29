import { registerQuestionType, formatMath } from './registry.js';

// SVG Diagram Generators for Cards & Prompts
function makeSquareSVG(ratio, parts = 5) {
  const shaded = Math.round(parts * ratio);
  let rows = 1, cols = parts;
  if (parts === 4) { rows = 2; cols = 2; }
  else if (parts === 10) { rows = 2; cols = 5; }

  let svg = `<svg viewBox="0 0 100 100" width="70" height="70" style="display:block; margin:0 auto; pointer-events:none;">`;
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isShaded = idx < shaded;
      const fill = isShaded ? 'var(--accent)' : 'var(--bg-card)';
      svg += `<rect x="${c * cellW + 2}" y="${r * cellH + 2}" width="${cellW - 4}" height="${cellH - 4}" rx="3" fill="${fill}" stroke="var(--border-color)" stroke-width="2"/>`;
      idx++;
    }
  }
  svg += `</svg>`;
  return svg;
}

function makeCircleSVG(ratio, parts = 5) {
  const shaded = Math.round(parts * ratio);
  const cx = 50, cy = 50, r = 44;
  let svg = `<svg viewBox="0 0 100 100" width="70" height="70" style="display:block; margin:0 auto; pointer-events:none;">`;
  const angleStep = (2 * Math.PI) / parts;

  for (let i = 0; i < parts; i++) {
    const startAngle = i * angleStep - Math.PI / 2;
    const endAngle = (i + 1) * angleStep - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angleStep > Math.PI ? 1 : 0;
    const isShaded = i < shaded;
    const fill = isShaded ? 'var(--accent)' : 'var(--bg-card)';

    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    svg += `<path d="${d}" fill="${fill}" stroke="var(--border-color)" stroke-width="2"/>`;
  }
  svg += `</svg>`;
  return svg;
}

const equivalenceModule = {
  generate() {
    const dataset = [
      {
        ratio: 0.2,
        correct: [
          { type: 'text', val: '1/5' },
          { type: 'text', val: '0.2' },
          { type: 'text', val: '20%' },
          { type: 'svg', val: makeSquareSVG(0.2, 5) },
          { type: 'svg', val: makeCircleSVG(0.2, 5) }
        ],
        distractors: [
          { type: 'text', val: '1/4' },
          { type: 'text', val: '0.25' },
          { type: 'text', val: '2%' },
          { type: 'text', val: '1/2' },
          { type: 'svg', val: makeSquareSVG(0.4, 5) },
          { type: 'svg', val: makeCircleSVG(0.25, 4) }
        ],
        exp: '0.2 is equal to 1/5, 20%, or 1 shaded part out of 5.'
      },
      {
        ratio: 0.25,
        correct: [
          { type: 'text', val: '1/4' },
          { type: 'text', val: '0.25' },
          { type: 'text', val: '25%' },
          { type: 'svg', val: makeSquareSVG(0.25, 4) },
          { type: 'svg', val: makeCircleSVG(0.25, 4) }
        ],
        distractors: [
          { type: 'text', val: '1/5' },
          { type: 'text', val: '0.5' },
          { type: 'text', val: '2.5%' },
          { type: 'text', val: '2/5' },
          { type: 'svg', val: makeSquareSVG(0.5, 4) },
          { type: 'svg', val: makeCircleSVG(0.2, 5) }
        ],
        exp: '0.25 is equal to 1/4, 25%, or 1 shaded part out of 4.'
      },
      {
        ratio: 0.5,
        correct: [
          { type: 'text', val: '1/2' },
          { type: 'text', val: '0.5' },
          { type: 'text', val: '50%' },
          { type: 'svg', val: makeSquareSVG(0.5, 4) },
          { type: 'svg', val: makeCircleSVG(0.5, 4) }
        ],
        distractors: [
          { type: 'text', val: '1/5' },
          { type: 'text', val: '0.05' },
          { type: 'text', val: '5%' },
          { type: 'text', val: '2/3' },
          { type: 'svg', val: makeSquareSVG(0.25, 4) },
          { type: 'svg', val: makeCircleSVG(0.2, 5) }
        ],
        exp: '0.5 represents half of a whole (1/2, 50%, or 2 out of 4 parts).'
      },
      {
        ratio: 0.75,
        correct: [
          { type: 'text', val: '3/4' },
          { type: 'text', val: '0.75' },
          { type: 'text', val: '75%' },
          { type: 'svg', val: makeSquareSVG(0.75, 4) },
          { type: 'svg', val: makeCircleSVG(0.75, 4) }
        ],
        distractors: [
          { type: 'text', val: '2/3' },
          { type: 'text', val: '0.5' },
          { type: 'text', val: '7.5%' },
          { type: 'text', val: '4/5' },
          { type: 'svg', val: makeSquareSVG(0.4, 5) },
          { type: 'svg', val: makeCircleSVG(0.5, 4) }
        ],
        exp: '0.75 is equal to 3/4, 75%, or 3 shaded parts out of 4.'
      },
      {
        ratio: 0.4,
        correct: [
          { type: 'text', val: '2/5' },
          { type: 'text', val: '0.4' },
          { type: 'text', val: '40%' },
          { type: 'svg', val: makeSquareSVG(0.4, 5) },
          { type: 'svg', val: makeCircleSVG(0.4, 5) }
        ],
        distractors: [
          { type: 'text', val: '1/4' },
          { type: 'text', val: '0.04' },
          { type: 'text', val: '4%' },
          { type: 'text', val: '3/5' },
          { type: 'svg', val: makeSquareSVG(0.2, 5) },
          { type: 'svg', val: makeCircleSVG(0.5, 4) }
        ],
        exp: '0.4 is equal to 2/5, 40%, or 2 shaded parts out of 5.'
      }
    ];

    const data = dataset[Math.floor(Math.random() * dataset.length)];
    const promptItem = data.correct[Math.floor(Math.random() * data.correct.length)];

    const remainingCorrect = data.correct.filter(item => item !== promptItem);
    const selectedCorrect = remainingCorrect.sort(() => 0.5 - Math.random()).slice(0, 3);
    const selectedDistractors = data.distractors.sort(() => 0.5 - Math.random()).slice(0, 3);

    const allCards = [
      ...selectedCorrect.map(c => ({ ...c, isCorrect: true })),
      ...selectedDistractors.map(d => ({ ...d, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    return {
      type: 'equivalence',
      prompt: '', // Fixed: Prevents 'undefined' header in app.js
      promptItem: promptItem,
      cards: allCards,
      explanation: formatMath(data.exp)
    };
  },

  render(q, container) {
    let promptHtml = '';
    if (q.promptItem.type === 'svg') {
      promptHtml = `<div style="display:inline-block; vertical-align:middle; margin-left:10px;">${q.promptItem.val}</div>`;
    } else {
      promptHtml = `<span style="font-size: 1.6rem; color: var(--accent); margin-left: 8px;">${formatMath(q.promptItem.val)}</span>`;
    }

    let html = `
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="font-size: 1.1rem; font-weight: 600;">
          Tap <strong>ALL</strong> representations equivalent to:
        </p>
        <div style="display: inline-flex; align-items: center; justify-content: center; background: var(--bg-primary); padding: 12px 24px; border-radius: 12px; border: 2px solid var(--accent); margin-top: 10px;">
          ${promptHtml}
        </div>
      </div>

      <div class="eq-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0;">
    `;

    q.cards.forEach((card, idx) => {
      const content = card.type === 'svg' ? card.val : formatMath(card.val);
      html += `
        <div class="eq-card" data-idx="${idx}" style="
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius);
          padding: 16px 8px;
          min-height: 95px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          font-weight: 700;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          transition: all 0.15s ease;
        ">
          ${content}
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.eq-card').forEach(cardEl => {
      cardEl.onclick = () => {
        cardEl.classList.toggle('selected');
        if (cardEl.classList.contains('selected')) {
          cardEl.style.borderColor = 'var(--accent)';
          cardEl.style.background = 'rgba(79, 70, 229, 0.12)';
        } else {
          cardEl.style.borderColor = 'var(--border-color)';
          cardEl.style.background = 'var(--bg-primary)';
        }
      };
    });
  },

  evaluate(q) {
    const selectedCards = document.querySelectorAll('.eq-card.selected');
    const totalCorrectInSet = q.cards.filter(c => c.isCorrect).length;

    let correctSelectedCount = 0;
    let incorrectSelectedCount = 0;

    selectedCards.forEach(cardEl => {
      const idx = parseInt(cardEl.getAttribute('data-idx'));
      if (q.cards[idx].isCorrect) {
        correctSelectedCount++;
      } else {
        incorrectSelectedCount++;
      }
    });

    return (correctSelectedCount === totalCorrectInSet && incorrectSelectedCount === 0);
  }
};

registerQuestionType('equivalence', equivalenceModule);
