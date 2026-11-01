export class ChaseEngine {
  constructor() {
    this.scrollsLeft = 3;
    this.correctCount = 0;
    this.totalQuestions = 0;
    this.currentStreak = 0;
    this.distance = 0; // Distance in meters
    this.startTime = null;
  }

  startSession() {
    this.scrollsLeft = 3;
    this.correctCount = 0;
    this.totalQuestions = 0;
    this.currentStreak = 0;
    this.distance = 0;
    this.startTime = Date.now();
  }

  // Calculate real-time allowed seconds per question based on correct answers
  getCurrentTimeLimit() {
    // Formula: 8.0s base, decays by 0.4s per correct answer down to 1.8s floor
    const calculated = 8.0 - (this.correctCount * 0.4);
    return Math.max(1.8, Number(calculated.toFixed(1)));
  }

  // Determine dynamic speed tier level
  getCurrentTier() {
    const limit = this.getCurrentTimeLimit();
    if (limit > 5.8) return { level: 1, name: 'MOONLIGHT SPRINT', color: '#38bdf8', bpm: 110 };
    if (limit > 3.8) return { level: 2, name: 'ROOF LEAP SURGE', color: '#c084fc', bpm: 130 };
    if (limit > 2.2) return { level: 3, name: 'SHADOW OVERDRIVE', color: '#fbbf24', bpm: 155 };
    return { level: 4, name: 'HYPER VELOCITY', color: '#ef4444', bpm: 175 };
  }

  submitAnswer(answerStr, question) {
    this.totalQuestions++;
    const isCorrect = String(answerStr).trim() === String(question.answer).trim();

    if (isCorrect) {
      this.correctCount++;
      this.currentStreak++;

      // Base 100m + streak bonus (20m per streak count)
      const bonus = (this.currentStreak - 1) * 20;
      this.distance += (100 + bonus);
    } else {
      this.currentStreak = 0;
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
