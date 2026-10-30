import { registerQuestionType, formatMath } from './registry.js';

const negativeNumbersModule = {
  generate() {
    const questionTypes = ['scenario', 'compare', 'opposite'];
    const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    if (selectedType === 'scenario') {
      const scenarios = [
        { text: 'A submarine is swimming <strong>6 metres below sea level</strong>. What number represents its depth?', target: -6, unit: 'm' },
        { text: 'The temperature in a freezer is <strong>4°C below freezing (0°C)</strong>. What is the temperature?', target: -4, unit: '°C' },
        { text: 'A basement car park is <strong>2 floors below the ground floor (Level 0)</strong>. What floor is it on?', target: -2, unit: 'Level' },
        { text: 'A bank balance has a <strong>$9 debt (overdrawn)</strong>. What number represents this balance?', target: -9, unit: '$' },
        { text: 'A bird is flying <strong>5 metres above sea level</strong>. What number represents its height?', target: 5, unit: 'm' }
      ];
      const s = scenarios[Math.floor(Math.random() * scenarios.length)];
      return {
        type: 'negative_numbers',
        subType: 'scenario',
        prompt: s.text,
        targetVal: s.target,
        unit: s.unit,
        explanation: `${s.target < 0 ? 'Below' : 'Above'} zero is represented by the signed integer <strong>${s.target}</strong>.`
      };
    }

    if (selectedType === 'compare') {
      const pairs = [
        { a: -7, b: -2, question: 'Which temperature is <strong>COLDER (lower)</strong>?', target: -7 },
        { a: -5, b: -8, question: 'Which bank balance represents a <strong>GREATER DEBT</strong> (smaller value)?', target: -8 },
        { a: -3, b: -1, question: 'Which depth is <strong>CLOSER to sea level (greater value)</strong>?', target: -1 },
        { a: -6, b: 2, question: 'Which number is <strong>GREATER</strong>?', target: 2 }
      ];
      const p = pairs[Math.floor(Math.random() * pairs.length)];
      return {
        type: 'negative_numbers',
        subType: 'compare',
        prompt: p.question,
        options: [p.a, p.b].sort(() => Math.random() - 0.5),
        targetVal: p.target,
        explanation: `On a number line, numbers further to the left (or lower down) are smaller. Therefore, <strong>${p.target}</strong> is the correct answer.`
      };
    }

    // Opposite recognition
    const num = (Math.floor(Math.random() * 8) + 1) * (Math.random() < 0.5 ? 1 : -1);
    const targetOpp = -num;
    return {
      type: 'negative_numbers',
      subType: 'opposite',
      prompt: `What is the <strong>exact opposite</strong> of <strong>${num > 0 ? '+' + num : num}</strong> across zero?`,
      targetVal: targetOpp,
      explanation: `The opposite of ${num} is <strong>${targetOpp}</strong> because both are exactly ${Math.abs(num)} units away from 0 in opposite directions.`
    };
  },

  render(q, container) {
    if (q.subType === 'scenario' || q.subType === 'opposite') {
      const minVal = -10;
      const maxVal = 10;

      let html = `
        <div style="text-align: center; margin: 20px 0;">
          <div style="
            display: inline-flex;
            gap: 4px;
            overflow-x: auto;
            max-width: 100%;
            padding: 16px;
            background: var(--bg-primary);
            border-radius: var(--radius);
            border: 2px solid var(--border-color);
          ">
      `;

      for (let v = minVal; v <= maxVal; v++) {
        const isZero = v === 0;
        const btnStyle = isZero 
          ? 'background: var(--accent); color: white; border-color: var(--accent);' 
          : 'background: var(--bg-card); color: var(--text-main); border-color: var(--border-color);';

        html += `
          <button class="neg-num-card" data-val="${v}" style="
            min-width: 42px;
            height: 50px;
            border: 2px solid;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            transition: all 0.15s ease;
            ${btnStyle}
          ">${v > 0 ? '+' + v : v}</button>
        `;
      }

      html += `
          </div>
          <p style="margin-top: 16px; font-weight: 700; font-size: 1.1rem; color: var(--text-muted);">
            Selected Number: <span id="selectedNegNum" style="color: var(--accent); font-size: 1.4rem;">--</span>
          </p>
        </div>
      `;

      container.innerHTML = html;

      container.querySelectorAll('.neg-num-card').forEach(btn => {
        btn.onclick = () => {
          container.querySelectorAll('.neg-num-card').forEach(b => {
            const isZ = b.getAttribute('data-val') === '0';
            b.style.borderColor = isZ ? 'var(--accent)' : 'var(--border-color)';
            b.style.background = isZ ? 'var(--accent)' : 'var(--bg-card)';
            b.style.color = isZ ? 'white' : 'var(--text-main)';
            b.classList.remove('selected');
          });

          btn.style.borderColor = 'var(--accent)';
          btn.style.background = 'var(--accent)';
          btn.style.color = 'white';
          btn.classList.add('selected');

          document.getElementById('selectedNegNum').innerText = btn.getAttribute('data-val');
        };
      });

    } else if (q.subType === 'compare') {
      let html = `
        <div style="display: flex; gap: 20px; justify-content: center; margin: 30px 0;">
      `;

      q.options.forEach(opt => {
        html += `
          <div class="neg-compare-card" data-val="${opt}" style="
            background: var(--bg-primary);
            border: 3px solid var(--border-color);
            border-radius: var(--radius);
            width: 130px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 800;
            cursor: pointer;
            user-select: none;
            -webkit-user-select: none;
            transition: all 0.15s ease;
          ">
            ${opt > 0 ? '+' + opt : opt}
          </div>
        `;
      });

      html += `</div>`;
      container.innerHTML = html;

      container.querySelectorAll('.neg-compare-card').forEach(card => {
        card.onclick = () => {
          container.querySelectorAll('.neg-compare-card').forEach(c => {
            c.style.borderColor = 'var(--border-color)';
            c.style.background = 'var(--bg-primary)';
            c.classList.remove('selected');
          });

          card.style.borderColor = 'var(--accent)';
          card.style.background = 'rgba(79, 70, 229, 0.12)';
          card.classList.add('selected');
        };
      });
    }
  },

  evaluate(q) {
    const selected = document.querySelector('.neg-num-card.selected, .neg-compare-card.selected');
    if (!selected) return false;
    const userVal = parseInt(selected.getAttribute('data-val'), 10);
    return userVal === q.targetVal;
  }
};

registerQuestionType('negative_numbers', negativeNumbersModule);
