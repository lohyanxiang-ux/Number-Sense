import { registerQuestionType } from './registry.js';

const numberLineModule = {
  generate() {
    const questionPool = [
      // ==========================================
      // 1. DECIMALS FROM 0 TO 1 (UNLABELLED TENTHS)
      // ==========================================
      () => {
        const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        const tickLabels = ticks.map(v => (v === 0 || v === 0.5 || v === 1.0 ? `${v}` : ''));
        const targetOptions = [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9];
        const val = targetOptions[Math.floor(Math.random() * targetOptions.length)];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          tickLabels: tickLabels,
          exp: `${val} is located ${Math.round(val * 10)} tick mark(s) past 0 on a line with major labels at 0, 0.5, and 1.`
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
          tickLabels: null,
          exp: `${val} is located at tick mark index ${ticks.indexOf(val)} on a 4-part decimal number line.`
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
          tickLabels: null,
          exp: `${val} is located at tick mark index ${ticks.indexOf(val)} on a 5-part decimal number line.`
        };
      },

      // ==========================================
      // 2. NEGATIVE NUMBERS & UNLABELLED TICKS
      // ==========================================
      () => {
        // Range -5 to 5 (interval 1, all labelled)
        const possible = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          tickLabels: null,
          exp: `${val} is located ${Math.abs(val)} unit(s) to the ${val < 0 ? 'left' : 'right'} of 0.`
        };
      },
      () => {
        // Range -10 to 10 (ticks every 1 unit, labels every 2 units)
        const ticks = [];
        const tickLabels = [];
        for (let i = -10; i <= 10; i++) {
          ticks.push(i);
          tickLabels.push(i % 2 === 0 ? `${i}` : '');
        }
        const possibleTargets = [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9];
        const val = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          tickLabels: tickLabels,
          exp: `${val} is located at the unlabelled tick mark halfway between ${val - 1} and ${val + 1}.`
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
          tickLabels: null,
          exp: `${val} is located on the number line with step interval 5.`
        };
      },

      // ==========================================
      // 3. NON-UNIT SCALE & UNLABELLED INTERMEDIATE TICKS
      // ==========================================
      () => {
        // 0 to 20: Ticks count by 1, labels every 2 units
        const ticks = [];
        const tickLabels = [];
        for (let i = 0; i <= 20; i++) {
          ticks.push(i);
          tickLabels.push(i % 2 === 0 ? `${i}` : '');
        }
        const possibleTargets = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
        const val = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          tickLabels: tickLabels,
          exp: `Labels appear every 2 units, but tick marks count by 1. ${val} is at the unlabelled tick mark between ${val - 1} and ${val + 1}.`
        };
      },
      () => {
        // Interval of 5 (0 to 50, all ticks labelled)
        const possible = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          tickLabels: null,
          exp: `Each tick mark represents 5 units. ${val} is ${val / 5} tick mark(s) away from 0.`
        };
      },
      () => {
        // 0 to 60: Ticks every 5 units, major labels every 10 units
        const possible = [5, 15, 25, 35, 45, 55];
        const val = possible[Math.floor(Math.random() * possible.length)];
        const ticks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
        const tickLabels = ticks.map(v => (v % 10 === 0 ? `${v}` : ''));
        return {
          label: `${val}`,
          val: val,
          ticks: ticks,
          tickLabels: tickLabels,
          exp: `Major labels are every 10 units with tick marks every 5 units. ${val} lies at the unlabelled tick mark halfway between ${val - 5} and ${val + 5}.`
        };
      }
    ];

    const selectedGen = questionPool[Math.floor(Math.random() * questionPool.length)];
    const t = selectedGen();

    return {
      type: 'number_line',
      prompt: `Drag the marker to place <strong>${t.label}</strong> on the number line:`,
      targetVal: t.val,
      ticks: t.ticks,
      tickLabels: t.tickLabels || null,
      explanation: t.exp
    };
  },

  render(q, container) {
    let tickMarksHtml = '';
    let tickLabelsHtml = '';
    const numTicks = q.ticks.length;

    q.ticks.forEach((tickVal, idx) => {
      const posPct = ((idx / (numTicks - 1)) * 100).toFixed(2);
      const hasCustomLabel = q.tickLabels && q.tickLabels[idx] !== undefined;
      const isMajor = !hasCustomLabel || q.tickLabels[idx] !== '';

      tickMarksHtml += `
        <div style="
          position: absolute; 
          left: ${posPct}%; 
          top: ${isMajor ? '-8px' : '-3px'}; 
          width: 2px; 
          height: ${isMajor ? '22px' : '12px'}; 
          background: ${tickVal === 0 ? 'var(--accent)' : 'var(--text-muted)'}; 
          transform: translateX(-50%);
        "></div>
      `;

      let labelText = '';
      if (hasCustomLabel) {
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
            font-size: 0.85rem; 
            color: ${tickVal === 0 ? 'var(--accent)' : 'var(--text-muted)'};
          ">${labelText}</span>
        `;
      }
    });

    const html = `
      <div style="max-width: 520px; margin: 30px auto 10px auto; padding: 0 20px; user-select: none; -webkit-user-select: none;">
        <div style="position: relative; height: 90px;">
          <div id="nlTrack" data-selected-index="0" style="
            position: relative; 
            width: 100%; 
            height: 8px; 
            background: var(--border-color); 
            border-radius: 4px; 
            top: 30px; 
            cursor: pointer; 
            touch-action: none;
          ">
            ${tickMarksHtml}

            <!-- LARGE DIRECTLY DRAGGABLE MARKER DOT -->
            <div id="nlDot" style="
              position: absolute;
              top: -11px;
              left: 0%;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: var(--accent);
              border: 3px solid #ffffff;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
              transform: translateX(-50%);
              transition: left 0.08s ease;
              z-index: 10;
              cursor: grab;
              touch-action: none;
            "></div>

            <div style="position: relative; width: 100%; height: 24px; top: 26px;">
              ${tickLabelsHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    const track = container.querySelector('#nlTrack');
    const dot = container.querySelector('#nlDot');
    let isDragging = false;

    const updateMarkerPosition = (clientX) => {
      const rect = track.getBoundingClientRect();
      const tapX = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, tapX / rect.width));
      const nearestIndex = Math.round(ratio * (numTicks - 1));
      const posPct = ((nearestIndex / (numTicks - 1)) * 100).toFixed(2);

      dot.style.left = `${posPct}%`;
      track.dataset.selectedIndex = nearestIndex;
    };

    track.onpointerdown = (e) => {
      isDragging = true;
      dot.style.cursor = 'grabbing';
      track.setPointerCapture(e.pointerId);
      updateMarkerPosition(e.clientX);
    };

    track.onpointermove = (e) => {
      if (isDragging) {
        updateMarkerPosition(e.clientX);
      }
    };

    const stopDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        dot.style.cursor = 'grab';
        try { track.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    };

    track.onpointerup = stopDrag;
    track.onpointercancel = stopDrag;
  },

  evaluate(q) {
    const track = document.getElementById('nlTrack');
    if (!track) return false;

    const selectedIndex = parseInt(track.dataset.selectedIndex || '0', 10);
    const userVal = q.ticks[selectedIndex];

    return Math.abs(userVal - q.targetVal) < 0.001;
  }
};

registerQuestionType('number_line', numberLineModule);
