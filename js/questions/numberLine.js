import { registerQuestionType, formatMath } from './registry.js';

const numberLineModule = {
  generate() {
    const templates = [
      // Quarters (Step: 0.25)
      { label: '3/4', val: 0.75, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1], exp: '3/4 is 3 parts out of 4 equal divisions (at 0.75).' },
      { label: '1/4', val: 0.25, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1], exp: '1/4 is the first mark after 0 on a 4-part line (0.25).' },

      // Tenths & Fifths (Step: 0.1 or 0.2)
      { label: '0.8', val: 0.8, step: 0.1, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], exp: '0.8 is located 8 tenths along the line (or 4/5).' },
      { label: '0.3', val: 0.3, step: 0.1, ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], displayTicks: [0, 0.5, 1], exp: '0.3 is 3 marks past 0 on a 10-part line.' },
      { label: '2/5', val: 0.4, step: 0.2, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], exp: '2/5 equals 4/10 or 0.4 on the line.' },
      { label: '60%', val: 0.6, step: 0.2, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], exp: '60% is equal to 0.6 or 3/5.' },

      // Thirds (Step: 1/3)
      { label: '1/3', val: 1/3, step: 1/3, ticks: [0, 1/3, 2/3, 1], tickLabels: ['0', '1/3', '2/3', '1'], exp: '1/3 is the first division mark when split into 3 equal parts.' },
      { label: '2/3', val: 2/3, step: 1/3, ticks: [0, 1/3, 2/3, 1], tickLabels: ['0', '1/3', '2/3', '1'], exp: '2/3 is the second mark on a line cut into 3 equal parts.' }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    return {
      type: 'number_line',
      prompt: `Drag the slider to place <strong>${formatMath(t.label)}</strong> on the number line:`,
      targetVal: t.val,
      step: t.step,
      ticks: t.ticks,
      tickLabels: t.tickLabels || null,
      explanation: formatMath(t.exp)
    };
  },

  render(q, container) {
    // Generate tick line marks and labels
    let tickMarksHtml = '';
    let tickLabelsHtml = '';

    q.ticks.forEach((tickVal, idx) => {
      const posPct = (tickVal * 100).toFixed(2);
      
      // Vertical tick mark line
      tickMarksHtml += `<div style="position: absolute; left: ${posPct}%; top: -6px; width: 2px; height: 20px; background: var(--text-muted); transform: translateX(-50%);"></div>`;

      // Label text underneath
      let labelText = '';
      if (q.tickLabels && q.tickLabels[idx]) {
        labelText = formatMath(q.tickLabels[idx]);
      } else {
        labelText = tickVal % 1 === 0 ? tickVal.toFixed(0) : tickVal.toFixed(2).replace(/\.?0+$/, '');
      }

      tickLabelsHtml += `<span style="position: absolute; left: ${posPct}%; transform: translateX(-50%); font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">${labelText}</span>`;
    });

    container.innerHTML = `
      <div style="padding: 20px 10px 40px 10px; max-width: 500px; margin: 0 auto;">
        <div class="nl-container" style="position: relative; margin: 30px 0;">
          <!-- Horizontal Line -->
          <div class="nl-line" style="width: 100%; height: 8px; background: var(--border-color); border-radius: 4px; position: relative;">
            ${tickMarksHtml}
          </div>
          
          <!-- Tick Labels Container -->
          <div style="position: relative; width: 100%; height: 24px; margin-top: 12px;">
            ${tickLabelsHtml}
          </div>

          <!-- Slider Range Control -->
          <input type="range" min="0" max="1" step="${q.step}" value="0" class="nl-slider" id="nlSlider" style="position: absolute; top: 0; left: 0; width: 100%; height: 8px; margin: 0; cursor: pointer; opacity: 0.9;">
        </div>
      </div>
    `;
  },

  evaluate(q) {
    const slider = document.getElementById('nlSlider');
    if (!slider) return false;
    const userVal = parseFloat(slider.value);
    return Math.abs(userVal - q.targetVal) < 0.02;
  }
};

registerQuestionType('number_line', numberLineModule);
