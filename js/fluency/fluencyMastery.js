export const BELT_TIERS = {
  1: { name: 'White Belt', badge: '⚪', tier: 1 },
  2: { name: 'Yellow Belt', badge: '🟡', tier: 2 },
  3: { name: 'Orange Belt', badge: '🟠', tier: 3 },
  4: { name: 'Green Belt', badge: '🟢', tier: 4 },
  5: { name: 'Blue Belt', badge: '🔵', tier: 5 },
  6: { name: 'Purple Belt', badge: '🟣', tier: 6 },
  7: { name: 'Red Belt', badge: '🔴', tier: 7 },
  8: { name: 'Brown Belt', badge: '🟤', tier: 8 },
  9: { name: 'Black Belt', badge: '⬛', tier: 9 },
  10: { name: 'Grandmaster', badge: '🥋', tier: 10 }
};

export function getStudentFluencyData(currentUser) {
  if (!currentUser || !currentUser.proficiency) {
    return { level: 1, lastSpeed: 0, lastAccuracy: 0 };
  }

  // Fallback check across both 'fluency' and 'Prof_fluency' keys
  const rawHistory = currentUser.proficiency['fluency'] || currentUser.proficiency['Prof_fluency'] || [];

  const level = rawHistory.length > 0 && !isNaN(Number(rawHistory[0])) ? Number(rawHistory[0]) : 1;
  const speed = rawHistory.length > 1 && !isNaN(Number(rawHistory[1])) ? Number(rawHistory[1]) : 0;
  const accuracy = rawHistory.length > 2 && !isNaN(Number(rawHistory[2])) ? Number(rawHistory[2]) : 0;

  return {
    level: level,
    lastSpeed: speed,
    lastAccuracy: accuracy
  };
}

export function evaluateLevelProgression(currentUser, sessionResults) {
  const currentData = getStudentFluencyData(currentUser);
  let currentLevel = currentData.level;
  let message = "";
  let leveledUp = false;

  const meetsAccuracy = sessionResults.accuracy >= 90;
  const meetsSpeed = Number(sessionResults.avgSpeed) <= 2.5 && Number(sessionResults.avgSpeed) > 0;
  const meetsQuestions = sessionResults.totalQuestions >= 5;

  if (meetsAccuracy && meetsSpeed && meetsQuestions) {
    if (currentLevel < 10) {
      currentLevel += 1;
      leveledUp = true;
      const newBelt = BELT_TIERS[currentLevel];
      message = `🎉 BELT PROMOTION! You unlocked the ${newBelt.badge} ${newBelt.name}!`;
    } else {
      message = `🥋 GRANDMASTER STATUS! Top speed and accuracy maintained!`;
    }
  } else {
    message = `Keep training! Target: ≥ 90% accuracy and < 2.5s / question.`;
  }

  // Store metrics array [level, avgSpeed, accuracy] under 'fluency' for Column I sync
  currentUser.proficiency['fluency'] = [currentLevel, sessionResults.avgSpeed, sessionResults.accuracy];

  return { currentLevel, leveledUp, message };
}
