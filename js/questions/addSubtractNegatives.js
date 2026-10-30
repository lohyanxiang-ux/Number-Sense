import { registerQuestionType, formatMath } from './registry.js';

const addSubtractNegativesModule = {
  generate() {
    let a, op, b, netShift, target;

    // Generate valid numbers until target falls strictly within [-10, 10]
    do {
      a = Math.floor(Math.random() * 15) - 7; // -7 to +7
      op = Math.random() < 0.5 ? '+' : '-';
      
      const bMag = Math.floor(Math.random() * 6) + 1; // 1 to 6
      const bSign = Math.random() < 0.5 ? 1 : -1;
      b = bMag * bSign;

      netShift = op === '+' ? b : -b;
      target = a + netShift;
    } while (target < -10 || target > 10);

    const bStr = b < 0 ? `(${b})` : `${b}`;
    const exprStr = `${a} ${op} ${bStr}`;

    const moveDirection = netShift > 0 ? 'RIGHT ➔' : 'LEFT ⬅';
    const steps = Math.abs(netShift);
    let ruleText = '';

    if (op === '+' && b > 0) {
      ruleText = `Adding positive ${b} moves ${steps} steps RIGHT.`;
    } else if (op === '+' && b < 0) {
      ruleText = `Adding negative (${b}) is equivalent to moving ${steps} steps LEFT.`;
    } else if (op === '-' && b > 0) {
      ruleText = `Subtracting positive ${b} moves ${steps} steps LEFT.`;
    } else if (op === '-' && b < 0) {
      ruleText = `Subtracting negative (${b}) is equivalent to moving ${steps} steps RIGHT (double negative becomes positive).`;
    }

    const explanation = `
      <strong>Conceptual Rule:</strong> ${ruleText}<br>
      Start at <strong>${a}</strong> and move <strong>${steps} steps ${moveDirection}</strong> to land on <strong>${target}</strong>.<br>
      Therefore, <strong>${exprStr} = ${target}</strong>.
    `;

    return {
      type: 'add_subtract_negatives',
      a: a,
      op: op,
      b: b,
      netShift: netShift,
      target: target,
      exprStr: exprStr,
      prompt: `Evaluate <strong>${formatMath(exprStr)}</strong> by dragging the arrow tip to the correct answer on the number line:`,
      explanation: formatMath(explanation)
    };
  },

  render(q, container) {
    const minVal = -10;
    const maxVal = 10;
    const totalRange = maxVal - minVal;

    let ticksHtml = '';
    for (let v = minVal; v <= maxVal; v++) {
      const posPct = ((v - minVal) / totalRange) * 100;
      const isMajor = v % 2 === 0;

      ticksHtml += `
        <div style="
          position: absolute; 
          left: ${posPct}%; 
          top: ${isMajor ? '-6px' : '-2px'}; 
          width: 2px; 
          height: ${isMajor ? '18px' : '10px'}; 
          background: ${v === 0 ? 'var(--accent)' : 'var(--text-muted)'}; 
          transform: translateX(-50%);
        "></div>
      `;

      if (isMajor) {
        ticksHtml += `
          <span style="
            position: absolute; 
            left: ${posPct}%; 
            top: 18px; 
            transform: translateX(-50%); 
            font-size: 0.75rem; 
            font-weight: ${v === 0 ? '800' : '600'}; 
            color: ${v === 0 ? 'var(--accent)' : 'var(--text-muted)'};
          ">${v}</span>
        `;
      }
    }

    const startPct = ((q.a - minVal) / totalRange) * 100;

    let html = `
      <div style="max-width: 550px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- Live Readout Box -->
        <div style="
          background: var(--bg-primary); 
          border: 2px solid var(--border-color); 
          padding: 12px 20px; 
          border-radius: var(--radius); 
          display: inline-flex; 
          align-items: center; 
          gap: 16px; 
          margin-bottom: 20px;
        ">
          <span style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">${q.exprStr} = </span>
          <span id="endPosDisplay" style="font-size: 2rem; font-weight: 800; color: var(--accent);">0</span>
          <span id="stepCountDisplay" style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); padding-left: 10px; border-left: 1px solid var(--border-color);">
            Movement: 0 steps
          </span>
        </div>

        <!-- NUMBER LINE CANVAS TRACK -->
        <div style="position: relative; height: 110px; margin: 20px 20px 10px 20px; padding: 0 10px;">
          
          <div id="asnTrack" style="position: relative; width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; top: 40px; touch-action: none;">
            ${ticksHtml}

            <!-- Fixed Start Marker -->
            <div style="
              position: absolute;
              top: -28px;
              left: ${startPct}%;
              transform: translateX(-50%);
              background: #64748b;
              color: white;
              font-weight: 800;
              font-size: 0.75rem;
              padding: 2px 8px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.15);
              z-index: 2;
            ">Start (${q.a})</div>

            <div style="
              position: absolute;
              top: -6px;
              left: ${startPct}%;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #64748b;
              transform: translateX(-50%);
              z-index: 2;
            "></div>

            <!-- Dynamic Vector Movement Bar -->
            <div id="vectorLine" style="
              position: absolute;
              top: -3px;
              height: 4px;
              background: var(--accent);
              border-radius: 2px;
              z-index: 2;
              pointer-events: none;
            "></div>

            <!-- Draggable Vector End Handle -->
            <div id="vectorEndPin" data-val="0" style="
              position: absolute;
              top: -28px;
              left: 50%;
              transform: translateX(-50%);
              background: var(--accent);
              color: white;
              font-weight: 800;
              font-size: 0.85rem;
              padding: 4px 10px;
              border-radius: 14px;
              box-shadow: 0 3px 6px rgba(0,0,0,0.25);
              cursor: grab;
              touch-action: none;
              z-index: 3;
            ">End</div>

          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;

    const track = container.querySelector('#asnTrack');
    const endPin = container.querySelector('#vectorEndPin');
    const vectorLine = container.querySelector('#vectorLine');
    const endPosDisplay = container.querySelector('#endPosDisplay');
    const stepCountDisplay = container.querySelector('#stepCountDisplay');

    let isDragging = false;

    const updateVectorUI = (val) => {
      endPin.setAttribute('data-val', val);
      endPosDisplay.innerText = val > 0 ? '+' + val : val;

      const steps = val - q.a;
      if (steps === 0) {
        stepCountDisplay.innerText = 'Movement: 0 steps';
      } else if (steps > 0) {
        stepCountDisplay.innerText = `Movement: ${steps} steps RIGHT ➔`;
      } else {
        stepCountDisplay.innerText = `Movement: ${Math.abs(steps)} steps LEFT ⬅`;
      }

      const currentPct = ((val - minVal) / totalRange) * 100;
      endPin.style.left = `${currentPct}%`;

      const leftPct = Math.min(startPct, currentPct);
      const widthPct = Math.abs(currentPct - startPct);

      vectorLine.style.left = `${leftPct}%`;
      vectorLine.style.width = `${widthPct}%`;
    };

    const updatePositionFromPointer = (e) => {
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));

      const rawVal = minVal + ratio * totalRange;
      const snappedVal = Math.round(rawVal);

      updateVectorUI(snappedVal);
    };

    endPin.onpointerdown = (e) => {
      isDragging = true;
      endPin.style.cursor = 'grabbing';
      endPin.setPointerCapture(e.pointerId);
      updatePositionFromPointer(e);
    };

    endPin.onpointermove = (e) => {
      if (!isDragging) return;
      updatePositionFromPointer(e);
    };

    endPin.onpointerup = (e) => {
      if (isDragging) {
        isDragging = false;
        endPin.style.cursor = 'grab';
        endPin.releasePointerCapture(e.pointerId);
      }
    };

    // Start handle at 0 by default
    updateVectorUI(0);
  },

  evaluate(q) {
    const endPin = document.getElementById('vectorEndPin');
    if (!endPin) return false;

    const userVal = parseInt(endPin.getAttribute('data-val'), 10);
    return userVal === q.target;
  }
};

registerQuestionType('add_subtract_negatives', addSubtractNegativesModule);
