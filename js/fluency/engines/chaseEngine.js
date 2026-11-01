export class ChaseEngine {
  constructor() {
    this.scrollsLeft = 3;
    this.correctCount = 0;
    this.totalQuestions = 0;
    this.currentStreak = 0;
    this.speedStreak = 0; // Tracks consecutive correct answers for speed ramp
    this.distance = 0;
    this.startTime = null;
  }

  startSession() {
    this.scrollsLeft = 3;
    this.correctCount = 0;
    this.totalQuestions = 0;
    this.currentStreak = 0;
    this.speedStreak = 0;
    this.distance = 0;
    this.startTime = Date.now();
  }

  // Calculate time limit: starts at 8.0s, decays by 0.4s per streak step down to 4.0s floor
  getCurrentTimeLimit() {
    const calculated = 8.0 - (this.speedStreak * 0.4);
    return Math.max(4.0, Number(calculated.toFixed(1)));
  }

  // Determine dynamic speed tier level (evenly spread between 8.0s and 4.0s)
  getCurrentTier() {
    const limit = this.getCurrentTimeLimit();
    if (limit > 7.0) return { level: 1, name: 'MOONLIGHT SPRINT', color: '#38bdf8', bpm: 110 };
    if (limit > 5.8) return { level: 2, name: 'ROOF LEAP SURGE', color: '#c084fc', bpm: 130 };
    if (limit > 4.6) return { level: 3, name: 'SHADOW OVERDRIVE', color: '#fbbf24', bpm: 150 };
    return { level: 4, name: 'HYPER VELOCITY', color: '#ef4444', bpm: 170 };
  }

  submitAnswer(answerStr, question) {
    this.totalQuestions++;
    const isCorrect = String(answerStr).trim() === String(question.answer).trim();

    if (isCorrect) {
      this.correctCount++;
      this.currentStreak++;
      this.speedStreak++; // Increase speed ramp

      const bonus = (this.currentStreak - 1) * 20;
      this.distance += (100 + bonus);
    } else {
      this.currentStreak = 0;
      this.speedStreak = 0; // Reset speed ramp back to 8.0s on wrong answer
      this.scrollsLeft = Math.max(0, this.scrollsLeft - 1);
    }

    const timeLimit = this.getCurrentTimeLimit();
    const tier = this.getCurrentTier();
    const gameOver = this.scrollsLeft <= 0;

    return {
      isCorrect,
      correctCount: this.correctCount,
      totalQuestions: this.totalQuestions,
      currentStreak: this.currentStreak,
      scrollsLeft: this.scrollsLeft,
      distance: this.distance,
      timeLimit,
      tier,
      gameOver
    };
  }

  handleTimeout() {
    this.totalQuestions++;
    this.currentStreak = 0;
    this.speedStreak = 0; // Reset speed ramp back to 8.0s on timeout
    this.scrollsLeft = Math.max(0, this.scrollsLeft - 1);

    const timeLimit = this.getCurrentTimeLimit();
    const tier = this.getCurrentTier();
    const gameOver = this.scrollsLeft <= 0;

    return {
      isCorrect: false,
      isTimeout: true,
      correctCount: this.correctCount,
      totalQuestions: this.totalQuestions,
      currentStreak: 0,
      scrollsLeft: this.scrollsLeft,
      distance: this.distance,
      timeLimit,
      tier,
      gameOver
    };
  }

  finishSession() {
    const elapsedSec = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const accuracy = this.totalQuestions > 0 ? Math.round((this.correctCount / this.totalQuestions) * 100) : 0;
    const avgSpeed = this.totalQuestions > 0 ? Number((elapsedSec / this.totalQuestions).toFixed(1)) : 0;

    return {
      accuracy,
      avgSpeed,
      totalQuestions: this.totalQuestions,
      correctCount: this.correctCount,
      distance: this.distance,
      scrollsLeft: this.scrollsLeft,
      victory: this.correctCount >= 25
    };
  }
}
