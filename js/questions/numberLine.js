import { registerQuestionType, formatMath } from './registry.js';

const numberLineModule = {
  generate() {
    const questionPool = [
      // ==========================================
      // 1. DECIMALS FROM 0 TO 1 (NO FRACTIONS / PERCENTAGES)
      // ==========================================
      () => {
        // Tenths (0, 0.1, 0.2, ... 1.0)
        const decs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
        const val = decs[Math.floor(Math.random() * decs.length)];
        const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `${val} is located ${Math.round(val * 10)} tick mark(s) past 0 on a decimal line split into tenths.`
        };
      },
      () => {
        // Quarters (0, 0.25, 0.5, 0.75, 1.0)
        const decs = [0.25, 0.5, 0.75];
        const val = decs[Math.floor(Math.random() * decs.length)];
        const ticks = [0, 0.25, 0.5, 0.75, 1.0];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `${val} is located at tick index ${ticks.indexOf(val)} on a 4-part decimal number line.`
        };
      },
      () => {
        // Fifths (0, 0.2, 0.4, 0.6, 0.8, 1.0)
        const decs = [0.2, 0.4, 0.6, 0.8];
        const val = decs[Math.floor(Math.random() * decs.length)];
        const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `${val} is located at tick index ${ticks.indexOf(val)} on a 5-part decimal line.`
        };
      },

      // ==========================================
      // 2. NEGATIVE NUMBERS
      // ==========================================
      () => {
        // Range -5 to 5 (interval 1)
        const possible = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `${val} is located ${Math.abs(val)} unit(s) to the ${val < 0 ? 'left' : 'right'} of 0.`
        };
      },
      () => {
        // Range -10 to 10 (interval 2)
        const possible = [-10, -8, -6, -4, -2, 2, 4, 6, 8, 10];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `${val} is located to the ${val < 0 ? 'left' : 'right'} of 0 on a number line with interval step 2.`
        };
      },
      () => {
        // Range -20 to 20 (interval 5)
        const possible = [-20, -15, -10, -5, 5, 10, 15, 20];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `${val} is located on the number line with step interval 5.`
        };
      },

      // ==========================================
      // 3. NON-UNIT SCALE (INTERVALS 2, 5, 10)
      // ==========================================
      () => {
        // Interval of 2 (e.g. 0 to 20)
        const possible = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `Each tick mark represents 2 units. ${val} is at tick mark ${val / 2}.`
        };
      },
      () => {
        // Interval of 5 (e.g. represent 15)
        const possible = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          exp: `Each tick mark represents 5 units. ${val} is ${val / 5} tick mark(s) away from 0.`
        };
      },
      () => {
        // Interval of 10 with sub-ticks at 5 (e.g. represent 5 or 25 on a 10-interval labeled line)
        const possible = [5, 15, 25, 35, 45, 55];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
        const tickLabels = ticks.map(v => (v % 10 === 0 ? `${v}` : ''));
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          tickLabels: tickLabels,
          exp: `Major labels are every 10 units with tick marks every 5 units. ${val} lies halfway between ${val - 5} and ${val + 5}.`
        };
      }
    ];

    const selectedGen = questionPool[Math.floor(Math.random() * questionPool.length)];
    const t = selectedGen();

    return {
      type: 'number_line',
      prompt: `Drag the marker to place <strong>${formatMath(t.label)}</strong> on the number line:`,
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
      const isMajor = !q.tickLabels || q.tickLabels[idx] !== '';

      tickMarksHtml += `
        <div style="
          position: absolute; 
          left: ${posPct}%; 
          top: ${isMajor ? '-8px' : '-4px'}; 
          width: 2px; 
          height: ${isMajor ? '24px' : '16px'}; 
          background: ${tickVal === 0 ? 'var(--accent)' : 'var(--text-muted)'}; 
          transform: translateX(-50%);
          pointer-events: none;
        "></div>
      `;

      let labelText = '';
      if (q.tickLabels && q.tickLabels[idx] !== undefined) {
        labelText = q.tickLabels[idx];
      } else {
        labelText = tickVal % 1 === 0 ? tickVal.toFixed(0) : tickVal.toFixed(2).replace(/\.?0+$/, '');
      }

      if (labelText !== '') {
        tickLabelsHtml += `
          <span style="
            position: absolute; 
            left: ${posPct}%; 
            transform: translateX(-50%); 
            font-weight: ${tickVal === 0 ? '800' : '600'}; 
            font-size: 0.9rem; 
            color: ${tickVal === 0 ? 'var(--accent)' : 'var(--text-muted)'};
            pointer-events: none;
          ">${labelText}</span>
        `;
      }
    });

    const html = `
      <div style="max-width: 650px; margin: 20px auto; padding: 10px 20px; user-select: none; -webkit-user-select: none;">
        <div style="position: relative; height: 110px; margin: 30px 10px;">
          
          <!-- NUMBER LINE TRACK -->
          <div id="nlTrack" style="
            position: absolute;
            left: 0;
            right: 0;
            height: 8px;
            background: var(--border-color, #cbd5e1);
            border-radius: 4px;
            top: 45px;
            cursor: pointer;
            touch-action: none;
          ">
            ${tickMarksHtml}

            <!-- LARGE DRAGGABLE MARKER PIN -->
            <div id="nlMarker" data-idx="0" style="
              position: absolute;
              top: 50%;
              left: 0%;
              transform: translate(-50%, -50%);
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: var(--accent, #4f46e5);
              border: 4px solid #ffffff;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
              cursor: grab;
              touch-action: none;
              z-index: 10;
              transition: transform 0.1s ease, background 0.15s ease;
            "></div>

            <!-- TICK LABELS ROW BELOW -->
            <div style="position: absolute; top: 28px; left: 0; right: 0; height: 30px; pointer-events: none;">
              ${tickLabelsHtml}
            </div>

          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const track = container.querySelector('#nlTrack');
    const marker = container.querySelector('#nlMarker');

    let isDragging = false;

    const updatePosition = (clientX) => {
      const rect = track.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));

      // Snap to nearest tick index
      const snappedIdx = Math.round(ratio * (numTicks - 1));
      const posPct = ((snappedIdx / (numTicks - 1)) * 100).toFixed(2);

      marker.style.left = `${posPct}%`;
      marker.setAttribute('data-idx', snappedIdx);
    };

    track.onpointerdown = (e) => {
      isDragging = true;
      marker.style.cursor = 'grabbing';
      marker.style.transform = 'translate(-50%, -50%) scale(1.15)';
      track.setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    };

    track.onpointermove = (e) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    track.onpointerup = (e) => {
      if (isDragging) {
        isDragging = false;
        marker.style.cursor = 'grab';
        marker.style.transform = 'translate(-50%, -50%) scale(1)';
        track.releasePointerCapture(e.pointerId);
      }
    };

    track.onpointercancel = (e) => {
      if (isDragging) {
        isDragging = false;
        marker.style.cursor = 'grab';
        marker.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    };
  },

  evaluate(q) {
    const marker = document.getElementById('nlMarker');
    if (!marker) return false;

    const selectedIndex = parseInt(marker.getAttribute('data-idx'), 10);
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= q.ticks.length) return false;

    const userVal = q.ticks[selectedIndex];
    return Math.abs(userVal - q.targetVal) < 0.001;
  }
};

registerQuestionType('number_line', numberLineModule);
