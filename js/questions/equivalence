import { registerQuestionType, formatMath } from './registry.js';

const equivalenceModule = {
  generate() {
    return {
      type: 'equivalence',
      prompt: 'Tap the 3 equivalent representations of the same quantity:',
      cards: [
        { label: '1/2', match: true }, { label: '0.5', match: true }, { label: '50%', match: true },
        { label: '0.25', match: false }, { label: '75%', match: false }, { label: '1/4', match: false }
      ],
      explanation: formatMath('1/2, 0.5, and 50% all represent exactly half of a whole unit.')
    };
  },

  render(q, container) {
    let cardHtml = '<div class="eq-grid">';
    q.cards.forEach((c, idx) => {
      cardHtml += `<div class="eq-card" data-idx="${idx}">${formatMath(c.label)}</div>`;
    });
    cardHtml += '</div>';
    container.innerHTML = cardHtml;

    container.querySelectorAll('.eq-card').forEach(card => {
      card.onclick = () => card.classList.toggle('selected');
    });
  },

  evaluate(q) {
    const selected = document.querySelectorAll('.eq-card.selected');
    let correctCount = 0;
    selected.forEach(card => {
      const idx = card.getAttribute('data-idx');
      if (q.cards[idx].match) correctCount++;
    });
    return (selected.length === 3 && correctCount === 3);
  }
};

registerQuestionType('equivalence', equivalenceModule);
