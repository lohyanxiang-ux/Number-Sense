export const BELT_TIERS = {
  1:  { tier: 1,  name: "White Belt",    badge: "⚪", color: "#f8fafc" },
  2:  { tier: 2,  name: "Yellow Belt",   badge: "🟡", color: "#eab308" },
  3:  { tier: 3,  name: "Orange Belt",   badge: "🟠", color: "#f97316" },
  4:  { tier: 4,  name: "Green Belt",    badge: "🟢", color: "#10b981" },
  5:  { tier: 5,  name: "Blue Belt",     badge: "🔵", color: "#3b82f6" },
  6:  { tier: 6,  name: "Purple Belt",   badge: "🟣", color: "#a855f7" },
  7:  { tier: 7,  name: "Red Belt",      badge: "🔴", color: "#ef4444" },
  8:  { tier: 8,  name: "Brown Belt",    badge: "🟤", color: "#854d0e" },
  9:  { tier: 9,  name: "Black Belt",    badge: "⬛", color: "#1e293b" },
  10: { tier: 10, name: "Grandmaster",   badge: "🥋", color: "#6366f1" }
};

/**
 * Extracts fluency telemetry and session history from currentUser proficiency mapping.
 * Column I format: [currentLevel, maxLevel, rollingSpeed, rollingAccuracy, acc1, spd1, acc2, spd2, acc3, spd3]
 */
export function getStudentFluencyData(currentUser) {
  if (!currentUser || !currentUser.proficiency) {
    return { level: 1, maxLevel: 1, lastSpeed: 0, lastAccuracy: 0, history: [], isRefresher: false };
  }

  const profKey = Object.keys(currentUser.proficiency).find(
    k => k.toLowerCase() === 'fluency' || k.toLowerCase() === 'prof_fluency'
  );

  const raw = profKey ? currentUser.proficiency[profKey] : [];

  const level = raw.length > 0 && !isNaN(Number(raw[0])) ? Math.max(1, Number(raw[0])) : 1;
  const maxLevel = raw.length > 1 && !isNaN(Number(raw[1])) ? Math.max(level, Number(raw[1])) : level;
  const rollingSpeed = raw.length > 2 && !isNaN(Number(raw[2])) ? Number(raw[2]) : 0;
  const rollingAccuracy = raw.length > 3 && !isNaN(Number(raw[3])) ? Number(raw[3]) : 0;

  // Reconstruct last 3 session buffer pairs: [{ accuracy, avgSpeed }, ...]
  const history = [];
  for (let i = 4; i < raw.length; i += 2) {
    if (raw[i] !== undefined && raw[i + 1] !== undefined) {
      history.push({
        accuracy: Number(raw[i]),
        avgSpeed: Number(raw[i + 1])
      });
    }
  }

  return {
    level,
    maxLevel,
    lastSpeed: rollingSpeed,
    lastAccuracy: rollingAccuracy,
    history,
    isRefresher: level < maxLevel
  };
}

/**
 * Mode-agnostic evaluator for session completion across all current and future game modes.
 */
