import { registerQuestionType } from './registry.js';

// Renders 1 single shape cut into equal contiguous parts
function createSingleShapeSVG(numerator, denominator) {
  const width = 200;
  const height = 54;
  const sliceWidth = width / denominator;
  
  let rects = '';
  for (let i = 0; i < denominator; i++) {
    const x = i * sliceWidth;
    const isShaded = i < numerator;
    const fill = isShaded ? 'var(--accent, #4f46e5)' : 'var(--bg-primary, #ffffff)';
    rects += `<rect x="${x}" y="0" width="${sliceWidth}" height="${height}" fill="${fill}" stroke="var(--text-main, #1e293b)" stroke-width="2"/>`;
  }

  return `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="border-radius: 6px; overflow: hidden; display: block;">
        ${rects}
      </svg>
      <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">${numerator} of ${denominator} equal parts shaded</span>
    </div>
  `;
}

// Renders inline HTML fraction stack without LaTeX reliance
function renderHtmlFraction(num, den, fontSize = '1.6rem') {
  return `
    <div style="
      display: inline-flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      font-size: ${fontSize}; 
      font-weight: 800; 
      line-height: 1.1; 
      vertical-align: middle;
      padding: 0 4px;
    ">
      <span style="border-bottom: 2.5px solid var(--text-main, #1e293b); padding: 0 6px; width: 100%; text-align: center;">${num}</span>
      <span style="padding: 0 6px; width: 100%; text-align: center;">${den}</span>
    </div>
  `;
}

function renderRepresentation(type, num, den) {
  const val = num / den;
  if (type === 'area_model') {
    return createSingleShapeSVG(num, den);
  } else if (type === 'fraction') {
    return renderHtmlFraction(num, den, '1.6rem');
  } else if (type === 'decimal') {
    return `<span style="font-size: 1.6rem; font-weight: 800;">${val}</span>`;
  } else if (type === 'percent') {
    return `<span style="font-size: 1.6rem; font-weight: 800;">${Math.round(val * 100)}%</span>`;
  }
}

const equivalenceModule = {
  generate() {
    const fractionPool = [
      { num: 1, den: 2 },
      { num: 1, den: 4 },
      { num: 3, den: 4 },
      { num: 1, den: 5 },
      { num: 2, den: 5 },
      { num: 3, den: 5 },
      { num: 4, den: 5 },
      { num: 1, den: 10 },
      { num: 3, den: 10 },
      { num: 7, den: 10 },
      { num: 9, den: 10 }
    ];

    // 1. Pick target fraction
    const targetFrac = fractionPool[Math.floor(Math.random() * fractionPool.length)];
    const repTypes = ['area_model', 'fraction', 'decimal', 'percent'];

    // 2. Pick target and correct representation formats
    const targetTypeIdx = Math.floor(Math.random() * repTypes.length);
    const targetType = repTypes[targetTypeIdx];

    const remainingTypes = repTypes.filter(t => t !== targetType);
    const correctType = remainingTypes[Math.floor(Math.random() * remainingTypes.length)];

    // 3. Generate correct option card
    const correctOption = {
      html: renderRepresentation(correctType, targetFrac.num, targetFrac.den),
      isCorrect: true
    };

    // 4. Generate 3 distinct distractors from other fractions
    const otherFractions = fractionPool.filter(f => (f.num / f.den) !== (targetFrac.num / targetFrac.den));
    const shuffledOthers = [...otherFractions].sort(() => Math.random() - 0.5).slice(0, 3);

    const distractors = shuffledOthers.map(f => {
      const distractorType = repTypes[Math.floor(Math.random() * repTypes.length)];
      return {
        html: renderRepresentation(distractorType, f.num, f.den),
        isCorrect: false
      };
    });

    // 5. Combine and shuffle option cards
    const options = [correctOption, ...distractors].sort(() => Math.random() - 0.5);

    const val = targetFrac.num / targetFrac.den;
    const targetHTML = renderRepresentation(targetType, targetFrac.num, targetFrac.den);
    const inlineFracHtml = renderHtmlFraction(targetFrac.num, targetFrac.den, '1rem');

    return {
      type: 'equivalence',
      targetHTML: targetHTML,
      options: options,
      targetFrac: targetFrac,
      prompt: `Select the representation below that is <strong>equivalent</strong> to the target:`,
      explanation: `The target represents ${inlineFracHtml} (which is <strong>${val}</strong> or <strong>${Math.round(val * 100)}%</strong>).`
    };
  },

  render(q, container) {
    let optionsHtml = '';
    q.options.forEach((opt, idx) => {
      optionsHtml += `
        <div class="eq-option-card" data-correct="${opt.isCorrect}" data-idx="${idx}" style="
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: var(--radius);
          padding: 18px 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          min-height: 90px;
          transition: all 0.15s ease;
          touch-action: manipulation;
        ">
          ${opt.html}
        </div>
      `;
    });

    const html = `
      <div style="max-width: 520px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- TARGET CARD DISPLAY -->
        <div style="
          background: var(--bg-primary);
          border: 2px solid var(--accent);
          border-radius: var(--radius);
          padding: 16px;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.12);
        ">
          <span style="font-size: 0.8rem; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Target</span>
          ${q.targetHTML}
        </div>

        <!-- 2x2 SELECTION OPTIONS GRID -->
        <div style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        ">
          ${optionsHtml}
        </div>

      </div>
    `;

    container.innerHTML = html;

    // CARD SELECTION EVENT HANDLERS
    const cards = container.querySelectorAll('.eq-option-card');
    cards.forEach(card => {
      card.onclick = () => {
        cards.forEach(c => {
          c.style.borderColor = 'var(--border-color)';
          c.style.background = 'var(--bg-card)';
          c.classList.remove('selected');
        });

        card.style.borderColor = 'var(--accent)';
        card.style.background = 'rgba(79, 70, 229, 0.08)';
        card.classList.add('selected');
      };
    });
  },

  evaluate(q) {
    const selectedCard = document.querySelector('.eq-option-card.selected');
    if (!selectedCard) return false;

    return selectedCard.getAttribute('data-correct') === 'true';
  }
};

registerQuestionType('equivalence', equivalenceModule);
