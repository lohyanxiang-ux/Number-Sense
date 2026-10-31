export class BlitzEngine {
  constructor() {
    this.sessionDuration = 30; // Fixed 30 Seconds
    this.totalQuestions = 0;
    this.correctCount = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.startTime = null;
  }

  startSession() {
    this.totalQuestions = 0;
    this.correctCount = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.startTime = Date.now();
  }

  submitAnswer(userAnswer, question) {
    this.totalQuestions += 1;
    const isCorrect = String(userAnswer).trim() === String(question.answer).trim();

    if (isCorrect) {
      this.correctCount += 1;
      this.currentStreak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
    } else {
      this.currentStreak = 0;
    }

    return {
      isCorrect,
      totalQuestions: this.totalQuestions,
      correctCount: this.correctCount,
      currentStreak: this.currentStreak,
      maxStreak: this.maxStreak
    };
  }

  finishSession() {
    const total = this.totalQuestions;
    const accuracy = total > 0 ? Math.round((this.correctCount / total) * 100) : 0;
    const avgSpeed = total > 0 ? Number((30.0 / total).toFixed(1)) : 30.0;

    return {
      victory: accuracy >= 80 && this.correctCount >= 10,
      totalQuestions: total,
      correctCount: this.correctCount,
      accuracy,
      avgSpeed,
      maxStreak: this.maxStreak
    };
  }
}