export function evaluateLevelProgression(currentUser, sessionResult) {
  const data = getStudentFluencyData(currentUser);
  let currentLevel = data.level;
  let maxLevel = data.maxLevel;
  let history = data.history;

  const sessionAcc = Number(sessionResult.accuracy);
  const sessionSpd = Number(sessionResult.avgSpeed);
  const isRefresher = currentLevel < maxLevel;

  let leveledUp = false;
  let steppedDown = false;
  let restored = false;
  let message = "";

  // 1. FAST RECOVERY PATH (If currently on a refresher tier)
  if (isRefresher) {
    if (sessionAcc >= 90 && sessionSpd <= 2.5) {
      currentLevel = maxLevel;
      restored = true;
      history = []; // Clear buffer upon restoring belt
      const restoredBelt = BELT_TIERS[currentLevel];
      message = `⚡ RECOVERY COMPLETE! Restored to Tier ${currentLevel} (${restoredBelt.badge} ${restoredBelt.name})!`;
    } else {
      // Append session to refresher buffer
      history.push({ accuracy: sessionAcc, avgSpeed: sessionSpd });
      if (history.length > 3) history.shift();
      message = `Refresher session logged. Reach ≥ 90% accuracy & ≤ 2.5s speed in 1 session to restore your belt!`;
    }
  } 
  // 2. NORMAL PROGRESSION PATH (Current tier === highest unlocked tier)
  else {
    history.push({ accuracy: sessionAcc, avgSpeed: sessionSpd });
    if (history.length > 3) history.shift();

    // Check Circuit Breaker: 2 consecutive sessions with accuracy < 50%
    const recentCircuitBreaker = history.length >= 2 && 
      history.slice(-2).every(s => s.accuracy < 50);

    // Calculate rolling averages
    const totalAcc = history.reduce((sum, s) => sum + s.accuracy, 0);
    const totalSpd = history.reduce((sum, s) => sum + s.avgSpeed, 0);
    const rollingAcc = Math.round(totalAcc / history.length);
    const rollingSpd = Number((totalSpd / history.length).toFixed(1));

    // A. Evaluate Promotion (3 completed sessions meeting targets)
    if (history.length >= 3 && rollingAcc >= 90 && rollingSpd <= 2.5) {
      if (currentLevel < 10) {
        currentLevel += 1;
        maxLevel = Math.max(maxLevel, currentLevel);
        leveledUp = true;
        history = []; // Reset window for new belt level
        const newBelt = BELT_TIERS[currentLevel];
        message = `🎉 SUSTAINED MASTERY! Belt Promotion to Tier ${currentLevel} (${newBelt.badge} ${newBelt.name})!`;
      } else {
        message = `🥋 GRANDMASTER MASTERY MAINTAINED!`;
      }
    } 
    // B. Circuit Breaker Step-Down (Fast rescue on 2 severe failures)
    else if (recentCircuitBreaker && currentLevel > 1) {
      currentLevel -= 1;
      steppedDown = true;
      history = [];
      const lowerBelt = BELT_TIERS[currentLevel];
      message = `🥋 BELT TUNE-UP: Stepped back to Tier ${currentLevel} (${lowerBelt.name}) to build confidence.`;
    }
    // C. Standard Rolling Window Step-Down (3 sessions underperforming)
    else if (history.length >= 3 && (rollingAcc < 65 || rollingSpd >= 5.0) && currentLevel > 1) {
      currentLevel -= 1;
      steppedDown = true;
      history = [];
      const lowerBelt = BELT_TIERS[currentLevel];
      message = `🥋 BELT TUNE-UP: Stepped back to Tier ${currentLevel} (${lowerBelt.name}) to reinforce foundations.`;
    } 
    else {
      message = `Session logged! (${history.length}/3 attempts completed toward belt evaluation)`;
    }
  }

  // Calculate final rolling averages for saved state
  const finalTotalAcc = history.length > 0 ? history.reduce((s, x) => s + x.accuracy, 0) : sessionAcc;
  const finalTotalSpd = history.length > 0 ? history.reduce((s, x) => s + x.avgSpeed, 0) : sessionSpd;
  const finalRollingAcc = Math.round(finalTotalAcc / (history.length || 1));
  const finalRollingSpd = Number((finalTotalSpd / (history.length || 1)).toFixed(1));

  // 3. Serialize back into flat array for Column I synchronization
  const updatedArray = [currentLevel, maxLevel, finalRollingSpd, finalRollingAcc];
  history.forEach(s => {
    updatedArray.push(s.accuracy, s.avgSpeed);
  });

  if (!currentUser.proficiency) currentUser.proficiency = {};
  currentUser.proficiency['fluency'] = updatedArray;

  return {
    currentLevel,
    maxLevel,
    leveledUp,
    steppedDown,
    restored,
    message,
    rollingAcc: finalRollingAcc,
    rollingSpd: finalRollingSpd,
    historyCount: history.length
  };
}
