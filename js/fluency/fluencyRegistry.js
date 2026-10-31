import {
  generateLevel1Question,
  generateLevel2Question,
  generateLevel3Question,
  generateLevel4Question,
  generateLevel5Question,
  generateLevel6Question,
  generateLevel7Question,
  generateLevel8Question,
  generateLevel9Question,
  generateLevel10Question
} from './questions/levelGenerators.js';

const levelGenerators = {
  1: generateLevel1Question,
  2: generateLevel2Question,
  3: generateLevel3Question,
  4: generateLevel4Question,
  5: generateLevel5Question,
  6: generateLevel6Question,
  7: generateLevel7Question,
  8: generateLevel8Question,
  9: generateLevel9Question,
  10: generateLevel10Question
};

export function getFluencyQuestion(currentLevel = 1) {
  const levelNum = Number(currentLevel) || 1;
  let targetLevel = levelNum;

  // Cumulative Spiraling: 25% chance to review an earlier unlocked belt tier
  if (levelNum > 1 && Math.random() < 0.25) {
    targetLevel = Math.floor(Math.random() * (levelNum - 1)) + 1;
  }

  const generatorFn = levelGenerators[targetLevel] || levelGenerators[1];
  return generatorFn();
}
