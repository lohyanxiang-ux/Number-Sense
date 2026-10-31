import { generateLevel1Question } from './questions/level1.js';
// Add future level imports here (e.g., import { generateLevel2Question } from './questions/level2.js';)

const levelGenerators = {
  1: generateLevel1Question,
  // 2: generateLevel2Question,
  // 3: generateLevel3Question,
  // ...
};

export function getFluencyQuestion(currentLevel = 1) {
  const levelNum = Number(currentLevel) || 1;
  let targetLevel = levelNum;

  // Spiraling logic: 25% chance to review an earlier unlocked belt level
  if (levelNum > 1 && Math.random() < 0.25) {
    targetLevel = Math.floor(Math.random() * (levelNum - 1)) + 1;
  }

  // Fallback to highest available generator if target generator isn't loaded yet
  const generatorFn = levelGenerators[targetLevel] || levelGenerators[1];
  return generatorFn();
}
