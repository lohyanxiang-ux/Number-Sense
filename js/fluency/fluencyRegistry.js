import { generateLevel1Question } from './questions/level1.js';

export function getFluencyQuestion(level = 1) {
  switch (Number(level)) {
    case 1:
    default:
      return generateLevel1Question();
  }
}
