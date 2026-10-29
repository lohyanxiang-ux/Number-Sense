export function formatMath(text) {
  return text.replace(/(\d+)\/(\d+)/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>');
}

const registry = {};

export function registerQuestionType(typeKey, module) {
  registry[typeKey] = module;
}

// Adaptive Weighted Question Selection
export function getAdaptiveQuestion(proficiencyMap = {}) {
  const keys = Object.keys(registry);
  if (keys.length === 0) return null;

  const weights = keys.map(key => {
    const history = proficiencyMap[key] || [];
    if (history.length === 0) return 2; // Default weight for untried topics

    const score = history.reduce((sum, val) => sum + val, 0);
    const accuracy = score / history.length;

    // High proficiency (4/5 or 5/5) -> Low weight (1)
    // Low proficiency (< 4/5) -> High weight (4)
    return accuracy >= 0.8 ? 1 : 4;
  });

  // Weighted random pick
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < keys.length; i++) {
    if (random < weights[i]) {
      return registry[keys[i]].generate();
    }
    random -= weights[i];
  }

  return registry[keys[0]].generate();
}

export function evaluateQuestion(questionObj) {
  return registry[questionObj.type].evaluate(questionObj);
}

export function renderQuestion(questionObj, containerEl) {
  registry[questionObj.type].render(questionObj, containerEl);
}
