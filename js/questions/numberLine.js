import { registerQuestionType } from './registry.js';

// Renders clean, vertically-stacked HTML fractions with a horizontal bar
function renderFrac(num, den) {
  return `<span style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; line-height: 1.1; font-weight: 800; padding: 0 4px;">` +
         `<span style="border-bottom: 2px solid currentColor; padding: 0 4px; display: block;">${num}</span>` +
         `<span style="padding: 0 4px; display: block;">${den}</span>` +
         `</span>`;
}

// Calculate balanced grid dimensions for square shapes
function getSquareGridDimensions(parts) {
  if (parts === 4) return { rows: 2, cols: 2 };
  if (parts === 6) return { rows: 2, cols: 3 };
  if (parts === 8) return { rows: 2, cols: 4 };
  if (parts === 9) return { rows: 3, cols: 3 };
  if (parts === 10) return { rows: 2, cols: 5 };
  if (parts === 12) return { rows: 3, cols: 4 };
  if (parts === 100) return { rows: 10, cols: 10 };
  return { rows: 1, cols: parts }; // Fallback for 2, 3, 5, etc.
}

const gridShaderModule = {
  generate() {
    const questionPool = [
      // 1. 100-Grid Percentage (e.g. 12%)
      () => {
        const targetCount = Math.floor(Math.random() * 92) + 3;
        const pctStr = `${targetCount}%`;
        const partition = 100;
        return {
          type: 'grid_shader',
          prompt: `Represent <strong>${pctStr}</strong> by shading the shape below:`,
          targetRatio: targetCount / partition,
          partition: partition,
          shape: 'square',
          explanation: `${pctStr} = ${renderFrac(targetCount, partition)}. Shade ${targetCount} out of ${partition} equal parts.`
        };
      },

      // 2. 100-Grid Decimal (e.g. 0.12)
      () => {
        const targetCount = Math.floor(Math.random() * 92) + 3;
        const decStr = (targetCount / 100).toFixed(2);
        const partition = 100;
        return {
          type: 'grid_shader',
          prompt: `Represent <strong>${decStr}</strong> by shading the shape below:`,
          targetRatio: targetCount / partition,
          partition: partition,
          shape: 'square',
          explanation: `${decStr} = ${renderFrac(targetCount, partition)}. Shade ${targetCount} out of ${partition} equal parts.`
        };
      },

      // 3. 100-Grid Fraction (e.g. 12/100)
      () => {
        const targetCount = Math.floor(Math.random() * 92) + 3;
        const partition = 100;
        const fracHtml = renderFrac(targetCount, partition);
        return {
          type: 'grid_shader',
          prompt: `Represent <strong>${fracHtml}</strong> by shading the shape below:`,
          targetRatio: targetCount / partition,
          partition: partition,
          shape: 'square',
          explanation: `${fracHtml}. Shade ${targetCount} out of ${partition} equal parts.`
        };
      },

      // 4–16. Standard Multi-Partition Templates
      ...[
        // Fractions
        { num: 1, den: 2, ratio: 0.5, partitions: [2, 4, 6, 8, 10, 12], type: 'frac' },
        { num: 3, den: 4, ratio: 0.75, partitions: [4, 8, 12], type: 'frac' },
        { num: 1, den: 3, ratio: 1/3, partitions: [3, 6, 9, 12], type: 'frac' },
        { num: 2, den: 3, ratio: 2/3, partitions: [3, 6, 9, 12], type: 'frac' },
        { num: 2, den: 5, ratio: 0.4, partitions: [5, 10], type: 'frac' },
        { num: 3, den: 5, ratio: 0.6, partitions: [5, 10], type: 'frac' },

        // Decimals
        { valStr: '0.5', baseNum: 5, baseDen: 10, ratio: 0.5, partitions: [2, 4, 6, 8, 10, 12], type: 'dec' },
        { valStr: '0.25', baseNum: 25, baseDen: 100, ratio: 0.25, partitions: [4, 8, 12], type: 'dec' },
        { valStr: '0.2', baseNum: 2, baseDen: 10, ratio: 0.2, partitions: [5, 10], type: 'dec' },
        { valStr: '0.4', baseNum: 4, baseDen: 10, ratio: 0.4, partitions: [5, 10], type: 'dec' },

        // Percentages
        { valStr: '50%', baseNum: 50, baseDen: 100, ratio: 0.5, partitions: [2, 4, 6, 8, 10, 12], type: 'pct' },
        { valStr: '25%', baseNum: 25, baseDen: 100, ratio: 0.25, partitions: [4, 8, 12], type: 'pct' },
        { valStr: '20%', baseNum: 20, baseDen: 100, ratio: 0.2, partitions: [5, 10], type: 'pct' }
      ].map(t => () => {
        const randomPartition = t.partitions[Math.floor(Math.random() * t.partitions.length)];
        const randomShape = Math.random() < 0.5 ? 'square' : 'circle';
        const shadedCount = Math.round(t.ratio * randomPartition);

        let promptHtml = '';
        let explanationText = '';

        if (t.type === 'frac') {
          const targetFracHtml = renderFrac(t.num, t.den);
          promptHtml = `Represent <strong>${targetFracHtml}</strong> by shading the shape below:`;
          
          if (t.den === randomPartition) {
            explanationText = `${targetFracHtml}. Shade ${shadedCount} out of ${randomPartition} equal parts.`;
          } else {
            explanationText = `${targetFracHtml} = ${renderFrac(shadedCount, randomPartition)}. Shade ${shadedCount} out of ${randomPartition} equal parts.`;
          }
        } else if (t.type === 'dec') {
          promptHtml = `Represent <strong>${t.valStr}</strong> by shading the shape below:`;
          const baseFracHtml = renderFrac(t.baseNum, t.baseDen);
          
          if (t.baseDen === randomPartition) {
            explanationText = `${t.valStr} = ${baseFracHtml}. Shade ${shadedCount} out of ${randomPartition} equal parts.`;
          } else {
            explanationText = `${t.valStr} = ${baseFracHtml} = ${renderFrac(shadedCount, randomPartition)}. Shade ${shadedCount} out of ${randomPartition} equal parts.`;
          }
        } else if (t.type === 'pct') {
          promptHtml = `Represent <strong>${t.valStr}</strong> by shading the shape below:`;
          const baseFracHtml = renderFrac(t.baseNum, t.baseDen);
          
          if (t.baseDen === randomPartition) {
            explanationText = `${t.valStr} = ${baseFracHtml}. Shade ${shadedCount} out of ${randomPartition} equal parts.`;
          } else {
            explanationText = `${t.valStr} = ${baseFracHtml} = ${renderFrac(shadedCount, randomPartition)}. Shade ${shadedCount} out of ${randomPartition} equal parts.`;
          }
        }

        return {
          type: 'grid_shader',
          prompt: promptHtml,
          targetRatio: t.ratio,
          partition: randomPartition,
          shape: randomShape,
          explanation: explanationText
        };
      })
    ];

    // Pick uniformly across all question types
    const selectedGenerator = questionPool[Math.floor(Math.random() * questionPool.length)];
    return selectedGenerator();
  },

  render(q, container) {
    let gridInnerHtml = '';

    if (q.shape === 'square') {
      const { rows, cols } = getSquareGridDimensions(q.partition);

      gridInnerHtml += `<div style="
        display: grid;
        width: 300px;
        height: 300px;
        grid-template-columns: repeat(${cols}, 1fr);
        grid-template-rows: repeat(${rows}, 1fr);
        gap: ${q.partition === 100 ? '1px' : '3px'};
        background: var(--border-color, #cbd5e1);
        padding: 4px;
        border-radius: 12px;
        box-sizing: border-box;
      ">`;
      for (let i = 0; i < q.partition; i++) {
        gridInnerHtml += `<div class="grid-cell" data-idx="${i}"></div>`;
      }
      gridInnerHtml += `</div>`;
    } else {
      gridInnerHtml += generateCircleSVG(q.partition);
    }

    const html = `
      <style>
        .grid-cell {
          background-color: #ffffff !important;
          fill: #ffffff !important;
          stroke: #334155 !important;
          stroke-width: 2px !important;
          cursor: pointer;
          transition: background-color 0.15s ease, fill 0.15s ease;
          touch-action: none;
        }
        .grid-cell.active {
          background-color: var(--accent, #4f46e5) !important;
          fill: var(--accent, #4f46e5) !important;
        }
      </style>

      <div class="ipad-responsive-grid" style="user-select: none; -webkit-user-select: none;">
        
        <!-- LEFT COLUMN: INTERACTIVE SHAPED GRID -->
        <div class="ipad-left-pane">
          <div class="fixed-area-box" id="touchGrid" style="
            width: 300px;
            height: 300px;
            margin: 0 auto;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
          ">
            ${gridInnerHtml}
          </div>
        </div>

        <!-- RIGHT COLUMN: SHADED COUNTER & PROGRESS -->
        <div class="ipad-right-pane" style="text-align: center;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
            Parts Shaded:
          </div>
          
          <div style="font-size: 2.2rem; font-weight: 900; color: var(--accent); margin-bottom: 14px;">
            <span id="cellCount">0</span> / ${q.partition}
          </div>
        </div>

      </div>
    `;

    container.innerHTML = html;
    setupDragToShade(container);
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
  let lastProcessedCell = null;

  const updateCount = () => {
    const active = grid.querySelectorAll('.grid-cell.active').length;
    const countEl = document.getElementById('cellCount');
    if (countEl) countEl.innerText = active;
  };

  const processCell = (cell) => {
    if (cell && cell.classList.contains('grid-cell') && cell !== lastProcessedCell) {
      lastProcessedCell = cell;
      cell.classList.toggle('active', targetState);
      updateCount();
    }
  };

  const getCellFromPoint = (x, y) => {
    const elem = document.elementFromPoint(x, y);
    return elem && elem.classList.contains('grid-cell') ? elem : null;
  };

  grid.onpointerdown = (e) => {
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    isDragging = true;
    lastProcessedCell = null;
    targetState = !cell.classList.contains('active');
    processCell(cell);
  };

  grid.onpointermove = (e) => {
    if (!isDragging) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    processCell(cell);
  };

  window.onpointerup = () => {
    isDragging = false;
    lastProcessedCell = null;
  };
}

registerQuestionType('grid_shader', gridShaderModule);
