/**
 * ASH - DBMS Learning Platform - Progress & Preferences Tracker (LocalStorage)
 */

const STORAGE_KEY = "dbms_platform_progress_v2";

const DEFAULT_STATE = {
  theme: "light",
  completedTopics: {},
  completedChapters: {},
  lastVisited: {
    chapterId: "ch1",
    topicId: "ch1-history",
    timestamp: Date.now()
  },
  bookmarks: [],
  notes: {},
  examHistory: [],
  highestScore: 0,
  solvedQuizzes: {}
};

export class ProgressManager {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return { ...DEFAULT_STATE, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.error("Failed to load progress from localStorage:", e);
    }
    return { ...DEFAULT_STATE };
  }

  saveState() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
      this.dispatchUpdateEvent();
    } catch (e) {
      console.error("Failed to save progress to localStorage:", e);
    }
  }

  dispatchUpdateEvent() {
    if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent("dbms_progress_updated", { detail: this.getStats() }));
    }
  }

  getTheme() {
    return this.state.theme || "light";
  }

  setTheme(theme) {
    this.state.theme = theme;
    this.saveState();
    document.documentElement.setAttribute("data-theme", theme);
  }

  toggleTopicCompleted(topicId, chapterId) {
    if (this.state.completedTopics[topicId]) {
      delete this.state.completedTopics[topicId];
    } else {
      this.state.completedTopics[topicId] = true;
    }
    this.saveState();
    return !!this.state.completedTopics[topicId];
  }

  isTopicCompleted(topicId) {
    return !!this.state.completedTopics[topicId];
  }

  setLastVisited(chapterId, topicId) {
    this.state.lastVisited = {
      chapterId,
      topicId,
      timestamp: Date.now()
    };
    this.saveState();
  }

  getLastVisited() {
    return this.state.lastVisited;
  }

  addExamAttempt(attempt) {
    this.state.examHistory.unshift({
      id: "attempt-" + Date.now(),
      date: new Date().toLocaleString("ar-LY"),
      score: attempt.score,
      maxScore: attempt.maxScore || 50,
      percentage: Math.round((attempt.score / (attempt.maxScore || 50)) * 100),
      durationSeconds: attempt.durationSeconds,
      breakdown: attempt.breakdown,
      masteredTopics: attempt.masteredTopics || [],
      reviewTopics: attempt.reviewTopics || []
    });

    if (attempt.score > (this.state.highestScore || 0)) {
      this.state.highestScore = attempt.score;
    }

    this.saveState();
  }

  getExamHistory() {
    return this.state.examHistory || [];
  }

  getHighestScore() {
    return this.state.highestScore || 0;
  }

  saveNote(chapterId, noteText) {
    this.state.notes[chapterId] = noteText;
    this.saveState();
  }

  getNote(chapterId) {
    return this.state.notes[chapterId] || "";
  }

  recordQuizSolved(quizId, isCorrect) {
    this.state.solvedQuizzes[quizId] = {
      isCorrect,
      timestamp: Date.now()
    };
    this.saveState();
  }

  toggleBookmark(item) {
    const idx = this.state.bookmarks.findIndex(b => b.id === item.id);
    if (idx >= 0) {
      this.state.bookmarks.splice(idx, 1);
    } else {
      this.state.bookmarks.push({
        id: item.id,
        title: item.title,
        type: item.type,
        chapterId: item.chapterId
      });
    }
    this.saveState();
    return idx === -1;
  }

  isBookmarked(id) {
    return this.state.bookmarks.some(b => b.id === id);
  }

  resetProgress() {
    this.state = {
      ...DEFAULT_STATE,
      theme: this.state.theme
    };
    this.saveState();
  }

  getStats(totalChaptersCount = 8, totalTopicsCount = 28) {
    const completedTopicsCount = Object.keys(this.state.completedTopics).length;
    const progressPercentage = Math.min(100, Math.round((completedTopicsCount / totalTopicsCount) * 100));
    const solvedQuizzesList = Object.values(this.state.solvedQuizzes);
    const correctQuizzesCount = solvedQuizzesList.filter(q => q.isCorrect).length;

    return {
      completedTopicsCount,
      totalTopicsCount,
      progressPercentage,
      totalChaptersCount,
      examAttemptsCount: this.state.examHistory.length,
      highestScore: this.state.highestScore || 0,
      quizzesSolvedCount: solvedQuizzesList.length,
      quizzesCorrectRate: solvedQuizzesList.length > 0
        ? Math.round((correctQuizzesCount / solvedQuizzesList.length) * 100)
        : 0,
      lastVisited: this.state.lastVisited
    };
  }
}

export const progressManager = new ProgressManager();
