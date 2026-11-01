export const BELT_TIERS = {
  1: { name: 'White Belt', badge: '⚪', tier: 1 },
  2: { name: 'Yellow Belt', badge: '🟡', tier: 2 },
  3: { name: 'Orange Belt', badge: '🟠', tier: 3 },
  4: { name: 'Green Belt', badge: '🟢', tier: 4 },
  5: { name: 'Blue Belt', badge: '🔵', tier: 5 },
  6: { name: 'Purple Belt', badge: '🟣', tier: 6 },
  7: { name: 'Brown Belt', badge: '🟤', tier: 7 },
  8: { name: 'Red Belt', badge: '🔴', tier: 8 },
  9: { name: 'Black Belt', badge: '⚫', tier: 9 },
  10: { name: 'Grandmaster Gold', badge: '👑', tier: 10 }
};

export function getStudentFluencyData(user) {
  if (!user) user = {};

  let raw = user?.proficiency?.fluency || user?.proficiency?.Prof_fluency || user?.Prof_fluency;

  if (typeof raw === 'string') {
    raw = raw.split(',').map(v => Number(v.trim()) || 0);
  }

  if (!Array.isArray(raw) || raw.length < 10) {
    raw = [1, 1, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  raw = raw.map(v => Number(v) || 0);

  user.Prof_fluency = raw;
  if (!user.proficiency) user.proficiency = {};
  user.proficiency.fluency = raw;
  user.proficiency.Prof_fluency = raw;

  const currentLevel = raw[0] || 1;
  const maxLevel = raw[1] || 1;
  const rollingSpeed = raw[2] || 0;
  const rollingAccuracy = raw[3] || 0;

  const history = [];
  for (let i = 4; i < raw.length; i += 2) {
    if (raw[i] > 0 || raw[i + 1] > 0) {
      history.push({ accuracy: raw[i], speed: raw[i + 1] });
    }
  }

  return {
    level: currentLevel,
    maxLevel,
    lastSpeed: rollingSpeed,
    lastAccuracy: rollingAccuracy,
    history,
    isRefresher: currentLevel < maxLevel,
    raw
  };
}

export function evaluateLevelProgression(user, sessionResult) {
  const data = getStudentFluencyData(user);
  let [currentLevel, maxLevel, rollingSpeed, rollingAccuracy, acc1, spd1, acc2, spd2, acc3, spd3] = data.raw;

  const previousLevel = currentLevel;
  const TARGET_ACCURACY = 80;
  const TARGET_SPEED = 5.0;

  acc3 = acc2; spd3 = spd2;
  acc2 = acc1; spd2 = spd1;
  acc1 = sessionResult.accuracy; spd1 = sessionResult.avgSpeed;

  const activeBuffer = [];
  if (acc1 > 0 || spd1 > 0) activeBuffer.push({ acc: acc1, spd: spd1 });
  if (acc2 > 0 || spd2 > 0) activeBuffer.push({ acc: acc2, spd: spd2 });
  if (acc3 > 0 || spd3 > 0) activeBuffer.push({ acc: acc3, spd: spd3 });

  const avgAcc = Math.round(activeBuffer.reduce((sum, s) => sum + s.acc, 0) / activeBuffer.length);
  const avgSpd = Number((activeBuffer.reduce((sum, s) => sum + s.spd, 0) / activeBuffer.length).toFixed(1));

  let leveledUp = false;
  let restored = false;
  let steppedDown = false;
  let transitionType = null;
  let message = '';

  const isRefresher = currentLevel < maxLevel;

  if (isRefresher) {
    if (sessionResult.accuracy >= TARGET_ACCURACY && sessionResult.avgSpeed <= TARGET_SPEED) {
      currentLevel += 1;
      restored = true;
      transitionType = 'RECOVERY';
      message = `⚡ Fast Recovery! Restored to ${BELT_TIERS[currentLevel].name}!`;
    } else {
      message = `Keep training! Target: ≥80% Acc and <5.0s Speed to restore rank.`;
    }
  } else {
    if (activeBuffer.length >= 3) {
      if (avgAcc >= TARGET_ACCURACY && avgSpd <= TARGET_SPEED && currentLevel < 10) {
        currentLevel += 1;
        maxLevel = Math.max(maxLevel, currentLevel);
        leveledUp = true;
        transitionType = 'PROMOTION';
        message = `🏆 Promotion Unlocked! Promoted to ${BELT_TIERS[currentLevel].name}!`;
        acc1 = spd1 = acc2 = spd2 = acc3 = spd3 = 0;
      } else {
        message = `Progress logged (${activeBuffer.length}/3 runs). Keep aiming for ≥80% Acc & <5.0s Speed!`;
      }
    } else {
      message = `Run logged (${activeBuffer.length}/3 runs). Complete 3 runs to qualify for promotion.`;
    }
  }

  // Circuit Breaker: 2 consecutive failures (<50% accuracy)
  if (acc1 < 50 && acc2 < 50 && activeBuffer.length >= 2 && currentLevel > 1) {
    currentLevel -= 1;
    steppedDown = true;
    transitionType = 'STEP_DOWN';
    message = `⚠️ Belt Step-Down. Level lowered to ${BELT_TIERS[currentLevel].name}.`;
    acc1 = spd1 = acc2 = spd2 = acc3 = spd3 = 0;
  }

  const updatedRaw = [currentLevel, maxLevel, avgSpd, avgAcc, acc1, spd1, acc2, spd2, acc3, spd3];

  user.Prof_fluency = updatedRaw;
  if (!user.proficiency) user.proficiency = {};
  user.proficiency.fluency = updatedRaw;
  user.proficiency.Prof_fluency = updatedRaw;

  return {
    previousLevel,
    currentLevel,
    maxLevel,
    leveledUp,
    restored,
    steppedDown,
    transitionType,
    message,
    avgAcc,
    avgSpd,
    updatedRaw
  };
}
