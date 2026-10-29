import { registerQuestionType, formatMath } from './registry.js';

const gridShaderModule = {
  generate() {
    const templates = [
      // Fractions
      { type: 'frac', targetStr: '3/5', num: 3, den: 5, initialRows: 1, initialCols: 5, exp: '3/5 means 3 shaded out of 5 equal parts (or 6 out of 10).' },
      { type: 'frac', targetStr: '3/4', num: 3, den: 4, initialRows: 1, initialCols: 4, exp: '3/4 means 3 shaded out of 4 equal parts.' },
      { type: 'frac', targetStr: '7/10', num: 7, den: 10, initialRows: 2, initialCols: 5, exp: '7/10 means 7 shaded out of 10 equal parts.' },
      
      // Decimals
      { type: 'dec', targetStr: '0.4', decimalVal: 0.4, initialRows: 1, initialCols: 5, exp: '0.4 is equivalent to 4/10 or 2/5 of the shape.' },
      { type: 'dec', targetStr: '0.75', decimalVal: 0.75, initialRows: 2, initialCols: 4, exp: '0.75 is equal to 75% or 3/4 of the whole.' },
      { type: 'dec', targetStr: '0.3', decimalVal: 0.3, initialRows: 1, initialCols: 10, exp: '0.3 is equal to 3/10 (3 out of 10 equal parts).' },
      
      // Percentages
      { type: 'pct', targetStr: '60%', pctVal: 60, initialRows: 2, initialCols: 5, exp: '60% means 60 out of 100, which simplifies to 3 out of 5 parts.' },
      { type: 'pct', targetStr: '25%', pctVal: 25, initialRows: 2, initialCols: 2, exp: '25% represents 1 out of 4 equal parts (1/4).' },
      { type: 'pct', targetStr: '80%', pctVal: 80, initialRows: 1, initialCols: 5, exp: '80% is equivalent to 4/5 of the total area.' }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    return {
      type: 'grid_shader',
      prompt: `Shade <strong>${formatMath(t.targetStr)}</strong> of the shape below:`,
      template: t,
      explanation: formatMath(t.exp)
    };
  },

  render(q, container) {
    let currentRows = q.template.initialRows;
    let currentCols = q.template.initialCols;

    const renderGrid = () => {
      const totalCells = currentRows * currentCols;
      let html = `
        <div class="grid-controls">
          <span>Partitions: <strong>${totalCells} parts</strong> (${currentRows}x${currentCols})</span>
          <button class="btn" id="btnLessParts" style="width: auto; padding: 4px 12px;">- Cut Less</button>
          <button class="btn" id="btnMoreParts" style="width: auto; padding: 4px 12px;">+ Cut More</button>
        </div>
        <div class="grid-container" id="touchGrid" style="grid-template-columns: repeat(${currentCols}, 1fr);">
      `;

      for (let i = 0; i < totalCells; i++) {
        html += `<div class="grid-cell" data-idx="${i}"></div>`;
      }
      html += `</div><p style="text-align: center; font-weight: 700;">Shaded: <span id="cellCount">0</span> / ${totalCells}</p>`;
      container.innerHTML = html;

      // Add Partition Controls
      document.getElementById('btnLessParts').onclick = () => {
        if (currentCols > 2) { currentCols /= 2; renderGrid(); }
      };
      document.getElementById('btnMoreParts').onclick = () => {
        if (currentCols * 2 <= 20) { currentCols *= 2; renderGrid(); }
      };

      // Touch & Drag-to-Shade Engine
      setupDragToShade(container, totalCells);
    };

    renderGrid();
  },

  evaluate(q) {
    const activeCount = document.querySelectorAll('.grid-cell.active').length;
    const totalCells = document.querySelectorAll('.grid-cell').length;
    const userRatio = activeCount / totalCells;

    let targetRatio = 0;
    if (q.template.type === 'frac') targetRatio = q.template.num / q.template.den;
    if (q.template.type === 'dec') targetRatio = q.template.decimalVal;
    if (q.template.type === 'pct') targetRatio = q.template.pctVal / 100;

    return Math.abs(userRatio - targetRatio) < 0.01;
  }
};

// iPad Pointer & Drag-to-Shade Controller
function setupDragToShade(container, totalCells) {
  const grid = container.querySelector('#touchGrid');
  let isDragging = false;
  let targetState = true; // true = shading, false = erasing

  const updateCount = () => {
    const active = grid.querySelectorAll('.grid-cell.active').length;
    document.getElementById('cellCount').innerText = active;
  };

  const processCell = (cell) => {
    if (cell && cell.classList.contains('grid-cell')) {
      cell.classList.toggle('active', targetState);
      updateCount();
    }
  };

  // Pointer Events (Mouse / Touch)
  grid.onpointerdown = (e) => {
    if (!e.target.classList.contains('grid-cell')) return;
    isDragging = true;
    targetState = !e.target.classList.contains('active');
    processCell(e.target);
  };

  // Dragging across cells on iPad touch screens
  grid.ontouchmove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Stop iPad scroll during drag
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    processCell(elem);
  };

  window.onpointerup = () => { isDragging = false; };
}

registerQuestionType('grid_shader', gridShaderModule);
