import { registerQuestionType } from './registry.js';

const numberLineModule = {
  generate() {
    const min = Math.floor(Math.random() * -5); // e.g. -5 to 0
    const range = Math.floor(Math.random() * 10) + 10; // e.g. 10 to 20
    const max = min + range;
    const target = Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      type: 'number_line',
      min: min,
      max: max,
      target: target,
      userVal: Math.floor((min + max) / 2),
      prompt: `Locate <strong>${target}</strong> on the number line:`,
      explanation: `The marker should be placed exactly on tick <strong>${target}</strong> between <strong>${min}</strong> and <strong>${max}</strong>.`
    };
  },

  render(q, container) {
    let currentVal = q.userVal !== undefined ? q.userVal : q.min;
    q.userVal = currentVal;

    const renderUI = () => {
      const pct = ((currentVal - q.min) / (q.max - q.min)) * 100;

      const html = `
        <div class="ipad-responsive-grid" style="user-select: none;">
          
          <!-- LEFT COLUMN: INTERACTIVE NUMBER LINE -->
          <div class="ipad-left-pane" style="text-align: center;">
            <div style="
              background: var(--bg-card);
              border: 2px solid var(--border-color);
              border-radius: 14px;
              padding: 20px 14px;
              margin-bottom: 12px;
            ">
              <div style="position: relative; height: 60px; margin: 10px 20px;">
                <!-- Main Line -->
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 0;
                  right: 0;
                  height: 6px;
                  background: var(--border-color);
                  transform: translateY(-50%);
                  border-radius: 3px;
                "></div>

                <!-- Ticks -->
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 0;
                  right: 0;
                  display: flex;
                  justify-content: space-between;
                  transform: translateY(-50%);
                ">
                  <div style="height: 18px; width: 3px; background: var(--text-muted); position: relative;">
                    <span style="position: absolute; top: 22px; left: 50%; transform: translateX(-50%); font-weight: 800; font-size: 0.85rem;">${q.min}</span>
                  </div>
                  <div style="height: 18px; width: 3px; background: var(--text-muted); position: relative;">
                    <span style="position: absolute; top: 22px; left: 50%; transform: translateX(-50%); font-weight: 800; font-size: 0.85rem;">${q.max}</span>
                  </div>
                </div>

                <!-- Pointer Marker -->
                <div id="nlPointer" style="
                  position: absolute;
                  top: 50%;
                  left: ${pct}%;
                  transform: translate(-50%, -50%);
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: var(--accent);
                  border: 3px solid white;
                  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4);
                  transition: left 0.1s ease;
                "></div>
              </div>

              <!-- Native Slider Overlay -->
              <input type="range" id="nlSlider" min="${q.min}" max="${q.max}" value="${currentVal}" step="1" style="
                width: 100%;
                margin-top: 16px;
                cursor: pointer;
              ">
            </div>
          </div>

          <!-- RIGHT COLUMN: CONTROLS & VALUE PREVIEW -->
          <div class="ipad-right-pane" style="text-align: center;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
              Selected Position:
            </div>
            
            <div style="font-size: 2.2rem; font-weight: 900; color: var(--accent); margin-bottom: 14px;">
              ${currentVal}
            </div>

            <!-- NUDGE BUTTONS -->
            <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 10px;">
              <button class="btn" id="btnNudgeMinus" style="flex: 1; padding: 10px; font-size: 1.2rem; background: var(--bg-card); color: var(--text-main); border: 2px solid var(--border-color);">-1</button>
              <button class="btn" id="btnNudgePlus" style="flex: 1; padding: 10px; font-size: 1.2rem; background: var(--bg-card); color: var(--text-main); border: 2px solid var(--border-color);">+1</button>
            </div>
          </div>

        </div>
      `;

      container.innerHTML = html;

      const slider = container.querySelector('#nlSlider');
      if (slider) {
        slider.oninput = (e) => {
          currentVal = parseInt(e.target.value, 10);
          q.userVal = currentVal;
          renderUI();
        };
      }

      const btnMinus = container.querySelector('#btnNudgeMinus');
      if (btnMinus) {
        btnMinus.onclick = () => {
          if (currentVal > q.min) {
            currentVal--;
            q.userVal = currentVal;
            renderUI();
          }
        };
      }

      const btnPlus = container.querySelector('#btnNudgePlus');
      if (btnPlus) {
        btnPlus.onclick = () => {
          if (currentVal < q.max) {
            currentVal++;
            q.userVal = currentVal;
            renderUI();
          }
        };
      }
    };

    renderUI();
  },

  evaluate(q) {
    return q.userVal === q.target;
  }
};

registerQuestionType('number_line', numberLineModule);
