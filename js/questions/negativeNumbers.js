import { registerQuestionType, formatMath } from './registry.js';

const negativeNumbersModule = {
  generate() {
    // 1. Generate 2 distinct numbers (Num A is always negative, Num B can be positive/negative)
    const numA = -(Math.floor(Math.random() * 9) + 1); // -1 to -9
    
    let numB;
    do {
      numB = Math.floor(Math.random() * 19) - 9; // -9 to +9
    } while (numB === numA);

    // 2. Correct inequality comparison symbol
    const correctSymbol = numA > numB ? '>' : '<';

    // 3. Alternate orientation randomly between horizontal & vertical
    const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';

    return {
      type: 'negative_numbers',
      numA: numA,
      numB: numB,
      correctSymbol: correctSymbol,
      orientation: orientation,
      prompt: `Place <strong><span style="color:var(--accent);">${numA}</span></strong> and <strong><span style="color:#d97706;">${numB > 0 ? '+' + numB : numB}</span></strong> on the ${orientation} number line, then complete the statement:`,
      explanation: `On a ${orientation} number line, numbers further ${orientation === 'horizontal' ? 'right' : 'up'} are greater. Since <strong>${numA}</strong> is ${numA > numB ? (orientation === 'horizontal' ? 'to the right of' : 'above') : (orientation === 'horizontal' ? 'to the left of' : 'below')} <strong>${numB}</strong>, <strong>${numA} ${correctSymbol} ${numB}</strong>.`
    };
  },

  render(q, container) {
    const minVal = -10;
    const maxVal = 10;
    const totalRange = maxVal - minVal;

    let html = `
      <div style="max-width: 550px; margin: 0 auto; text-align: center;">
        
        <!-- DUAL MARKER SLIDERS -->
        <div style="background: var(--bg-primary); padding: 14px; border-radius: var(--radius); border: 1px solid var(--border-color); margin-bottom: 20px;">
          <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; align-items: center;">
            
            <!-- Marker A Control -->
            <div style="flex: 1; min-width: 200px; text-align: left;">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--accent); display: block; margin-bottom: 4px;">
                Marker A Target: ${q.numA} (Current: <span id="valADisplay" style="font-size: 1rem; font-weight: 800;">0</span>)
              </label>
              <input type="range" id="sliderA" min="${minVal}" max="${maxVal}" step="1" value="0" style="width: 100%; cursor: pointer;">
            </div>

            <!-- Marker B Control -->
            <div style="flex: 1; min-width: 200px; text-align: left;">
              <label style="font-size: 0.85rem; font-weight: 700; color: #d97706; display: block; margin-bottom: 4px;">
                Marker B Target: ${q.numB > 0 ? '+' + q.numB : q.numB} (Current: <span id="valBDisplay" style="font-size: 1rem; font-weight: 800;">0</span>)
              </label>
              <input type="range" id="sliderB" min="${minVal}" max="${maxVal}" step="1" value="0" style="width: 100%; cursor: pointer;">
            </div>

          </div>
        </div>

        <!-- VISUAL NUMBER LINE -->
    `;

    if (q.orientation === 'horizontal') {
      // HORIZONTAL NUMBER LINE
      let ticksHtml = '';
      for (let v = minVal; v <= maxVal; v += 2) {
        const posPct = ((v - minVal) / totalRange) * 100;
        ticksHtml += `
          <div style="position: absolute; left: ${posPct}%; top: -6px; width: 2px; height: 18px; background: var(--text-muted); transform: translateX(-50%);"></div>
          <span style="position: absolute; left: ${posPct}%; top: 16px; transform: translateX(-50%); font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">${v}</span>
        `;
      }

      html += `
        <div style="position: relative; height: 75px; margin: 30px 20px 20px 20px; padding: 0 10px;">
          <div style="position: relative; width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; top: 15px;">
            ${ticksHtml}

            <!-- Live Pin A -->
            <div id="pinA" style="
              position: absolute;
              top: -22px;
              left: 50%;
              transform: translateX(-50%);
              background: var(--accent);
              color: white;
              font-weight: 800;
              font-size: 0.75rem;
              padding: 2px 6px;
              border-radius: 12px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              transition: left 0.1s ease;
              pointer-events: none;
              z-index: 2;
            ">A</div>

            <!-- Live Pin B -->
            <div id="pinB" style="
              position: absolute;
              top: 14px;
              left: 50%;
              transform: translateX(-50%);
              background: #d97706;
              color: white;
              font-weight: 800;
              font-size: 0.75rem;
              padding: 2px 6px;
              border-radius: 12px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              transition: left 0.1s ease;
              pointer-events: none;
              z-index: 2;
            ">B</div>
          </div>
        </div>
      `;

    } else {
      // VERTICAL NUMBER LINE
      let ticksHtml = '';
      for (let v = maxVal; v >= minVal; v -= 2) {
        const posPct = ((v - minVal) / totalRange) * 100;
        ticksHtml += `
          <div style="position: absolute; bottom: ${posPct}%; right: -6px; width: 18px; height: 2px; background: var(--text-muted); transform: translateY(50%);"></div>
          <span style="position: absolute; bottom: ${posPct}%; right: 18px; transform: translateY(50%); font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">${v}</span>
        `;
      }

      html += `
        <div style="display: flex; justify-content: center; margin: 20px 0 30px 0;">
          <div style="position: relative; width: 60px; height: 280px;">
            <div style="position: absolute; left: 30px; top: 0; bottom: 0; width: 6px; background: var(--border-color); border-radius: 3px;">
              ${ticksHtml}

              <!-- Live Pin A -->
              <div id="pinA" style="
                position: absolute;
                bottom: 50%;
                left: -32px;
                transform: translateY(50%);
                background: var(--accent);
                color: white;
                font-weight: 800;
                font-size: 0.75rem;
                padding: 2px 6px;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: bottom 0.1s ease;
                pointer-events: none;
                z-index: 2;
              ">A</div>

              <!-- Live Pin B -->
              <div id="pinB" style="
                position: absolute;
                bottom: 50%;
                right: -32px;
                transform: translateY(50%);
                background: #d97706;
                color: white;
                font-weight: 800;
                font-size: 0.75rem;
                padding: 2px 6px;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: bottom 0.1s ease;
                pointer-events: none;
                z-index: 2;
              ">B</div>
            </div>
          </div>
        </div>
      `;
    }

    // COMPARISON INEQUALITY STATEMENT
    html += `
        <div style="
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius);
          padding: 16px;
          display: inline-flex;
          align-items: center;
          gap: 16px;
          margin-top: 10px;
        ">
          <span style="font-size: 1.8rem; font-weight: 800; color: var(--accent);">${q.numA}</span>
          
          <div style="display: flex; gap: 8px;">
            <button class="symbol-btn" data-symbol=">" style="
              padding: 8px 18px;
              font-size: 1.4rem;
              font-weight: 800;
              background: var(--bg-card);
              border: 2px solid var(--border-color);
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.15s ease;
            ">></button>
            <button class="symbol-btn" data-symbol="<" style="
              padding: 8px 18px;
              font-size: 1.4rem;
              font-weight: 800;
              background: var(--bg-card);
              border: 2px solid var(--border-color);
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.15s ease;
            "><</button>
          </div>

          <span style="font-size: 1.8rem; font-weight: 800; color: #d97706;">${q.numB > 0 ? '+' + q.numB : q.numB}</span>
        </div>

      </div>
    `;

    container.innerHTML = html;

    // EVENT LISTENERS
    const sliderA = container.querySelector('#sliderA');
    const sliderB = container.querySelector('#sliderB');
    const valADisplay = container.querySelector('#valADisplay');
    const valBDisplay = container.querySelector('#valBDisplay');
    const pinA = container.querySelector('#pinA');
    const pinB = container.querySelector('#pinB');

    const updateVisuals = () => {
      const valA = parseInt(sliderA.value, 10);
      const valB = parseInt(sliderB.value, 10);

      valADisplay.innerText = valA > 0 ? '+' + valA : valA;
      valBDisplay.innerText = valB > 0 ? '+' + valB : valB;

      const pctA = ((valA - minVal) / totalRange) * 100;
      const pctB = ((valB - minVal) / totalRange) * 100;

      if (q.orientation === 'horizontal') {
        pinA.style.left = `${pctA}%`;
        pinB.style.left = `${pctB}%`;
      } else {
        pinA.style.bottom = `${pctA}%`;
        pinB.style.bottom = `${pctB}%`;
      }
    };

    sliderA.oninput = updateVisuals;
    sliderB.oninput = updateVisuals;
    updateVisuals();

    // Toggle Inequality Buttons
    container.querySelectorAll('.symbol-btn').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.symbol-btn').forEach(b => {
          b.style.borderColor = 'var(--border-color)';
          b.style.background = 'var(--bg-card)';
          b.style.color = 'var(--text-main)';
          b.classList.remove('selected');
        });

        btn.style.borderColor = 'var(--accent)';
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
        btn.classList.add('selected');
      };
    });
  },

  evaluate(q) {
    const sliderA = document.getElementById('sliderA');
    const sliderB = document.getElementById('sliderB');
    if (!sliderA || !sliderB) return false;

    const valA = parseInt(sliderA.value, 10);
    const valB = parseInt(sliderB.value, 10);
    
    const selectedSymbolBtn = document.querySelector('.symbol-btn.selected');
    const selectedSymbol = selectedSymbolBtn ? selectedSymbolBtn.getAttribute('data-symbol') : null;

    // Correct if both sliders match exact positions AND the inequality symbol is correct
    return valA === q.numA && valB === q.numB && selectedSymbol === q.correctSymbol;
  }
};

registerQuestionType('negative_numbers', negativeNumbersModule);
