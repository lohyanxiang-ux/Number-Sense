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
  if (!currentUser.proficiency) currentUser.proficiency = {};

  // Prof_fluency stores [level, lastAvgSpeed, lastAccuracy] in Google Sheet Col I
  const rawHistory = currentUser.proficiency['fluency'] || [1, 0, 0];

  return {
    level: Number(rawHistory[0]) || 1,
    lastSpeed: Number(rawHistory[1]) || 0,
    lastAccuracy: Number(rawHistory[2]) || 0
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

  // Save latest metrics directly into proficiency map for Google Sheet sync (Col I)
  currentUser.proficiency['fluency'] = [currentLevel, sessionResults.avgSpeed, sessionResults.accuracy];

  return { currentLevel, leveledUp, message };
}
