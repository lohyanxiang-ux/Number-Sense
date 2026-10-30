import { registerQuestionType, formatMath } from './registry.js';

const negativeNumbersModule = {
  generate() {
    // 1. Generate 2 distinct numbers (Num A is always negative, Num B can be positive or negative)
    const numA = -(Math.floor(Math.random() * 9) + 1); // -1 to -9
    
    let numB;
    do {
      numB = Math.floor(Math.random() * 19) - 9; // -9 to +9
    } while (numB === numA);

    const correctSymbol = numA > numB ? '>' : '<';
    const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

    return {
      type: 'negative_numbers',
      numA: numA,
      numB: numB,
      correctSymbol: correctSymbol,
      orientation: orientation,
      prompt: `Drag <strong>Marker A</strong> to <strong><span style="color:var(--accent);">${numA}</span></strong> and <strong>Marker B</strong> to <strong><span style="color:#d97706;">${numB > 0 ? '+' + numB : numB}</span></strong> on the ${orientation} number line, then choose the correct sign:`,
      explanation: `On a ${orientation} number line, numbers further ${orientation === 'horizontal' ? 'right' : 'up'} are greater. Since <strong>${numA}</strong> is ${numA > numB ? (orientation === 'horizontal' ? 'to the right of' : 'above') : (orientation === 'horizontal' ? 'to the left of' : 'below')} <strong>${numB}</strong>, <strong>${numA} ${correctSymbol} ${numB}</strong>.`
    };
  },

  render(q, container) {
    const minVal = -10;
    const maxVal = 10;
    const totalRange = maxVal - minVal;

    let html = `
      <div style="max-width: 550px; margin: 0 auto; text-align: center; user-select: none; -webkit-user-select: none;">
        
        <!-- TARGET READOUT CARDS -->
        <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 20px;">
          <div style="background: var(--bg-primary); border: 2px solid var(--accent); padding: 8px 16px; border-radius: var(--radius); flex: 1; max-width: 220px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--accent); display: block;">Marker A Target: ${q.numA}</span>
            <span style="font-size: 1.1rem; font-weight: 800;">Position: <span id="posADisplay" style="color: var(--accent);">0</span></span>
          </div>
          <div style="background: var(--bg-primary); border: 2px solid #d97706; padding: 8px 16px; border-radius: var(--radius); flex: 1; max-width: 220px;">
            <span style="font-size: 0.8rem; font-weight: 700; color: #d97706; display: block;">Marker B Target: ${q.numB > 0 ? '+' + q.numB : q.numB}</span>
            <span style="font-size: 1.1rem; font-weight: 800;">Position: <span id="posBDisplay" style="color: #d97706;">0</span></span>
          </div>
        </div>

        <!-- NUMBER LINE CONTAINER -->
    `;

    if (q.orientation === 'horizontal') {
      // HORIZONTAL TICK MARKS FOR EVERY UNIT (-10 to +10)
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

      html += `
        <div style="position: relative; height: 90px; margin: 30px 20px 20px 20px; padding: 0 10px;">
          <!-- Track -->
          <div id="nlTrack" style="position: relative; width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; top: 25px; touch-action: none;">
            ${ticksHtml}

            <!-- Draggable Pin A -->
            <div id="pinA" class="drag-pin" data-val="0" style="
              position: absolute;
              top: -30px;
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
            ">A</div>

            <!-- Draggable Pin B -->
            <div id="pinB" class="drag-pin" data-val="0" style="
              position: absolute;
              top: 18px;
              left: 50%;
              transform: translateX(-50%);
              background: #d97706;
              color: white;
              font-weight: 800;
              font-size: 0.85rem;
              padding: 4px 10px;
              border-radius: 14px;
              box-shadow: 0 3px 6px rgba(0,0,0,0.25);
              cursor: grab;
              touch-action: none;
              z-index: 3;
            ">B</div>
          </div>
        </div>
      `;

    } else {
      // VERTICAL TICK MARKS FOR EVERY UNIT (-10 to +10)
      let ticksHtml = '';
      for (let v = maxVal; v >= minVal; v--) {
        const posPct = ((v - minVal) / totalRange) * 100;
        const isMajor = v % 2 === 0;

        ticksHtml += `
          <div style="
            position: absolute; 
            bottom: ${posPct}%; 
            right: ${isMajor ? '-6px' : '-2px'}; 
            width: ${isMajor ? '18px' : '10px'}; 
            height: 2px; 
            background: ${v === 0 ? 'var(--accent)' : 'var(--text-muted)'}; 
            transform: translateY(50%);
          "></div>
        `;

        if (isMajor) {
          ticksHtml += `
            <span style="
              position: absolute; 
              bottom: ${posPct}%; 
              right: 20px; 
              transform: translateY(50%); 
              font-size: 0.75rem; 
              font-weight: ${v === 0 ? '800' : '600'}; 
              color: ${v === 0 ? 'var(--accent)' : 'var(--text-muted)'};
            ">${v}</span>
          `;
        }
      }

      html += `
        <div style="display: flex; justify-content: center; margin: 20px 0 30px 0;">
          <div id="nlTrack" style="position: relative; width: 60px; height: 300px; touch-action: none;">
            <div style="position: absolute; left: 30px; top: 0; bottom: 0; width: 6px; background: var(--border-color); border-radius: 3px;">
              ${ticksHtml}

              <!-- Draggable Pin A -->
              <div id="pinA" class="drag-pin" data-val="0" style="
                position: absolute;
                bottom: 50%;
                left: -38px;
                transform: translateY(50%);
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
              ">A</div>

              <!-- Draggable Pin B -->
              <div id="pinB" class="drag-pin" data-val="0" style="
                position: absolute;
                bottom: 50%;
                right: -38px;
                transform: translateY(50%);
                background: #d97706;
                color: white;
                font-weight: 800;
                font-size: 0.85rem;
                padding: 4px 10px;
                border-radius: 14px;
                box-shadow: 0 3px 6px rgba(0,0,0,0.25);
                cursor: grab;
                touch-action: none;
                z-index: 3;
              ">B</div>
            </div>
          </div>
        </div>
      `;
    }

    // DROPDOWN SELECTOR FOR INEQUALITY COMPARISON
    html += `
        <div style="
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius);
          padding: 14px 20px;
          display: inline-flex;
          align-items: center;
          gap: 16px;
          margin-top: 10px;
        ">
          <span style="font-size: 1.8rem; font-weight: 800; color: var(--accent);">${q.numA}</span>
          
          <select id="symbolSelect" class="input-field" style="
            width: 75px; 
            font-size: 1.5rem; 
            font-weight: 800; 
            text-align: center; 
            padding: 4px 8px;
            cursor: pointer;
            border: 2px solid var(--border-color);
          ">
            <option value="">?</option>
            <option value=">">></option>
            <option value="<"><</option>
          </select>

          <span style="font-size: 1.8rem; font-weight: 800; color: #d97706;">${q.numB > 0 ? '+' + q.numB : q.numB}</span>
        </div>

      </div>
    `;

    container.innerHTML = html;

    // DRAG AND SNAP LOGIC FOR MARKERS A & B
    const track = container.querySelector('#nlTrack');
    const pinA = container.querySelector('#pinA');
    const pinB = container.querySelector('#pinB');
    const posADisplay = container.querySelector('#posADisplay');
    const posBDisplay = container.querySelector('#posBDisplay');

    const setupMarkerDrag = (pinEl, displayEl) => {
      let isDragging = false;

      const updatePositionFromPointer = (e) => {
        const rect = track.getBoundingClientRect();
        let ratio;

        if (q.orientation === 'horizontal') {
          const x = e.clientX - rect.left;
          ratio = Math.max(0, Math.min(1, x / rect.width));
        } else {
          const y = rect.bottom - e.clientY;
          ratio = Math.max(0, Math.min(1, y / rect.height));
        }

        // Convert ratio to integer between -10 and 10
        const rawVal = minVal + ratio * totalRange;
        const snappedVal = Math.round(rawVal);
        
        pinEl.setAttribute('data-val', snappedVal);
        displayEl.innerText = snappedVal > 0 ? '+' + snappedVal : snappedVal;

        const snappedPct = ((snappedVal - minVal) / totalRange) * 100;
        if (q.orientation === 'horizontal') {
          pinEl.style.left = `${snappedPct}%`;
        } else {
          pinEl.style.bottom = `${snappedPct}%`;
        }
      };

      pinEl.onpointerdown = (e) => {
        isDragging = true;
        pinEl.style.cursor = 'grabbing';
        pinEl.setPointerCapture(e.pointerId);
        updatePositionFromPointer(e);
      };

      pinEl.onpointermove = (e) => {
        if (!isDragging) return;
        updatePositionFromPointer(e);
      };

      pinEl.onpointerup = (e) => {
        if (isDragging) {
          isDragging = false;
          pinEl.style.cursor = 'grab';
          pinEl.releasePointerCapture(e.pointerId);
        }
      };
    };

    setupMarkerDrag(pinA, posADisplay);
    setupMarkerDrag(pinB, posBDisplay);
  },

  evaluate(q) {
    const pinA = document.getElementById('pinA');
    const pinB = document.getElementById('pinB');
    const symbolSelect = document.getElementById('symbolSelect');

    if (!pinA || !pinB || !symbolSelect) return false;

    const valA = parseInt(pinA.getAttribute('data-val'), 10);
    const valB = parseInt(pinB.getAttribute('data-val'), 10);
    const selectedSymbol = symbolSelect.value;

    return valA === q.numA && valB === q.numB && selectedSymbol === q.correctSymbol;
  }
};

registerQuestionType('negative_numbers', negativeNumbersModule);
