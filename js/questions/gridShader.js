import { registerQuestionType, formatMath } from './registry.js';

const gridShaderModule = {
  generate() {
    const templates = [
      // Fractions
      { type: 'frac', targetStr: '1/2', ratio: 0.5, exp: '1/2 means half of the shape. On 2 parts shade 1, on 4 shade 2, on 10 shade 5, or on 100 shade 50.' },
      { type: 'frac', targetStr: '3/4', ratio: 0.75, exp: '3/4 means 3 out of 4 parts (or 75 out of 100 parts).' },
      { type: 'frac', targetStr: '2/5', ratio: 0.4, exp: '2/5 means 2 out of 5 parts (or 4 out of 10 parts, or 40 out of 100).' },
      { type: 'frac', targetStr: '1/3', ratio: 1/3, exp: '1/3 means 1 out of 3 equal parts.' },

      // Decimals
      { type: 'dec', targetStr: '0.3', ratio: 0.3, exp: '0.3 is equal to 3/10 or 30/100 of the total area.' },
      { type: 'dec', targetStr: '0.6', ratio: 0.6, exp: '0.6 is equivalent to 3/5, 6/10, or 60/100.' },
      { type: 'dec', targetStr: '0.8', ratio: 0.8, exp: '0.8 is equivalent to 4/5, 8/10, or 80/100.' },

      // Percentages
      { type: 'pct', targetStr: '50%', ratio: 0.5, exp: '50% represents exactly half of the total area.' },
      { type: 'pct', targetStr: '20%', ratio: 0.2, exp: '20% means 1 out of 5 parts (or 2 out of 10 parts, or 20 out of 100).' },
      { type: 'pct', targetStr: '70%', ratio: 0.7, exp: '70% means 7 out of 10 parts (or 70 out of 100).' }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    const randomShape = Math.random() < 0.5 ? 'square' : 'circle';

    return {
      type: 'grid_shader',
      prompt: `Shade <strong>${formatMath(t.targetStr)}</strong> of the shape below:`,
      targetRatio: t.ratio,
      shape: randomShape,
      explanation: formatMath(t.exp)
    };
  },

  render(q, container) {
    const allowedPartitions = [2, 3, 4, 5, 10, 100];
    let currentPartition = 10;

    const renderLayout = () => {
      let html = `
        <div style="text-align: center; margin-bottom: 12px;">
          <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">
            Choose how many parts to cut the shape into:
          </p>
          <div class="partition-btn-group" style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
      `;

      allowedPartitions.forEach(p => {
        const activeClass = p === currentPartition ? 'btn-partition-active' : '';
        html += `<button class="btn-partition ${activeClass}" data-parts="${p}">${p} parts</button>`;
      });

      html += `
          </div>
        </div>

        <!-- FIXED 300px x 300px CONTAINER -->
        <div class="fixed-area-box" id="touchGrid" style="
          width: 300px;
          height: 300px;
          margin: 0 auto;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        ">
      `;

      if (q.shape === 'square') {
        let rows = 1, cols = currentPartition;
        if (currentPartition === 4) { rows = 2; cols = 2; }
        else if (currentPartition === 10) { rows = 2; cols = 5; }
        else if (currentPartition === 100) { rows = 10; cols = 10; }

        html += `<div style="
          display: grid;
          width: 300px;
          height: 300px;
          grid-template-columns: repeat(${cols}, 1fr);
          grid-template-rows: repeat(${rows}, 1fr);
          gap: ${currentPartition === 100 ? '1px' : '3px'};
          background: var(--border-color);
          padding: 4px;
          border-radius: 8px;
          box-sizing: border-box;
        ">`;
        for (let i = 0; i < currentPartition; i++) {
          html += `<div class="grid-cell" data-idx="${i}"></div>`;
        }
        html += `</div>`;
      } else {
        html += generateCircleSVG(currentPartition);
      }

      html += `
        </div>
        <p style="text-align: center; font-weight: 700; margin-top: 14px; font-size: 1.1rem;">
          Shaded: <span id="cellCount" style="color: var(--accent);">0</span> / ${currentPartition} parts
        </p>
      `;

      container.innerHTML = html;

      container.querySelectorAll('.btn-partition').forEach(btn => {
        btn.onclick = () => {
          currentPartition = parseInt(btn.getAttribute('data-parts'));
          renderLayout();
        };
      });

      setupDragToShade(container);
    };

    renderLayout();
  },

  evaluate(q) {
    const activeCount = document.querySelectorAll('.grid-cell.active').length;
    const totalCells = document.querySelectorAll('.grid-cell').length;
    if (totalCells === 0) return false;

    const userRatio = activeCount / totalCells;
    return Math.abs(userRatio - q.targetRatio) < 0.001;
  }
};

function generateCircleSVG(n) {
  const cx = 150, cy = 150, r = 140;
  let svg = `<svg viewBox="0 0 300 300" width="300" height="300" style="display:block; margin:0 auto; width:100%; height:100%;">`;
  const angleStep = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) {
    const startAngle = i * angleStep - Math.PI / 2;
    const endAngle = (i + 1) * angleStep - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angleStep > Math.PI ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    svg += `<path d="${d}" class="grid-cell" data-idx="${i}"></path>`;
  }
  svg += `</svg>`;
  return svg;
}

function setupDragToShade(container) {
  const grid = container.querySelector('#touchGrid');
  let isDragging = false;
  let targetState = true;

  const updateCount = () => {
    const active = grid.querySelectorAll('.grid-cell.active').length;
    const countEl = document.getElementById('cellCount');
    if (countEl) countEl.innerText = active;
  };

  const processCell = (cell) => {
    if (cell && cell.classList.contains('grid-cell')) {
      cell.classList.toggle('active', targetState);
      updateCount();
    }
  };

  grid.onpointerdown = (e) => {
    if (!e.target.classList.contains('grid-cell')) return;
    isDragging = true;
    targetState = !e.target.classList.contains('active');
    processCell(e.target);
  };

  grid.ontouchmove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    processCell(elem);
  };

  window.onpointerup = () => { isDragging = false; };
}

registerQuestionType('grid_shader', gridShaderModule);
