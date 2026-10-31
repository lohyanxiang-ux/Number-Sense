import { registerQuestionType, formatMath } from './registry.js';

const numberLineModule = {
  generate() {
    const templates = [
      // Quarters (4 divisions -> ticks at 0, 0.25, 0.5, 0.75, 1)
      { label: '3/4', val: 0.75, ticks: [0, 0.25, 0.5, 0.75, 1], exp: '3/4 is 3 parts out of 4 equal divisions (at 0.75).' },
      { label: '1/4', val: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1], exp: '1/4 is the first mark after 0 on a 4-part line (0.25).' },

      // Fifths / Decimals (5 divisions -> ticks at 0, 0.2, 0.4, 0.6, 0.8, 1)
      { label: '0.8', val: 0.8, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], exp: '0.8 is located at the 4th tick mark past 0 (4/5 or 0.8).' },
      { label: '2/5', val: 0.4, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], exp: '2/5 equals 4/10 or 0.4 on the line.' },
      { label: '60%', val: 0.6, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], exp: '60% is equal to 0.6 or 3/5.' },

      // Tenths (10 divisions -> ticks at every 0.1)
      { label: '0.3', val: 0.3, ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], exp: '0.3 is 3 marks past 0 on a 10-part line.' },

      // Thirds (3 divisions -> ticks at 0, 1/3, 2/3, 1)
      { label: '1/3', val: 1/3, ticks: [0, 1/3, 2/3, 1], tickLabels: ['0', '1/3', '2/3', '1'], exp: '1/3 is the first division mark when split into 3 equal parts.' },
      { label: '2/3', val: 2/3, ticks: [0, 1/3, 2/3, 1], tickLabels: ['0', '1/3', '2/3', '1'], exp: '2/3 is the second mark on a line cut into 3 equal parts.' }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    return {
      type: 'number_line',
      prompt: `Drag the slider to place <strong>${formatMath(t.label)}</strong> on the number line:`,
      targetVal: t.val,
      ticks: t.ticks,
      tickLabels: t.tickLabels || null,
      explanation: formatMath(t.exp)
    };
  },

  render(q, container) {
    let tickMarksHtml = '';
    let tickLabelsHtml = '';
    const numTicks = q.ticks.length;

    q.ticks.forEach((tickVal, idx) => {
      const posPct = ((idx / (numTicks - 1)) * 100).toFixed(2);
      
      tickMarksHtml += `<div style="position: absolute; left: ${posPct}%; top: -6px; width: 2px; height: 20px; background: var(--text-muted); transform: translateX(-50%);"></div>`;

      let labelText = '';
      if (q.tickLabels && q.tickLabels[idx]) {
        labelText = formatMath(q.tickLabels[idx]);
      } else {
        labelText = tickVal % 1 === 0 ? tickVal.toFixed(0) : tickVal.toFixed(2).replace(/\.?0+$/, '');
      }

      tickLabelsHtml += `<span style="position: absolute; left: ${posPct}%; transform: translateX(-50%); font-weight: 600; font-size: 0.85rem; color: var(--text-muted);">${labelText}</span>`;
    });

    const html = `
      <div class="ipad-responsive-grid" style="user-select: none;">
        
        <!-- LEFT COLUMN: NUMBER LINE TRACK -->
        <div class="ipad-left-pane">
          <div style="padding: 10px 10px 20px 10px;">
            <div class="nl-container">
              <div class="nl-line">
                ${tickMarksHtml}
              </div>
              
              <div style="position: relative; width: 100%; height: 24px; margin-top: 12px;">
                ${tickLabelsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: SLIDER CONTROL -->
        <div class="ipad-right-pane" style="text-align: center;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">
            Adjust Slider Position:
          </div>

          <input type="range" min="0" max="${numTicks - 1}" step="1" value="0" class="nl-slider" id="nlSlider" style="width: 100%; cursor: pointer;">
        </div>

      </div>
    `;

    container.innerHTML = html;
  },

  evaluate(q) {
    const slider = document.getElementById('nlSlider');
    if (!slider) return false;
    
    const selectedIndex = parseInt(slider.value, 10);
    const userVal = q.ticks[selectedIndex];
    
    return Math.abs(userVal - q.targetVal) < 0.001;
  }
};

registerQuestionType('number_line', numberLineModule);
