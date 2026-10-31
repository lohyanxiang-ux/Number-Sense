import { registerQuestionType, formatMath } from './registry.js';

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
    // Flat pool where every single question type has an equal probability
    const questionPool = [
      // 1. 100-Grid Percentage (e.g. 12%)
      () => {
        const targetCount = Math.floor(Math.random() * 92) + 3;
        return {
          type: 'grid_shader',
          prompt: `Shade <strong>${formatMath(targetCount + '%')}</strong> of the 100-grid below:`,
          targetRatio: targetCount / 100,
          partition: 100,
          shape: 'square',
          explanation: formatMath(`${targetCount}% means exactly ${targetCount} parts shaded out of 100 (${targetCount}/100).`)
        };
      },

      // 2. 100-Grid Decimal (e.g. 0.12)
      () => {
        const targetCount = Math.floor(Math.random() * 92) + 3;
        const decStr = (targetCount / 100).toFixed(2);
        return {
          type: 'grid_shader',
          prompt: `Shade <strong>${formatMath(decStr)}</strong> of the 100-grid below:`,
          targetRatio: targetCount / 100,
          partition: 100,
          shape: 'square',
          explanation: formatMath(`${decStr} is equal to ${targetCount}/100 or ${targetCount}%, which means ${targetCount} shaded squares out of 100.`)
        };
      },

      // 3. 100-Grid Fraction (e.g. 12/100)
      () => {
        const targetCount = Math.floor(Math.random() * 92) + 3;
        return {
          type: 'grid_shader',
          prompt: `Shade <strong>${formatMath(targetCount + '/100')}</strong> of the 100-grid below:`,
          targetRatio: targetCount / 100,
          partition: 100,
          shape: 'square',
          explanation: formatMath(`${targetCount}/100 means ${targetCount} shaded squares out of a total of 100 squares.`)
        };
      },

      // 4–15. Standard Multi-Partition Templates
      ...[
        // Fractions
        { targetStr: '1/2', ratio: 0.5, partitions: [2, 4, 6, 8, 10, 12], exp: '1/2 means half of the shape. On 6 parts shade 3, on 8 shade 4, or on 12 shade 6.' },
        { targetStr: '3/4', ratio: 0.75, partitions: [4, 8, 12], exp: '3/4 is equivalent to 6/8 or 9/12.' },
        { targetStr: '1/3', ratio: 1/3, partitions: [3, 6, 9, 12], exp: '1/3 is equivalent to 2/6, 3/9, or 4/12.' },
        { targetStr: '2/3', ratio: 2/3, partitions: [3, 6, 9, 12], exp: '2/3 is equivalent to 4/6, 6/9, or 8/12.' },
        { targetStr: '2/5', ratio: 0.4, partitions: [5, 10], exp: '2/5 is equivalent to 4/10.' },
        { targetStr: '3/5', ratio: 0.6, partitions: [5, 10], exp: '3/5 is equivalent to 6/10.' },

        // Decimals
        { targetStr: '0.5', ratio: 0.5, partitions: [2, 4, 6, 8, 10, 12], exp: '0.5 is equal to 1/2. On an 8-part shape, shade 4 parts.' },
        { targetStr: '0.25', ratio: 0.25, partitions: [4, 8, 12], exp: '0.25 is equal to 1/4. On an 8-part shape, shade 2 parts.' },
        { targetStr: '0.4', ratio: 0.4, partitions: [5, 10], exp: '0.4 is equal to 2/5 or 4/10.' },

        // Percentages
        { targetStr: '50%', ratio: 0.5, partitions: [2, 4, 6, 8, 10, 12], exp: '50% represents half of the total shape.' },
        { targetStr: '25%', ratio: 0.25, partitions: [4, 8, 12], exp: '25% is 1/4. On 8 parts, shade 2 parts.' },
        { targetStr: '20%', ratio: 0.2, partitions: [5, 10], exp: '20% is 1/5. On 10 parts, shade 2 parts.' }
      ].map(t => () => {
        const randomPartition = t.partitions[Math.floor(Math.random() * t.partitions.length)];
        const randomShape = Math.random() < 0.5 ? 'square' : 'circle';
        return {
          type: 'grid_shader',
          prompt: `Represent <strong>${formatMath(t.targetStr)}</strong> by shading the shape below:`,
          targetRatio: t.ratio,
          partition: randomPartition,
          shape: randomShape,
          explanation: formatMath(t.exp)
        };
      })
    ];

    // Pick uniformly across all 15 question types
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
        background: var(--border-color);
        padding: 4px;
        border-radius: 8px;
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
      <div class="ipad-responsive-grid" style="user-select: none;">
        
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
