import { registerQuestionType, formatMath } from './registry.js';

const addSubtractNegativesModule = {
  generate() {
    let a, op, b, target;

    // Keep numbers within range [-10, 10]
    do {
      a = Math.floor(Math.random() * 13) - 6; // -6 to +6
      op = Math.random() < 0.5 ? '+' : '-';
      
      const bMag = Math.floor(Math.random() * 5) + 1; // 1 to 5
      const bSign = Math.random() < 0.5 ? 1 : -1;
      b = bMag * bSign;

      const netShift = op === '+' ? b : -b;
      target = a + netShift;
    } while (target < -10 || target > 10);

    const bFormatted = b < 0 ? `(${b})` : `${b}`;
    const exprStr = `${a} ${op} ${bFormatted}`;

    let explanationText = '';
    if (op === '+' && b > 0) {
      explanationText = `Add (+) means move RIGHT (Blue arrow) by ${b} steps from ${a} to land on ${target}.`;
    } else if (op === '+' && b < 0) {
      explanationText = `Add (+) starts moving RIGHT (Blue arrow) by ${Math.abs(b)} steps. Tapping 'Flip negative number' mirrors it about ${a} into a RED arrow pointing LEFT to land on ${target}.`;
    } else if (op === '-' && b > 0) {
      explanationText = `Subtract (-) means move LEFT (Green arrow) by ${b} steps from ${a} to land on ${target}.`;
    } else {
      explanationText = `Subtract (-) starts moving LEFT (Green arrow) by ${Math.abs(b)} steps. Tapping 'Flip negative number' mirrors it about ${a} into a RED arrow pointing RIGHT to land on ${target}.`;
    }

    return {
      type: 'add_subtract_negatives',
      a: a,
      op: op,
      b: b,
      target: target,
      exprStr: exprStr,
      prompt: `Evaluate <strong>${formatMath(exprStr)}</strong> using the number line and flip tool, then key in your final answer:`,
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

    const startPct = ((q.a - minVal) / totalRange) * 100;

    let html = `
      <div style="max-width: 550px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- NUMBER LINE TRACK -->
        <div style="position: relative; height: 110px; margin: 25px 20px 10px 20px; padding: 0 10px;">
          <div id="asnTrack" style="position: relative; width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; top: 40px; touch-action: none;">
            ${ticksHtml}

            <!-- Pivot Point Dot (Start) -->
            <div style="
              position: absolute;
              top: -26px;
              left: ${startPct}%;
              transform: translateX(-50%);
              background: var(--text-main);
              color: white;
              font-weight: 800;
              font-size: 0.75rem;
              padding: 2px 8px;
              border-radius: 10px;
              z-index: 2;
            ">Start (${q.a})</div>

            <div style="
              position: absolute;
              top: -5px;
              left: ${startPct}%;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: var(--text-main);
              transform: translateX(-50%);
              z-index: 3;
            "></div>

            <!-- Dynamic Vector Arrow Bar -->
            <div id="vectorBar" style="
              position: absolute;
              top: -3px;
              height: 6px;
              border-radius: 3px;
              z-index: 2;
              pointer-events: none;
              transition: background 0.2s ease;
            "></div>

            <!-- Draggable Arrow Tip Handle -->
            <div id="arrowHead" data-val="${q.a}" style="
              position: absolute;
              top: -28px;
              left: ${startPct}%;
              transform: translateX(-50%);
              color: white;
              font-weight: 800;
              font-size: 1rem;
              padding: 2px 8px;
              border-radius: 14px;
              box-shadow: 0 3px 6px rgba(0,0,0,0.25);
              cursor: grab;
              touch-action: none;
              z-index: 4;
              transition: background 0.2s ease;
            ">➔</div>

          </div>
        </div>

        <!-- FLIP ACTION BUTTON -->
        <div style="display: flex; justify-content: center; margin: 15px 0 20px 0;">
          <button id="flipBtn" style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 10px 22px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 0.95rem;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            transition: transform 0.1s ease;
          ">🔄 Flip negative number</button>
        </div>

        <!-- EQUATION INPUT & KEYPAD -->
        <div style="
          background: var(--bg-primary); 
          border: 2px solid var(--border-color); 
          border-radius: var(--radius); 
          padding: 16px; 
          max-width: 320px; 
          margin: 0 auto;
        ">
          <div style="font-size: 1.3rem; font-weight: 800; margin-bottom: 10px;">
            ${q.exprStr} = <span id="ansDisplay" style="
              color: var(--accent); 
              border-bottom: 3px solid var(--accent); 
              padding: 0 10px;
              min-width: 50px;
              display: inline-block;
            ">?</span>
          </div>

          <!-- KEYPAD -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <button class="asn-key" data-k="1">1</button>
            <button class="asn-key" data-k="2">2</button>
            <button class="asn-key" data-k="3">3</button>
            <button class="asn-key" data-k="4">4</button>
            <button class="asn-key" data-k="5">5</button>
            <button class="asn-key" data-k="6">6</button>
            <button class="asn-key" data-k="7">7</button>
            <button class="asn-key" data-k="8">8</button>
            <button class="asn-key" data-k="9">9</button>
            <button class="asn-key" data-k="-" style="background: rgba(79,70,229,0.1); color: var(--accent); font-weight: 800;">-</button>
            <button class="asn-key" data-k="0">0</button>
            <button class="asn-key" id="asnClear" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); font-weight: 700;">C</button>
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;

    // STATE VARIABLES
    let isFlipped = false;
    let currentRawVal = q.a; // Position on line
    let typedAnswer = '';

    const track = container.querySelector('#asnTrack');
    const arrowHead = container.querySelector('#arrowHead');
    const vectorBar = container.querySelector('#vectorBar');
    const flipBtn = container.querySelector('#flipBtn');
    const ansDisplay = container.querySelector('#ansDisplay');

    // Automatic color and arrow tip symbol based on direction & flip state
    const getArrowDetails = () => {
      let color = '#3b82f6';
      let symbol = '➔';

      if (isFlipped) {
        color = '#ef4444'; // Red when flipped
        symbol = currentRawVal >= q.a ? '➔' : '⬅';
      } else {
        if (currentRawVal > q.a) {
          color = '#3b82f6'; // Blue when right of start
          symbol = '➔';
        } else if (currentRawVal < q.a) {
          color = '#10b981'; // Green when left of start
          symbol = '⬅';
        } else {
          color = q.op === '+' ? '#3b82f6' : '#10b981';
          symbol = q.op === '+' ? '➔' : '⬅';
        }
      }
      return { color, symbol };
    };

    const updateArrowUI = () => {
      const { color, symbol } = getArrowDetails();
      
      arrowHead.style.background = color;
      vectorBar.style.background = color;
      arrowHead.innerText = symbol;

      const currentPct = ((currentRawVal - minVal) / totalRange) * 100;
      arrowHead.style.left = `${currentPct}%`;

      const leftPct = Math.min(startPct, currentPct);
      const widthPct = Math.abs(currentPct - startPct);

      vectorBar.style.left = `${leftPct}%`;
      vectorBar.style.width = `${widthPct}%`;

      arrowHead.setAttribute('data-val', currentRawVal);
      arrowHead.setAttribute('data-flipped', isFlipped ? 'true' : 'false');
    };

    // POINTER DRAG LOGIC
    let isDragging = false;

    const updateFromPointer = (e) => {
      const rect = track.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));

      const rawVal = minVal + ratio * totalRange;
      currentRawVal = Math.round(rawVal);
      updateArrowUI();
    };

    arrowHead.onpointerdown = (e) => {
      isDragging = true;
      arrowHead.style.cursor = 'grabbing';
      arrowHead.setPointerCapture(e.pointerId);
      updateFromPointer(e);
    };

    arrowHead.onpointermove = (e) => {
      if (!isDragging) return;
      updateFromPointer(e);
    };

    arrowHead.onpointerup = (e) => {
      if (isDragging) {
        isDragging = false;
        arrowHead.style.cursor = 'grab';
        arrowHead.releasePointerCapture(e.pointerId);
      }
    };

    // FLIP BUTTON LOGIC
    flipBtn.onclick = () => {
      isFlipped = !isFlipped;
      
      // Mirror position about start pivot 'a'
      const distFromStart = currentRawVal - q.a;
      currentRawVal = q.a - distFromStart;

      updateArrowUI();
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
    updateArrowUI();
  },

  evaluate(q) {
    const arrowHead = document.getElementById('arrowHead');
    const ansDisplay = document.getElementById('ansDisplay');

    if (!arrowHead || !ansDisplay) return false;

    const userLineVal = parseInt(arrowHead.getAttribute('data-val'), 10);
    const userFlipped = arrowHead.getAttribute('data-flipped') === 'true';
    const userTypedVal = parseInt(ansDisplay.getAttribute('data-typed'), 10);

    const requiredFlip = q.b < 0;

    return userTypedVal === q.target && userLineVal === q.target && userFlipped === requiredFlip;
  }
};

registerQuestionType('add_subtract_negatives', addSubtractNegativesModule);
