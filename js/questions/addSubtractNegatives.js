import { registerQuestionType, formatMath } from './registry.js';

const addSubtractNegativesModule = {
  generate() {
    let a, op, b, target, intermediate;

    // Generate questions where Start, Intermediate Shift, and Target ALL fit within [-10, 10]
    do {
      a = Math.floor(Math.random() * 17) - 8; // -8 to +8
      op = Math.random() < 0.5 ? '+' : '-';
      
      const bMag = Math.floor(Math.random() * 5) + 1; // 1 to 5 steps
      const bSign = Math.random() < 0.5 ? 1 : -1;
      b = bMag * bSign;

      // Intermediate step before flip
      intermediate = op === '+' ? a + Math.abs(b) : a - Math.abs(b);

      const netShift = op === '+' ? b : -b;
      target = a + netShift;

    } while (
      a < -10 || a > 10 ||
      intermediate < -10 || intermediate > 10 ||
      target < -10 || target > 10
    );

    const bFormatted = b < 0 ? `(${b})` : `${b}`;
    const exprStr = `${a} ${op} ${bFormatted}`;

    let explanationText = '';
    if (op === '+' && b > 0) {
      explanationText = `Place Start pin on <strong>${a}</strong>, tap <strong>Move</strong> to draw an arrow RIGHT by ${b} steps to land on <strong>${target}</strong>.`;
    } else if (op === '+' && b < 0) {
      explanationText = `Place Start pin on <strong>${a}</strong>, tap <strong>Move</strong> to draw an arrow RIGHT by ${Math.abs(b)} steps, then tap <strong>Flip negative number</strong> to mirror it to land on <strong>${target}</strong>.`;
    } else if (op === '-' && b > 0) {
      explanationText = `Place Start pin on <strong>${a}</strong>, tap <strong>Move</strong> to draw an arrow LEFT by ${b} steps to land on <strong>${target}</strong>.`;
    } else {
      explanationText = `Place Start pin on <strong>${a}</strong>, tap <strong>Move</strong> to draw an arrow LEFT by ${Math.abs(b)} steps, then tap <strong>Flip negative number</strong> to mirror it to land on <strong>${target}</strong>.`;
    }

    return {
      type: 'add_subtract_negatives',
      a: a,
      op: op,
      b: b,
      target: target,
      exprStr: exprStr,
      prompt: `Evaluate <strong>${formatMath(exprStr)}</strong> using the number line, then key in your final answer:`,
      explanation: formatMath(explanationText)
    };
  },

  render(q, container) {
    const minVal = -10;
    const maxVal = 10;
    const totalRange = maxVal - minVal;

    // Ticks generation
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

    // Default start pin position offset from q.a initially
    let initialStart = 0;
    if (q.a === 0) initialStart = 3;

    const startPct = ((initialStart - minVal) / totalRange) * 100;

    let html = `
      <div style="max-width: 580px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- NUMBER LINE TRACK -->
        <div style="position: relative; height: 140px; margin: 25px 20px 10px 20px; padding: 0 10px;">
          <div id="asnTrack" style="position: relative; width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; top: 55px; touch-action: none;">
            ${ticksHtml}

            <!-- DRAGGABLE / LOCKABLE START PIN HANDLE (PURPLE) -->
            <div id="startPin" data-val="${initialStart}" style="
              position: absolute;
              top: -34px;
              left: ${startPct}%;
              transform: translateX(-50%);
              background: #8b5cf6;
              color: white;
              font-weight: 800;
              font-size: 0.8rem;
              padding: 3px 10px;
              border-radius: 12px;
              box-shadow: 0 3px 6px rgba(0,0,0,0.25);
              cursor: grab;
              touch-action: none;
              z-index: 6;
              transition: background 0.2s ease, opacity 0.2s ease;
            ">Start: ${initialStart}</div>

            <div id="startDot" style="
              position: absolute;
              top: -5px;
              left: ${startPct}%;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #8b5cf6;
              transform: translateX(-50%);
              z-index: 5;
            "></div>

            <!-- Dynamic Vector Arrow Bar -->
            <div id="vectorBar" style="
              position: absolute;
              top: -3px;
              height: 6px;
              border-radius: 3px;
              z-index: 2;
              pointer-events: none;
              display: none;
              transition: background 0.2s ease;
            "></div>

            <!-- Floating Step Count Badge Near Arrow -->
            <div id="vectorStepBadge" style="
              position: absolute;
              top: -54px;
              left: ${startPct}%;
              transform: translateX(-50%);
              background: var(--bg-card);
              border: 2px solid var(--accent);
              color: var(--accent);
              font-weight: 800;
              font-size: 0.8rem;
              padding: 2px 8px;
              border-radius: 12px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              pointer-events: none;
              z-index: 4;
              white-space: nowrap;
              display: none;
            ">0 steps</div>

            <!-- Draggable Arrow Tip Handle -->
            <div id="arrowHead" data-val="${initialStart}" style="
              position: absolute;
              top: -28px;
              left: ${startPct}%;
              transform: translateX(-50%);
              color: white;
              font-weight: 800;
              font-size: 1.1rem;
              padding: 3px 10px;
              border-radius: 14px;
              box-shadow: 0 3px 6px rgba(0,0,0,0.25);
              cursor: grab;
              touch-action: none;
              z-index: 5;
              display: none;
              transition: background 0.2s ease;
            ">➔</div>

          </div>
        </div>

        <!-- ACTION BUTTONS BAR: MOVE, FLIP & RESET -->
        <div style="display: flex; justify-content: center; gap: 10px; margin: 15px 0 20px 0; flex-wrap: wrap;">
          <button id="moveBtn" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 0.95rem;
            cursor: pointer;
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
            transition: transform 0.1s ease, background 0.2s ease;
          ">➡️ Move</button>

          <button id="flipBtn" style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 0.95rem;
            cursor: pointer;
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
            transition: transform 0.1s ease;
          ">🔄 Flip negative number</button>

          <button id="asnResetBtn" style="
            background: var(--bg-primary);
            color: var(--text-main);
            border: 2px solid var(--border-color);
            padding: 10px 16px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 0.95rem;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.1s ease;
          ">↺ Reset</button>
        </div>

        <!-- EQUATION INPUT & ENLARGED TOUCH KEYPAD -->
        <div style="
          background: var(--bg-primary); 
          border: 2px solid var(--border-color); 
          border-radius: var(--radius); 
          padding: 20px; 
          max-width: 380px; 
          margin: 0 auto;
          box-shadow: var(--shadow);
        ">
          <!-- EQUATION DISPLAY -->
          <div style="font-size: 1.6rem; font-weight: 800; margin-bottom: 14px;">
            ${q.exprStr} = <span id="ansDisplay" style="
              color: var(--accent); 
              border-bottom: 3.5px solid var(--accent); 
              padding: 0 12px;
              min-width: 65px;
              display: inline-block;
            ">?</span>
          </div>

          <!-- ENLARGED KEYPAD GRID -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <button class="asn-key" data-k="1">1</button>
            <button class="asn-key" data-k="2">2</button>
            <button class="asn-key" data-k="3">3</button>
            <button class="asn-key" data-k="4">4</button>
            <button class="asn-key" data-k="5">5</button>
            <button class="asn-key" data-k="6">6</button>
            <button class="asn-key" data-k="7">7</button>
            <button class="asn-key" data-k="8">8</button>
            <button class="asn-key" data-k="9">9</button>
            <button class="asn-key" data-k="-" style="background: rgba(79,70,229,0.12); color: var(--accent); font-weight: 800;">-</button>
            <button class="asn-key" data-k="0">0</button>
            <button class="asn-key" id="asnClear" style="background: rgba(239, 68, 68, 0.12); color: var(--danger); font-weight: 800;">C</button>
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;

    // KEYPAD CSS STYLING ENHANCEMENT
    container.querySelectorAll('.asn-key').forEach(btn => {
      btn.style.height = '58px';
      btn.style.fontSize = '1.4rem';
      btn.style.fontWeight = '800';
      btn.style.borderRadius = '10px';
      btn.style.border = '2px solid var(--border-color)';
      btn.style.background = 'var(--bg-card)';
      btn.style.color = 'var(--text-main)';
      btn.style.cursor = 'pointer';
      btn.style.touchAction = 'manipulation';
    });

    // STATE VARIABLES
    let currentStartVal = initialStart;
    let currentTipVal = initialStart;
    let hasMoved = false;
    let isFlipped = false;
    let typedAnswer = '';

    const track = container.querySelector('#asnTrack');
    const startPin = container.querySelector('#startPin');
    const startDot = container.querySelector('#startDot');
    const arrowHead = container.querySelector('#arrowHead');
    const vectorBar = container.querySelector('#vectorBar');
    const vectorStepBadge = container.querySelector('#vectorStepBadge');
    const moveBtn = container.querySelector('#moveBtn');
    const flipBtn = container.querySelector('#flipBtn');
    const asnResetBtn = container.querySelector('#asnResetBtn');
    const ansDisplay = container.querySelector('#ansDisplay');

    // Automatic color and arrow tip symbol based on direction & flip state
    const getArrowDetails = () => {
      let color = '#3b82f6';
      let symbol = '➔';

      if (isFlipped) {
        color = '#ef4444'; // Red when flipped
        symbol = currentTipVal >= currentStartVal ? '➔' : '⬅';
      } else {
        if (currentTipVal > currentStartVal) {
          color = '#3b82f6'; // Blue when right of start
          symbol = '➔';
        } else if (currentTipVal < currentStartVal) {
          color = '#10b981'; // Green when left of start
          symbol = '⬅';
        } else {
          color = q.op === '+' ? '#3b82f6' : '#10b981';
          symbol = q.op === '+' ? '➔' : '⬅';
        }
      }
      return { color, symbol };
    };

    const updateUI = () => {
      // Update Start Pin UI & Lock State
      const startPctVal = ((currentStartVal - minVal) / totalRange) * 100;
      startPin.style.left = `${startPctVal}%`;
      startDot.style.left = `${startPctVal}%`;

      if (hasMoved) {
        startPin.style.background = '#6b7280';
        startPin.style.cursor = 'not-allowed';
        startPin.style.opacity = '0.85';
        startPin.innerText = `🔒 Start: ${currentStartVal}`;

        // Reveal Vector Arrow & Step Badge
        vectorBar.style.display = 'block';
        vectorStepBadge.style.display = 'block';
        arrowHead.style.display = 'block';

        const { color, symbol } = getArrowDetails();
        arrowHead.style.background = color;
        vectorBar.style.background = color;
        arrowHead.innerText = symbol;

        const tipPctVal = ((currentTipVal - minVal) / totalRange) * 100;
        arrowHead.style.left = `${tipPctVal}%`;

        const leftPct = Math.min(startPctVal, tipPctVal);
        const widthPct = Math.abs(tipPctVal - startPctVal);

        vectorBar.style.left = `${leftPct}%`;
        vectorBar.style.width = `${widthPct}%`;

        // Update Floating Step Counter Badge
        const stepsCount = Math.abs(currentTipVal - currentStartVal);
        const midPct = (startPctVal + tipPctVal) / 2;

        vectorStepBadge.style.left = `${midPct}%`;
        vectorStepBadge.innerText = `${stepsCount} ${stepsCount === 1 ? 'step' : 'steps'}`;
        vectorStepBadge.style.borderColor = color;
        vectorStepBadge.style.color = color;
      } else {
        startPin.style.background = '#8b5cf6';
        startPin.style.cursor = 'grab';
        startPin.style.opacity = '1';
        startPin.innerText = `Start: ${currentStartVal}`;

        vectorBar.style.display = 'none';
        vectorStepBadge.style.display = 'none';
        arrowHead.style.display = 'none';
      }

      startPin.setAttribute('data-val', currentStartVal);
      arrowHead.setAttribute('data-val', currentTipVal);
      arrowHead.setAttribute('data-moved', hasMoved ? 'true' : 'false');
      arrowHead.setAttribute('data-flipped', isFlipped ? 'true' : 'false');
    };

    // POINTER DRAG LOGIC - START PIN (Disabled when locked)
    let isDraggingStart = false;
    startPin.onpointerdown = (e) => {
      if (hasMoved) return; // Prevent dragging when locked
      isDraggingStart = true;
      startPin.style.cursor = 'grabbing';
      startPin.setPointerCapture(e.pointerId);
    };

    startPin.onpointermove = (e) => {
      if (!isDraggingStart || hasMoved) return;
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const rawVal = Math.round(minVal + ratio * totalRange);
      
      const diff = rawVal - currentStartVal;
      currentStartVal = rawVal;
      currentTipVal += diff;
      updateUI();
    };

    startPin.onpointerup = (e) => {
      if (isDraggingStart) {
        isDraggingStart = false;
        if (!hasMoved) startPin.style.cursor = 'grab';
        startPin.releasePointerCapture(e.pointerId);
      }
    };

    // "MOVE" BUTTON LOGIC (ACTIVATES ARROW & LOCKS START PIN)
    moveBtn.onclick = () => {
      hasMoved = true;
      moveBtn.style.background = '#10b981';
      moveBtn.innerText = '✓ Move Active';
      updateUI();
    };

    // POINTER DRAG LOGIC - ARROW TIP
    let isDraggingTip = false;
    arrowHead.onpointerdown = (e) => {
      if (!hasMoved) return;
      isDraggingTip = true;
      arrowHead.style.cursor = 'grabbing';
      arrowHead.setPointerCapture(e.pointerId);
    };

    arrowHead.onpointermove = (e) => {
      if (!isDraggingTip) return;
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      currentTipVal = Math.round(minVal + ratio * totalRange);
      updateUI();
    };

    arrowHead.onpointerup = (e) => {
      if (isDraggingTip) {
        isDraggingTip = false;
        arrowHead.style.cursor = 'grab';
        arrowHead.releasePointerCapture(e.pointerId);
      }
    };

    // FLIP BUTTON LOGIC
    flipBtn.onclick = () => {
      if (!hasMoved) {
        hasMoved = true;
        moveBtn.style.background = '#10b981';
        moveBtn.innerText = '✓ Move Active';
      }

      isFlipped = !isFlipped;
      
      // Mirror position about start pin
      const distFromStart = currentTipVal - currentStartVal;
      currentTipVal = currentStartVal - distFromStart;

      updateUI();
    };

    // RESET BUTTON LOGIC
    asnResetBtn.onclick = () => {
      hasMoved = false;
      isFlipped = false;
      currentStartVal = initialStart;
      currentTipVal = initialStart;
      typedAnswer = '';

      moveBtn.style.background = '#3b82f6';
      moveBtn.innerText = '➡️ Move';

      ansDisplay.innerText = '?';
      ansDisplay.removeAttribute('data-typed');

      updateUI();
    };

    // KEYPAD LOGIC
    container.querySelectorAll('.asn-key[data-k]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-k');
        if (k === '-' && typedAnswer.length === 0) {
          typedAnswer = '-';
        } else if (k !== '-') {
          if (typedAnswer === '0') typedAnswer = k;
          else typedAnswer += k;
        }
        ansDisplay.innerText = typedAnswer || '?';
        ansDisplay.setAttribute('data-typed', typedAnswer);
      };
    });

    document.getElementById('asnClear').onclick = () => {
      typedAnswer = '';
      ansDisplay.innerText = '?';
      ansDisplay.removeAttribute('data-typed');
    };

    // Initial render setup
    updateUI();
  },

  evaluate(q) {
    const startPin = document.getElementById('startPin');
    const arrowHead = document.getElementById('arrowHead');
    const ansDisplay = document.getElementById('ansDisplay');

    if (!startPin || !arrowHead || !ansDisplay) return false;

    const userStartVal = parseInt(startPin.getAttribute('data-val'), 10);
    const userLineVal = parseInt(arrowHead.getAttribute('data-val'), 10);
    const userMoved = arrowHead.getAttribute('data-moved') === 'true';
    const userFlipped = arrowHead.getAttribute('data-flipped') === 'true';
    const userTypedVal = parseInt(ansDisplay.getAttribute('data-typed'), 10);

    const requiredFlip = q.b < 0;

    return userStartVal === q.a && userMoved && userLineVal === q.target && userFlipped === requiredFlip && userTypedVal === q.target;
  }
};

registerQuestionType('add_subtract_negatives', addSubtractNegativesModule);
