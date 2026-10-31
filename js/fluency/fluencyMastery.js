export function getStudentFluencyData(currentUser) {
  if (!currentUser.fluency) {
    currentUser.fluency = {
      level: 1,
      xp: 0,
      recentHistory: []
    };
  }
  return currentUser.fluency;
}

export function evaluateLevelProgression(currentUser, sessionResults) {
  const data = getStudentFluencyData(currentUser);
  
  // Store session performance metrics
  data.recentHistory.push({
    accuracy: sessionResults.accuracy,
    avgSpeed: Number(sessionResults.avgSpeed)
  });
  data.recentHistory = data.recentHistory.slice(-5); // Keep last 5 sessions

  let message = "";
  let leveledUp = false;

  // Level Up Criteria: 5+ questions answered, >= 90% accuracy, and average speed under 2.5s per question
  if (sessionResults.totalQuestions >= 5 && sessionResults.accuracy >= 90 && Number(sessionResults.avgSpeed) <= 2.5) {
    if (data.level < 10) {
      data.level += 1;
      leveledUp = true;
      message = `🎉 Level Up! You advanced to Level ${data.level}!`;
    } else {
      message = `🔥 Level 10 Mastered! Outstanding speed!`;
    }
  } else if (sessionResults.accuracy < 50 && data.recentHistory.length >= 3) {
    // Drop level if struggling consistently
    const recentAcc = data.recentHistory.reduce((a, b) => a + b.accuracy, 0) / data.recentHistory.length;
    if (recentAcc < 50 && data.level > 1) {
      data.level -= 1;
      message = `⚠️ Difficulty adjusted down to Level ${data.level} for practice.`;
    }
  }

  return { currentLevel: data.level, leveledUp, message };
}
