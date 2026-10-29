import { registerQuestionType, formatMath } from './registry.js';

const numberLineModule = {
  generate() {
    const targets = [
      { label: '3/8', val: 0.375, exp: '3/8 is slightly less than 4/8 (which is 0.5).' },
      { label: '0.65', val: 0.65, exp: '0.65 is halfway between 0.6 and 0.7.' },
      { label: '75%', val: 0.75, exp: '75% is equivalent to 3/4 or 0.75.' },
      { label: '2/5', val: 0.40, exp: '2/5 is equal to 4/10 or 0.40.' }
    ];
    const t = targets[Math.floor(Math.random() * targets.length)];
    return {
      type: 'number_line',
      prompt: `Drag slider to place <strong>${formatMath(t.label)}</strong> on the number line:`,
      targetVal: t.val,
      explanation: formatMath(t.exp)
    };
  },

  render(q, container) {
    container.innerHTML = `
      <div class="nl-container">
        <div class="nl-line"></div>
        <div class="nl-ticks"><span>0</span><span>0.5</span><span>1.0</span></div>
        <input type="range" min="0" max="1" step="0.01" value="0.5" class="nl-slider" id="nlSlider">
      </div>
      <p style="text-align: center; font-weight: 700; color: var(--accent);">
        Your Selection: <span id="nlVal">0.50</span>
      </p>
    `;
    const slider = document.getElementById('nlSlider');
    slider.oninput = () => {
      document.getElementById('nlVal').innerText = parseFloat(slider.value).toFixed(2);
    };
  },

  evaluate(q) {
    const userVal = parseFloat(document.getElementById('nlSlider').value);
    return Math.abs(userVal - q.targetVal) <= 0.06;
  }
};

registerQuestionType('number_line', numberLineModule);
