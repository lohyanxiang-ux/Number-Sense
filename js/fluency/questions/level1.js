// LEVEL 1: Basic Addition & Subtraction Facts (Sums <= 20)
export function generateLevel1Question() {
  const isAddition = Math.random() < 0.5;

  if (isAddition) {
    const a = Math.floor(Math.random() * 10) + 1; // 1 to 10
    const b = Math.floor(Math.random() * 10) + 1; // 1 to 10
    return {
      prompt: `${a} + ${b} = ?`,
      answer: a + b,
      level: 1,
      type: 'addition_level1'
    };
  } else {
    const a = Math.floor(Math.random() * 12) + 4; // 4 to 15
    const b = Math.floor(Math.random() * a) + 1;  // 1 to a (ensures positive answer)
    return {
      prompt: `${a} - ${b} = ?`,
      answer: a - b,
      level: 1,
      type: 'subtraction_level1'
    };
  }
}
