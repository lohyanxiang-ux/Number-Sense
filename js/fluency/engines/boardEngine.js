export class BoardEngine {
  constructor() {
    this.totalBoards = 20;
    this.boardsRemaining = 20;
    this.totalQuestions = 0;
    this.correctCount = 0;
    this.currentStreak = 0;
    this.consecutiveWrong = 0;
    this.startTime = null;
    this.questionStartTime = null;
  }

  startSession() {
    this.totalBoards = 20;
    this.boardsRemaining = 20;
    this.totalQuestions = 0;
    this.correctCount = 0;
    this.currentStreak = 0;
    this.consecutiveWrong = 0;
    this.startTime = Date.now();
    this.questionStartTime = Date.now();
  }

  submitAnswer(userAnswer, question) {
    const timeSpent = (Date.now() - this.questionStartTime) / 1000;
    this.questionStartTime = Date.now();
    this.totalQuestions += 1;

    const isCorrect = String(userAnswer).trim() === String(question.answer).trim();
    let boardsBroken = 0;

    if (isCorrect) {
      this.correctCount += 1;
      this.currentStreak += 1;
      this.consecutiveWrong = 0;

      // Determine boards broken based on active streak tier
      if (this.currentStreak >= 5) {
        boardsBroken = 3; // Fire/Rage Aura
      } else if (this.currentStreak >= 3) {
        boardsBroken = 2; // Blue Energy Aura
      } else {
        boardsBroken = 1; // Standard Strike
      }

      this.boardsRemaining = Math.max(0, this.boardsRemaining - boardsBroken);
    } else {
      this.currentStreak = 0;
      this.consecutiveWrong += 1;
    }

    const victory = this.boardsRemaining === 0;
    const failedConsecutive = this.consecutiveWrong >= 3;
    const gameOver = victory || failedConsecutive;

    const totalElapsedSec = (Date.now() - this.startTime) / 1000;
    const avgSpeed = this.totalQuestions > 0 ? Number((totalElapsedSec / this.totalQuestions).toFixed(1)) : 0;
    const accuracy = Math.round((this.correctCount / this.totalQuestions) * 100);

    return {
      isCorrect,
      boardsBroken,
      boardsRemaining: this.boardsRemaining,
      currentStreak: this.currentStreak,
      consecutiveWrong: this.consecutiveWrong,
      gameOver,
      victory,
      failedConsecutive,
      timedOut: false,
      totalQuestions: this.totalQuestions,
      correctCount: this.correctCount,
      accuracy,
      avgSpeed,
      timeSpent: Number(timeSpent.toFixed(1))
    };
  }

  handleTimeout() {
    this.totalQuestions += 1;
    const totalElapsedSec = (Date.now() - this.startTime) / 1000;
    const avgSpeed = this.totalQuestions > 0 ? Number((totalElapsedSec / this.totalQuestions).toFixed(1)) : 0;
    const accuracy = Math.round((this.correctCount / this.totalQuestions) * 100);

    return {
      isCorrect: false,
      boardsBroken: 0,
      boardsRemaining: this.boardsRemaining,
      currentStreak: 0,
      consecutiveWrong: this.consecutiveWrong + 1,
      gameOver: true,
      victory: false,
      failedConsecutive: false,
      timedOut: true,
      totalQuestions: this.totalQuestions,
      correctCount: this.correctCount,
      accuracy,
      avgSpeed,
      timeSpent: 10.0
    };
  }
}
