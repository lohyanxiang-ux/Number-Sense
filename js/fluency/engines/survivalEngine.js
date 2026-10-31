export class SurvivalEngine {
  constructor() {
    this.timeBank = 15;
    this.initialTime = 15;
    this.score = 0;
    this.correctCount = 0;
    this.totalQuestions = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timerInterval = null;
    this.startTime = 0;
    this.currentLevel = 1;
    this.onTick = null;
    this.onGameOver = null;
  }

  startSession(level, callbacks) {
    this.timeBank = 15;
    this.score = 0;
    this.correctCount = 0;
    this.totalQuestions = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.currentLevel = level;
    this.startTime = Date.now();
    this.onTick = callbacks.onTick;
    this.onGameOver = callbacks.onGameOver;

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.timeBank -= 0.1;
      if (this.timeBank <= 0) {
        this.timeBank = 0;
        this.endSession();
      } else if (this.onTick) {
        this.onTick(this.timeBank.toFixed(1));
      }
    }, 100);
  }

  submitAnswer(userAnswer, currentQuestion) {
    this.totalQuestions++;
    const isCorrect = Number(userAnswer) === Number(currentQuestion.answer);

    if (isCorrect) {
      this.correctCount++;
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      // Add +3 seconds time bonus
      this.timeBank += 3;

      // Score bonus based on combo
      const multiplier = Math.min(5, 1 + Math.floor(this.combo / 3));
      this.score += 10 * multiplier;
    } else {
      this.combo = 0;
      // Deduct -5 seconds time penalty
      this.timeBank = Math.max(0, this.timeBank - 5);
    }

    if (this.timeBank <= 0) {
      this.endSession();
      return { isCorrect, gameOver: true };
    }

    return { isCorrect, gameOver: false, timeBank: this.timeBank, combo: this.combo, score: this.score };
  }

  endSession() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;

    const totalSecondsSpent = (Date.now() - this.startTime) / 1000;
    const accuracy = this.totalQuestions > 0 ? Math.round((this.correctCount / this.totalQuestions) * 100) : 0;
    const avgSpeed = this.totalQuestions > 0 ? (totalSecondsSpent / this.totalQuestions).toFixed(2) : 0;

    if (this.onGameOver) {
      this.onGameOver({
        score: this.score,
        correctCount: this.correctCount,
        totalQuestions: this.totalQuestions,
        accuracy: accuracy,
        avgSpeed: avgSpeed,
        maxCombo: this.maxCombo
      });
    }
  }
}
