// Tier 1 (⚪ White Belt): Single-Digit Addition
export function generateLevel1Question() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return {
    prompt: `${a} + ${b}`,
    answer: `${a + b}`
  };
}

// Tier 2 (🟡 Yellow Belt): Subtraction Within 20
export function generateLevel2Question() {
  const b = Math.floor(Math.random() * 9) + 1;
  const a = Math.floor(Math.random() * 10) + b; // Ensures positive result within 20
  return {
    prompt: `${a} - ${b}`,
    answer: `${a - b}`
  };
}

// Tier 3 (🟠 Orange Belt): Basic Multiplication (2x, 3x, 5x, 10x)
export function generateLevel3Question() {
  const basicFactors = [2, 3, 5, 10];
  const f1 = basicFactors[Math.floor(Math.random() * basicFactors.length)];
  const f2 = Math.floor(Math.random() * 10) + 1;
  const [a, b] = Math.random() < 0.5 ? [f1, f2] : [f2, f1];
  return {
    prompt: `${a} × ${b}`,
    answer: `${a * b}`
  };
}

// Tier 4 (🟢 Green Belt): Full Multiplication Tables (1x1 to 10x10)
export function generateLevel4Question() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    prompt: `${a} × ${b}`,
    answer: `${a * b}`
  };
}

// Tier 5 (🔵 Blue Belt): Simple Division Facts (Inverses of 1x1 to 10x10)
export function generateLevel5Question() {
  const divisor = Math.floor(Math.random() * 9) + 2; // 2 to 10
  const quotient = Math.floor(Math.random() * 10) + 1;
  const dividend = divisor * quotient;
  return {
    prompt: `${dividend} ÷ ${divisor}`,
    answer: `${quotient}`
  };
}

// Tier 6 (🟣 Purple Belt): Small Integer Addition & Subtraction (-10 to 10)
export function generateLevel6Question() {
  const isAddition = Math.random() < 0.5;
  const a = Math.floor(Math.random() * 21) - 10;
  const b = Math.floor(Math.random() * 21) - 10;

  const formatA = a < 0 ? `(${a})` : `${a}`;
  const formatB = b < 0 ? `(${b})` : `${b}`;

  if (isAddition) {
    return {
      prompt: `${formatA} + ${formatB}`,
      answer: `${a + b}`
    };
  } else {
    return {
      prompt: `${formatA} - ${formatB}`,
      answer: `${a - b}`
    };
  }
}

// Tier 7 (🔴 Red Belt): Small Powers & Roots (Squares <= 100, Roots <= 100, 2³, 3³)
export function generateLevel7Question() {
  const type = Math.floor(Math.random() * 3);

  if (type === 0) {
    const n = Math.floor(Math.random() * 10) + 1;
    return {
      prompt: `${n}²`,
      answer: `${n * n}`
    };
  } else if (type === 1) {
    const r = Math.floor(Math.random() * 10) + 1;
    return {
      prompt: `√${r * r}`,
      answer: `${r}`
    };
  } else {
    const base = Math.random() < 0.5 ? 2 : 3;
    return {
      prompt: `${base}³`,
      answer: `${Math.pow(base, 3)}`
    };
  }
}

// Tier 8 (🟤 Brown Belt): Simple FDP & Basic Percentages (10%, 50%, ½, ¼, ¾, ⅕)
export function generateLevel8Question() {
  const pool = [
    () => {
      const isTenPct = Math.random() < 0.5;
      if (isTenPct) {
        const mult = Math.floor(Math.random() * 9) + 1;
        const num = mult * 10;
        return { prompt: `10% of ${num}`, answer: `${num / 10}` };
      } else {
        const num = (Math.floor(Math.random() * 10) + 1) * 2;
        return { prompt: `50% of ${num}`, answer: `${num / 2}` };
      }
    },
    () => {
      const fdp = [
        { prompt: `½ as %`, answer: `50` },
        { prompt: `¼ as %`, answer: `25` },
        { prompt: `¾ as %`, answer: `75` },
        { prompt: `⅕ as %`, answer: `20` },
        { prompt: `⅒ as %`, answer: `10` }
      ];
      return fdp[Math.floor(Math.random() * fdp.length)];
    }
  ];

  const selected = pool[Math.floor(Math.random() * pool.length)];
  return selected();
}

// Tier 9 (⬛ Black Belt): Small Integer Multiplication & Division (-10 to 10)
export function generateLevel9Question() {
  const isMultiplication = Math.random() < 0.5;

  if (isMultiplication) {
    let a = Math.floor(Math.random() * 19) - 9;
    if (a === 0) a = -3;
    let b = Math.floor(Math.random() * 19) - 9;
    if (b === 0) b = 4;

    const formatA = a < 0 ? `(${a})` : `${a}`;
    const formatB = b < 0 ? `(${b})` : `${b}`;

    return {
      prompt: `${formatA} × ${formatB}`,
      answer: `${a * b}`
    };
  } else {
    let divisor = Math.floor(Math.random() * 17) - 8;
    if (divisor === 0) divisor = -2;
    let quotient = Math.floor(Math.random() * 17) - 8;
    if (quotient === 0) quotient = 3;

    const dividend = divisor * quotient;
    const formatDividend = dividend < 0 ? `(${dividend})` : `${dividend}`;
    const formatDivisor = divisor < 0 ? `(${divisor})` : `${divisor}`;

    return {
      prompt: `${formatDividend} ÷ ${formatDivisor}`,
      answer: `${quotient}`
    };
  }
}

// Tier 10 (🥋 Grandmaster): Mixed Review (Spiraled across Levels 1–9)
export function generateLevel10Question() {
  const generators = [
    generateLevel1Question,
    generateLevel2Question,
    generateLevel3Question,
    generateLevel4Question,
    generateLevel5Question,
    generateLevel6Question,
    generateLevel7Question,
    generateLevel8Question,
    generateLevel9Question
  ];

  const selected = generators[Math.floor(Math.random() * generators.length)];
  return selected();
}
