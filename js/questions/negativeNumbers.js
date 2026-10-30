import { registerQuestionType, formatMath } from './registry.js';

const negativeNumbersModule = {
  generate() {
    const questionPool = [
      {
        type: 'change',
        start: -4,
        change: 7,
        unit: '°C',
        prompt: 'The temperature starts at <strong>-4°C</strong> and rises by <strong>7°C</strong>. Drag the marker to the new temperature:',
        target: 3,
        exp: 'Starting at -4 and rising by 7 means -4 + 7 = 3°C.'
      },
      {
        type: 'change',
        start: 2,
        change: -6,
        unit: '°C',
        prompt: 'The temperature starts at <strong>2°C</strong> and drops by <strong>6°C</strong>. Place the marker at the final temperature:',
        target: -4,
        exp: 'Starting at 2 and dropping by 6 means 2 - 6 = -4°C.'
      },
      {
        type: 'elevation',
        start: -8,
        change: 5,
        unit: 'm',
        prompt: 'A submarine at <strong>-8 m</strong> below sea level climbs <strong>5 m</strong>. Set the marker to its new depth:',
        target: -3,
        exp: 'Climbing 5 m from -8 m brings the submarine to -8 + 5 = -3 m.'
      },
      {
        type: 'elevation',
        start: -2,
        change: -5,
        unit: 'm',
        prompt: 'A diver at <strong>-2 m</strong> descends another <strong>5 m</strong> deeper. Set the marker to the new position:',
        target: -7,
        exp: 'Going 5 m deeper from -2 m means -2 - 5 = -7 m.'
      }
    ];

    const q = questionPool[Math.floor(Math.random() * questionPool.length)];

    return {
      type: 'negative_numbers',
      prompt: formatMath(q.prompt),
      start: q.start,
      target: q.target,
      unit: q.unit,
      explanation: formatMath(q.exp)
    };
  },

  render(q, container) {
    const minVal = -10;
    const maxVal = 10;
    const totalTicks = maxVal - minVal;

    let ticksHtml = '';
    for (let v = maxVal; v >= minVal; v--) {
      const isZero = v === 0;
      const tickClass = isZero ? 'color: var(--accent); font-weight: 800;' : 'color: var(--text-muted);';
      const label = v > 0 ? `+${v}` : `${v}`;

      ticksHtml += `
        <div style="display: flex; align-items: center; height: 24px; position: relative;">
          <span style="width: 45px; text-align: right; padding-right: 10px; font-size: 0.85rem; ${tickClass}">${label}</span>
          <div style="width: ${isZero ? '24px' : '12px'}; height: ${isZero ? '3px' : '2px'}; background: ${isZero ? 'var(--accent)' : 'var(--border-color)'};"></div>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; gap: 30px; margin: 20px 0;">
        <!-- Vertical Line & Ticks Container -->
        <div style="display: flex; align-items: center; position: relative; padding: 10px 0;">
          <div style="display: flex; flex-direction: column; justify-content: space-between; height: 504px;">
            ${ticksHtml}
          </div>
          
          <!-- Central Vertical Axis Bar -->
          <div style="position: absolute; left: 55px; top: 22px; width: 6px; height: 480px; background: var(--border-color); border-radius: 3px;"></div>

          <!-- Vertical Range Slider -->
          <input type="range" id="negSlider" min="${minVal}" max="${maxVal}" value="${q.start}" step="1" style="
            position: absolute;
            left: -183px;
            top: 250px;
            width: 480px;
            height: 10px;
            transform: rotate(-90deg);
            cursor: pointer;
            background: transparent;
            -webkit-appearance: none;
            touch-action: none;
          ">
        </div>

        <!-- Live Readout Box -->
        <div style="
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius);
          padding: 20px;
          text-align: center;
          min-width: 140px;
        ">
          <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Selected Value</p>
          <p id="negValDisplay" style="font-size: 2.2rem; font-weight: 800; color: var(--accent); margin-top: 6px;">
            ${q.start} ${q.unit}
          </p>
        </div>
      </div>
    `;

    const slider = container.querySelector('#negSlider');
    const display = container.querySelector('#negValDisplay');

    slider.oninput = () => {
      display.innerText = `${slider.value} ${q.unit}`;
    };
  },

  evaluate(q) {
    const slider = document.getElementById('negSlider');
    if (!slider) return false;
    return parseInt(slider.value, 10) === q.target;
  }
};

registerQuestionType('negative_numbers', negativeNumbersModule);
