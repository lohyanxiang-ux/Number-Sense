export class SummitEngine {
  constructor() {
    this.targetStep = 10;
    this.currentStep = 0;
    this.totalQuestions = 0;
    this.correctCount = 0;
    this.startTime = null;
    this.questionStartTime = null;
  }

  startSession() {
    this.currentStep = 0;
    this.totalQuestions = 0;
    this.correctCount = 0;
    this.startTime = Date.now();
    this.questionStartTime = Date.now();
  }

  submitAnswer(userAnswer, question) {
    const timeSpent = (Date.now() - this.questionStartTime) / 1000;
    this.questionStartTime = Date.now();
    this.totalQuestions += 1;

    const isCorrect = String(userAnswer).trim() === String(question.answer).trim();

    if (isCorrect) {
      this.currentStep += 1;
      this.correctCount += 1;
    } else {
      this.currentStep -= 1;
    }

    const victory = this.currentStep >= this.targetStep;
    const fellOff = this.currentStep < 0;
    const gameOver = victory || fellOff;

    const totalElapsedSec = (Date.now() - this.startTime) / 1000;
    const avgSpeed = this.totalQuestions > 0 ? (totalElapsedSec / this.totalQuestions).toFixed(1) : 0;
    const accuracy = Math.round((this.correctCount / this.totalQuestions) * 100);

    return {
      isCorrect,
      currentStep: Math.max(0, this.currentStep),
      previousStep: isCorrect ? this.currentStep - 1 : this.currentStep + 1,
      gameOver,
      victory,
      fellOff,
      timedOut: false,
      totalQuestions: this.totalQuestions,
      correctCount: this.correctCount,
      accuracy,
      avgSpeed: Number(avgSpeed),
      timeSpent: Number(timeSpent.toFixed(1))
    };
  }

  handleTimeout() {
    this.totalQuestions += 1;
    const totalElapsedSec = (Date.now() - this.startTime) / 1000;
    const avgSpeed = this.totalQuestions > 0 ? (totalElapsedSec / this.totalQuestions).toFixed(1) : 0;
    const accuracy = Math.round((this.correctCount / this.totalQuestions) * 100);

    return {
      isCorrect: false,
      currentStep: 0,
      gameOver: true,
      victory: false,
      fellOff: true,
      timedOut: true,
      totalQuestions: this.totalQuestions,
      correctCount: this.correctCount,
      accuracy,
      avgSpeed: Number(avgSpeed),
      timeSpent: 10.0
    };
  }
}
