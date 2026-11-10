/**
 * ASH - DBMS Learning Platform App Coordinator
 * Core Coordinator and View Engine
 */

import { COURSE_INFO, CHAPTERS_DATA, PITFALLS_DATA, QUESTION_BANK, CHEAT_SHEETS, TRACEABILITY_MATRIX, SIMULATOR_PRESETS } from "./content-data.js";
import { progressManager } from "./progress.js";
import { searchEngine } from "./search.js";
import { ClosureCalculator, NORMALIZATION_CASES, MAPPING_STEPS_DATA, RelationalEngine } from "./simulators.js";
import { MockExamEngine } from "./mock-exam.js";
import { DiagramRenderer } from "./diagrams.js";
import { renderMathInElementSafely, showToast, copyToClipboard, openModal, closeModal, formatTime, formatAcademicText } from "./utils.js";
import { aiAssistant } from "./ai-assistant.js";

class App {
  constructor() {
    this.currentView = "dashboard";
    this.currentChapterId = "ch1";
    this.currentSimTab = "closure";
    this.normalizationCase = "dreamhome";
    this.normalizationStepIdx = 0;
    this.mappingStepIdx = 0;
    this.relationalEngine = new RelationalEngine();
    this.mockExamEngine = new MockExamEngine();
    this.activeEerState = { disjoint: "d", completeness: "total" };
  }

  init() {
    // Apply saved theme
    document.documentElement.setAttribute("data-theme", progressManager.getTheme());

    // Bind event handlers
    this.bindNavigation();
    this.bindHeaderControls();

    // Initialize AI Assistant
    try {
      aiAssistant.init();
    } catch (e) {
      console.warn("AI Assistant init notice:", e);
    }

    // Force Dashboard as initial view on fresh load unless a valid hash is provided or active exam is in progress
    let initialView = "dashboard";
    if (this.mockExamEngine.restoreState()) {
      initialView = "mock-exam";
      this.startExamTimer();
    } else {
      const hash = window.location.hash.replace("#", "").trim();
      const validViews = ["dashboard", "encyclopedia", "simulators", "pitfalls", "mock-exam", "question-bank", "cheatsheets", "traceability"];
      if (hash && validViews.includes(hash)) {
        initialView = hash;
      }
    }

    this.switchView(initialView, false);
    this.updateStatsUI();

    // Listen for progress changes
    window.addEventListener("dbms_progress_updated", () => {
      this.updateStatsUI();
    });

    // Accidental reload / navigation guard during active exam
    window.addEventListener("beforeunload", (e) => {
      if (this.mockExamEngine && this.mockExamEngine.isRunning && !this.mockExamEngine.isSubmitted) {
        e.preventDefault();
        e.returnValue = "الامتحان التجريبي قيد التشغيل. هل أنت متأكد من مغادرة الصفحة؟ قد تفقد الوقت المتبقي.";
        return e.returnValue;
      }
    });

    // Handle back button / hash changes
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.view) {
        this.switchView(e.state.view, false);
      }
    });

    console.log("DBMS Learning Platform initialized successfully (ASH).");
  }

  openAiAssistant() {
    if (typeof window.openDbmsAi === "function") {
      window.openDbmsAi();
    } else {
      try {
        aiAssistant.openDrawer();
      } catch (e) {
        console.warn("Could not open AI Assistant:", e);
      }
    }
  }

  resumeTopic(chapterId, topicId) {
    this.currentChapterId = chapterId || "ch1";
    this.switchView("encyclopedia");
    setTimeout(() => {
      const el = document.getElementById(topicId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.style.outline = "2px solid var(--primary)";
        setTimeout(() => { el.style.outline = "none"; }, 2500);
      }
    }, 300);
  }

  bindNavigation() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const closeBtn = document.getElementById("sidebar-close-btn");
    const menuBtn = document.getElementById("menu-toggle-btn");
    const homeBrandBtn = document.getElementById("btn-home-brand");

    const closeSidebarMobile = () => {
      if (sidebar) sidebar.classList.remove("mobile-open");
      if (overlay) overlay.classList.remove("active");
      document.body.classList.remove("sidebar-open");
    };

    const toggleSidebarMobile = () => {
      if (sidebar) {
        const isOpen = sidebar.classList.toggle("mobile-open");
        if (overlay) {
          overlay.classList.toggle("active", isOpen);
        }
        document.body.classList.toggle("sidebar-open", isOpen);
      }
    };

    // Mobile menu toggle
    if (menuBtn) {
      menuBtn.addEventListener("click", () => {
        toggleSidebarMobile();
      });
    }

    // Mobile close button
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeSidebarMobile();
      });
    }

    // Overlay click to close
    if (overlay) {
      overlay.addEventListener("click", () => {
        closeSidebarMobile();
      });
    }

    // Return to Home Brand Button
    if (homeBrandBtn) {
      homeBrandBtn.addEventListener("click", () => {
        this.switchView("dashboard");
        closeSidebarMobile();
      });
    }

    // Keyboard support: Escape closes mobile sidebar
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeSidebarMobile();
      }
    });

    // Sidebar nav items
    document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.getAttribute("data-view");
        this.switchView(view);
        closeSidebarMobile();
      });
    });

    // Theme toggle
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = progressManager.getTheme();
        const next = current === "light" ? "dark" : "light";
        progressManager.setTheme(next);
        this.updateThemeIcon(next);
        showToast(`تم التبديل إلى الوضع ${next === "dark" ? "الداكن" : "الفاتح"}`);
      });
      this.updateThemeIcon(progressManager.getTheme());
    }

    // Reset progress button in modal
    const resetBtn = document.getElementById("confirm-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        progressManager.resetProgress();
        closeModal("reset-modal");
        this.updateStatsUI();
        this.switchView("dashboard");
        showToast("تمت إعادة ضبط تقدمك الدراسي بنجاح", "info");
      });
    }
  }

  updateThemeIcon(theme) {
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (!themeBtn) return;
    if (theme === "dark") {
      themeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    } else {
      themeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      `;
    }
  }

  bindHeaderControls() {
    const aiBtn = document.getElementById("header-ai-btn");
    if (aiBtn) {
      aiBtn.addEventListener("click", () => {
        this.openAiAssistant();
      });
    }

    const searchInput = document.getElementById("header-search-input");
    const dropdown = document.getElementById("search-dropdown");

    if (searchInput && dropdown) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
          dropdown.classList.remove("active");
          dropdown.innerHTML = "";
          return;
        }

        const results = searchEngine.search(query);
        if (results.length === 0) {
          dropdown.innerHTML = `<div class="search-result-item" style="color: var(--text-muted); text-align: center;">لا توجد نتائج مطابقة لـ "${query}"</div>`;
          dropdown.classList.add("active");
          return;
        }

        dropdown.innerHTML = results.map(item => `
          <div class="search-result-item" data-view="${item.targetView}" data-chapter="${item.targetChapter || ""}" data-topic="${item.targetTopic || ""}" data-target-id="${item.targetId || ""}">
            <span class="search-result-badge">${item.badge}</span>
            <div class="search-result-title">${item.title}</div>
            <div class="search-result-snippet">${item.snippet}</div>
          </div>
        `).join("");

        dropdown.classList.add("active");

        // Click search result
        dropdown.querySelectorAll(".search-result-item").forEach(itemEl => {
          itemEl.addEventListener("click", () => {
            const targetView = itemEl.getAttribute("data-view");
            const chapter = itemEl.getAttribute("data-chapter");
            const topic = itemEl.getAttribute("data-topic");
            const targetId = itemEl.getAttribute("data-target-id");

            dropdown.classList.remove("active");
            searchInput.value = "";

            if (targetView === "encyclopedia" && chapter) {
              this.currentChapterId = chapter;
            }
            this.switchView(targetView);

            setTimeout(() => {
              const elId = topic || targetId || chapter;
              if (elId) {
                const targetDom = document.getElementById(elId);
                if (targetDom) {
                  targetDom.scrollIntoView({ behavior: "smooth", block: "start" });
                  targetDom.style.outline = "2px solid var(--primary)";
                  setTimeout(() => { targetDom.style.outline = "none"; }, 2000);
                }
              }
            }, 250);
          });
        });
      });

      // Close search on click outside
      document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove("active");
        }
      });
    }
  }

  switchView(viewName, pushState = true) {
    // Prevent leaving timed exam while active
    if (this.mockExamEngine.isRunning && !this.mockExamEngine.isSubmitted && viewName !== "mock-exam") {
      showToast("⚠️ الامتحان النصفي قيد التشغيل! يرجى تسليم الامتحان قبل مغادرة هذه الشاشة.", "warning");
      return;
    }

    this.currentView = viewName;

    // Update active nav item
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.getAttribute("data-view") === viewName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update view containers
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add("active");
    }

    // Render content for view
    switch (viewName) {
      case "dashboard":
        this.renderDashboard();
        break;
      case "encyclopedia":
        this.renderEncyclopedia();
        break;
      case "simulators":
        this.renderSimulators();
        break;
      case "pitfalls":
        this.renderPitfalls();
        break;
      case "mock-exam":
        this.renderMockExam();
        break;
      case "question-bank":
        this.renderQuestionBank();
        break;
      case "cheatsheets":
        this.renderCheatSheets();
        break;
      case "traceability":
        this.renderTraceability();
        break;
    }

    // Render Math safely
    if (activeSec) {
      renderMathInElementSafely(activeSec);
    }

    // Update Header Current Section badge
    const headerBadge = document.getElementById("header-current-section");
    if (headerBadge) {
      const titles = {
        dashboard: "لوحة التحكم وخارطة المقرر",
        encyclopedia: "الموسوعة الأكاديمية (L1–9)",
        simulators: "مختبر المحاكاة (4 أدوات)",
        pitfalls: "رادار الأفخاخ والتحليل",
        "mock-exam": "محاكي الامتحان النصفي",
        "question-bank": "بنك الأسئلة والحلول",
        cheatsheets: "بطاقات المراجعة السريعة",
        traceability: "مصفوفة تتبع السلايدات"
      };
      const label = headerBadge.querySelector(".badge-label");
      if (label) label.textContent = titles[viewName] || viewName;
    }

    // Update Breadcrumbs
    this.updateBreadcrumbs(viewName);

    // Push state
    if (pushState) {
      history.pushState({ view: viewName }, "", `#${viewName}`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateBreadcrumbs(viewName) {
    const bar = document.getElementById("breadcrumbs-bar");
    if (!bar) return;

    const titles = {
      dashboard: "لوحة التحكم وخارطة المقرر",
      encyclopedia: "الموسوعة الأكاديمية التفاعلية",
      simulators: "المختبرات التفاعلية الأربعة",
      pitfalls: "رادار الأفخاخ وتحليل الامتحانات",
      "mock-exam": "محاكي الامتحان النصفي",
      "question-bank": "بنك الأسئلة والحلول النموذجية",
      cheatsheets: "بطاقات المراجعة السريعة (Cheat Sheets)",
      traceability: "مصفوفة تتبع السلايدات والمراجع"
    };

    bar.innerHTML = `
      <a onclick="window.dbmsApp.switchView('dashboard')">الرئيسية</a>
      <span class="breadcrumb-separator">/</span>
      <span>${titles[viewName] || viewName}</span>
    `;
  }

  updateStatsUI() {
    const stats = progressManager.getStats();

    // Progress pill in header
    const pill = document.getElementById("header-progress-pct");
    const fill = document.getElementById("header-progress-fill");
    if (pill) pill.textContent = `${stats.progressPercentage}%`;
    if (fill) fill.style.width = `${stats.progressPercentage}%`;

    // Dashboard stats if present
    const elTopics = document.getElementById("stat-completed-topics");
    const elRate = document.getElementById("stat-success-rate");
    const elScore = document.getElementById("stat-highest-score");
    const elExams = document.getElementById("stat-exam-count");

    if (elTopics) elTopics.textContent = `${stats.totalTopicsCount} / ${stats.completedTopicsCount}`;
    if (elRate) elRate.textContent = `${stats.quizzesCorrectRate}%`;
    if (elScore) elScore.textContent = `50 / ${stats.highestScore}`;
    if (elExams) elExams.textContent = `${stats.examAttemptsCount}`;
  }

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // 1. Dashboard
  renderDashboard() {
    const container = document.getElementById("view-dashboard");
    if (!container) return;

    const stats = progressManager.getStats();
    const lastVisited = stats.lastVisited;

    let resumeChapter = CHAPTERS_DATA.find(c => c.id === (lastVisited?.chapterId || "ch1")) || CHAPTERS_DATA[0];
    let resumeTopic = resumeChapter.topics.find(t => t.id === lastVisited?.topicId) || resumeChapter.topics[0];
    const hasProgress = stats.completedTopicsCount > 0 || stats.examAttemptsCount > 0;

    container.innerHTML = `
      <!-- Section 1: Academic Course Banner -->
      <div class="academic-banner">
        <h2 class="banner-title">${COURSE_INFO.title}</h2>
        <p class="banner-subtitle">${COURSE_INFO.titleEn} — كود المقرر: ${COURSE_INFO.code}</p>
        
        <div class="banner-meta">
          <span class="meta-chip">🏛️ ${COURSE_INFO.university}</span>
          <span class="meta-chip">🔬 ${COURSE_INFO.faculty}</span>
          <span class="meta-chip">💻 ${COURSE_INFO.department}</span>
          <span class="meta-chip">🎯 ${COURSE_INFO.target}</span>
          <span class="meta-chip">📖 ${COURSE_INFO.scope}</span>
        </div>

        <div class="academic-notice">
          <span class="notice-icon">⚠️</span>
          <div class="notice-text">${COURSE_INFO.notice}</div>
        </div>
      </div>

      <!-- Section 2: Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="stat-completed-topics">${stats.totalTopicsCount} / ${stats.completedTopicsCount}</div>
            <div class="stat-label">الموضوعات المكتملة</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="stat-success-rate">${stats.quizzesCorrectRate}%</div>
            <div class="stat-label">نسبة الإجابات الصحيحة</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="stat-highest-score">50 / ${stats.highestScore}</div>
            <div class="stat-label">أعلى نتيجة في الامتحان التجريبي</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon rose">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 14 14"></polyline>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value" id="stat-exam-count">${stats.examAttemptsCount}</div>
            <div class="stat-label">عدد محاولات الامتحانات</div>
          </div>
        </div>
      </div>

      <!-- Section 3: Learning Resume Banner -->
      <div class="dashboard-resume-card">
        <div class="resume-info">
          <span class="resume-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            متابعة التعلم
          </span>
          <h3 class="resume-title">${hasProgress ? `آخر موضوع قيد الدراسة: ${resumeTopic.title}` : "ابدأ مسارك التعليمي من المحاضرة الأولى"}</h3>
          <p class="resume-desc">
            ${hasProgress ? `المحاضرة: ${resumeChapter.lecture} (${resumeChapter.title}) — تابع من حيث توقفت مباشرة لترسيخ المفاهيم.` : "تعرف على نشأة نظم إدارة قواعد البيانات، مقارنتها بنظام الملفات التقليدي، ومعمارية ANSI-SPARC."}
          </p>
        </div>
        <div class="resume-action">
          <button class="btn btn-primary" onclick="${hasProgress ? `window.dbmsApp.resumeTopic('${resumeChapter.id}', '${resumeTopic.id}')` : `window.dbmsApp.openChapter('ch1')`}">
            <span>${hasProgress ? "متابعة من حيث توقفت" : "ابدأ المحاضرة 1"}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>

      <!-- Section 4: Quick Access Cards -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>الوصول السريع لأقسام المنصة</span>
            </h3>
            <p class="card-subtitle">انتقل مباشرة إلى الأدوات التعليمية، المختبرات، ونماذج الامتحانات</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="openModal('reset-modal')">إعادة ضبط تقدمي</button>
        </div>

        <div class="quick-access-grid">
          <!-- 1. Encyclopedia -->
          <div class="quick-card" onclick="window.dbmsApp.switchView('encyclopedia')">
            <div class="quick-card-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
            <div class="quick-card-body">
              <h4 class="quick-card-title">الموسوعة الأكاديمية</h4>
              <p class="quick-card-desc">تغطية تفصيلية كاملة للمحاضرات 1 إلى 9، الرسوم التوضيحية، الجداول، والمعادلات الرياضية.</p>
              <span class="quick-card-link">فتح الموسوعة (8 محاضرات) ←</span>
            </div>
          </div>

          <!-- 2. Simulators -->
          <div class="quick-card" onclick="window.dbmsApp.switchView('simulators')">
            <div class="quick-card-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"></path><path d="M14 9.3V2"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>
            </div>
            <div class="quick-card-body">
              <h4 class="quick-card-title">المختبرات التفاعلية</h4>
              <p class="quick-card-desc">4 أدوات حية: حاسبة إغلاق الصفات والمفاتيح، مراحل التطبيع، تحويل ER، والجبر العلائقي.</p>
              <span class="quick-card-link">تجربة المختبرات الأربعة ←</span>
            </div>
          </div>

          <!-- 3. Mock Exam -->
          <div class="quick-card" onclick="window.dbmsApp.switchView('mock-exam')">
            <div class="quick-card-icon amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div class="quick-card-body">
              <h4 class="quick-card-title">محاكي الامتحان النصفي</h4>
              <p class="quick-card-desc">امتحان تجريبي مطابق للاختبار النصفي من 50 درجة مع مؤقت زمني 60 دقيقة وتقرير تشخيصي.</p>
              <span class="quick-card-link">بدء الامتحان النصفي ←</span>
            </div>
          </div>

          <!-- 4. Question Bank -->
          <div class="quick-card" onclick="window.dbmsApp.switchView('question-bank')">
            <div class="quick-card-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div class="quick-card-body">
              <h4 class="quick-card-title">بنك الأسئلة والحلول</h4>
              <p class="quick-card-desc">8 مسائل كبرى شاملة تغطي التطبيع، الجبر العلائقي، وتصميم EER مع نماذج الإجابة خطوة بخطوة.</p>
              <span class="quick-card-link">استعراض المسائل المحلولة ←</span>
            </div>
          </div>

          <!-- 5. Cheat Sheets -->
          <div class="quick-card" onclick="window.dbmsApp.switchView('cheatsheets')">
            <div class="quick-card-icon teal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            </div>
            <div class="quick-card-body">
              <h4 class="quick-card-title">المراجعة السريعة (Cheat Sheets)</h4>
              <p class="quick-card-desc">جداول الرموز، قواعد التحويل السبع، شروط الصيغ المعيارية، وقوانين الجبر العلائقي المهيأة للطباعة.</p>
              <span class="quick-card-link">فتح بطاقات المراجعة ←</span>
            </div>
          </div>

          <!-- 6. AI Assistant -->
          <div class="quick-card ai-highlight-card" onclick="window.openDbmsAi()">
            <div class="quick-card-icon indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
            </div>
            <div class="quick-card-body">
              <h4 class="quick-card-title">مساعد الداتا بيز AI</h4>
              <p class="quick-card-desc">اسأل المساعد الذكي عن أي مفهوم أو مسألة في المقرر ليجيبك فوراً مع توثيق المصدر من المحاضرات.</p>
              <span class="quick-card-link">بدء محادثة ذكية ←</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 5: Course Map -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
              <span>خارطة المقرر الأكاديمي الشاملة (Course Map)</span>
            </h3>
            <p class="card-subtitle">الترتيب المنهجي لمحاضرات وفصول المقرر مع مؤشرات إنجاز الموضوعات</p>
          </div>
        </div>

        <div class="course-map-grid">
          ${CHAPTERS_DATA.map(ch => {
            const isCompleted = ch.topics.every(t => progressManager.isTopicCompleted(t.id));
            const doneCount = ch.topics.filter(t => progressManager.isTopicCompleted(t.id)).length;
            return `
              <div class="course-chapter-card ${isCompleted ? "completed" : ""}" onclick="window.dbmsApp.openChapter('${ch.id}')">
                <div class="ch-card-header">
                  <span class="ch-badge">${ch.lecture}</span>
                  <span class="ch-status-pill ${isCompleted ? "done" : ""}">${isCompleted ? "✓ مكتمل" : `${doneCount}/${ch.topics.length} موضوع`}</span>
                </div>
                <div class="ch-title">${ch.title}</div>
                <div class="ch-summary">${ch.summary}</div>
                <div class="ch-card-footer">
                  <span class="ch-topics-label">${ch.topics.length} موضوعات تفاعلية</span>
                  <span class="ch-enter-btn">دراسة الفصل ←</span>
                </div>
              </div>
            `;
          }).join("")}

          <!-- Additional Advanced Chapters -->
          <div class="course-chapter-card" onclick="window.dbmsApp.switchView('pitfalls')">
            <div class="ch-card-header">
              <span class="ch-badge danger">الفصل 9</span>
              <span class="ch-status-pill">امتحانات</span>
            </div>
            <div class="ch-title">رادار الأفخاخ الامتحانية</div>
            <div class="ch-summary">تحليل هيكل الامتحانات النصفية لمقرر DBMS وأهم 4 أفخاخ شائعة لتجنب فقدان الدرجات.</div>
            <div class="ch-card-footer">
              <span class="ch-topics-label">4 أفخاخ نموذجية</span>
              <span class="ch-enter-btn">فحص الرادار ←</span>
            </div>
          </div>

          <div class="course-chapter-card" onclick="window.dbmsApp.switchView('question-bank')">
            <div class="ch-card-header">
              <span class="ch-badge warning">الفصل 10 و 11</span>
              <span class="ch-status-pill">بنك الأسئلة</span>
            </div>
            <div class="ch-title">بنك المسائل والحلول النموذجية</div>
            <div class="ch-summary">8 أسئلة امتحانية كبرى مع خطوات الحل النموذجية المفصلة والتبريرات الرياضية.</div>
            <div class="ch-card-footer">
              <span class="ch-topics-label">8 مسائل كبرى</span>
              <span class="ch-enter-btn">استعراض المسائل ←</span>
            </div>
          </div>

          <div class="course-chapter-card" onclick="window.dbmsApp.switchView('cheatsheets')">
            <div class="ch-card-header">
              <span class="ch-badge success">الفصل 12</span>
              <span class="ch-status-pill">بطاقات مراجعة</span>
            </div>
            <div class="ch-title">بطاقات المراجعة السريعة (Cheat Sheets)</div>
            <div class="ch-summary">جداول الرموز وقواعد التحويل السبع والتطبيع والجبر العلائقي المهيأة للطباعة والمراجعة.</div>
            <div class="ch-card-footer">
              <span class="ch-topics-label">جداول ملخصة</span>
              <span class="ch-enter-btn">فتح البطاقات ←</span>
            </div>
          </div>

          <div class="course-chapter-card" onclick="window.dbmsApp.switchView('traceability')">
            <div class="ch-card-header">
              <span class="ch-badge info">الفصل 13</span>
              <span class="ch-status-pill">التوثيق</span>
            </div>
            <div class="ch-title">مصفوفة تتبع السلايدات والمراجع</div>
            <div class="ch-summary">ربط كل مفهوم ومحاضرة في المنصة بملفات المحاضرات الأكاديمية المعتمدة وأرقام صفحاتها.</div>
            <div class="ch-card-footer">
              <span class="ch-topics-label">توثيق شامل</span>
              <span class="ch-enter-btn">عرض المصفوفة ←</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  openChapter(chapterId) {
    this.currentChapterId = chapterId;
    this.switchView("encyclopedia");
  }

  // 2. Encyclopedia (Lectures 1–9)
  renderEncyclopedia() {
    const container = document.getElementById("view-encyclopedia");
    if (!container) return;

    const chapter = CHAPTERS_DATA.find(c => c.id === this.currentChapterId) || CHAPTERS_DATA[0];

    container.innerHTML = `
      <!-- Chapters Horizontal Tabs -->
      <div class="tabs-nav">
        ${CHAPTERS_DATA.map(ch => `
          <button class="tab-btn ${ch.id === chapter.id ? "active" : ""}" onclick="window.dbmsApp.openChapter('${ch.id}')">
            ${ch.lecture}: ${ch.title.split(" ")[0]} ${ch.title.split(" ")[1] || ""}
          </button>
        `).join("")}
      </div>

      <!-- Active Chapter Header Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <span class="ch-badge">${chapter.lecture}</span>
            <h2 class="card-title" style="margin-top: 0.35rem;">${chapter.title}</h2>
            <div class="ltr card-subtitle" style="font-weight: 600; color: var(--primary);">${chapter.titleEn}</div>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            ${chapter.topics.length} موضوعات تفصيلية
          </div>
        </div>
        <p style="color: var(--text-secondary);">${chapter.summary}</p>
      </div>

      <!-- Topics Accordion / Stream -->
      ${chapter.topics.map(topic => {
        const isCompleted = progressManager.isTopicCompleted(topic.id);
        return `
          <div class="card topic-card" id="${topic.id}">
            <div class="card-header">
              <div>
                <h3 class="card-title" style="font-size: 1.15rem;">
                  <span style="color: var(--primary);">§</span> ${topic.title}
                </h3>
                ${topic.titleEn ? `<div class="ltr card-subtitle" style="font-weight: 600;">${topic.titleEn}</div>` : ""}
              </div>
              <button class="btn ${isCompleted ? "btn-success" : "btn-outline"}" onclick="window.dbmsApp.toggleTopic('${topic.id}', '${chapter.id}')">
                ${isCompleted ? "✓ تم إنجاز هذا الموضوع" : "تحديد كمكتمل"}
              </button>
            </div>

            <!-- Content Area -->
            <div class="topic-content academic-prose">
              ${topic.content ? formatAcademicText(topic.content) : ""}
            </div>

            <!-- Embedded Interactive Diagram if any -->
            ${topic.interactiveDiagram === "fileVsDb" ? DiagramRenderer.renderFileVsDb() : ""}
            ${topic.interactiveDiagram === "ansiSparc" ? DiagramRenderer.renderAnsiSparc() : ""}
            ${topic.interactiveDiagram === "keysTree" ? DiagramRenderer.renderKeysTree() : ""}

            <!-- Embedded Interactive Simulator if any -->
            ${topic.id === "ch6-constraints" ? DiagramRenderer.renderEerVisualizer(this.activeEerState.disjoint, this.activeEerState.completeness) : ""}

            <!-- 6 Limitations interactive cards if in ch1 -->
            ${topic.limitations ? `
              <div style="margin-top: 1.5rem;">
                <h4 style="color: var(--primary); margin-bottom: 1rem;">تفصيل العيوب والمشاكل الست للنظام التقليدي:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                  ${topic.limitations.map(lim => `
                    <div style="background-color: var(--bg-subtle); border-right: 4px solid var(--danger); border-radius: var(--radius-md); padding: 1rem;">
                      <div style="font-weight: 700; color: var(--danger); margin-bottom: 0.25rem;">
                        ${lim.number}. ${lim.title} (${lim.titleEn})
                      </div>
                      <div style="font-size: 0.85rem; margin-bottom: 0.4rem;"><strong>السبب:</strong> ${lim.cause}</div>
                      <div style="font-size: 0.85rem; margin-bottom: 0.4rem;"><strong>مثال:</strong> ${lim.example}</div>
                      <div style="font-size: 0.82rem; color: var(--text-muted);"><strong>الأثر:</strong> ${lim.impact}</div>
                    </div>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            <!-- Comparison Table if present -->
            ${topic.table ? `
              <div class="table-responsive">
                <table class="academic-table">
                  <thead>
                    <tr>${topic.table.headers.map(h => `<th>${h}</th>`).join("")}</tr>
                  </thead>
                  <tbody>
                    ${topic.table.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}
                  </tbody>
                </table>
              </div>
            ` : ""}
          </div>
        `;
      }).join("")}

      <!-- Personal Chapter Note Area -->
      <div class="card">
        <h4 class="card-title" style="margin-bottom: 0.75rem;">📝 ملاحظاتي الأكاديمية على هذا الفصل</h4>
        <textarea id="chapter-notes-input" class="form-control" rows="3" placeholder="اكتب ملاحظاتك وتلخيصك الشخصي هنا لحفظها...">${progressManager.getNote(chapter.id)}</textarea>
        <div style="margin-top: 0.75rem; text-align: left;">
          <button class="btn btn-primary" onclick="window.dbmsApp.saveChapterNote('${chapter.id}')">حفظ الملاحظة</button>
        </div>
      </div>
    `;

    // Attach EER select listeners if rendered
    this.attachEerListeners();
  }

  attachEerListeners() {
    const dSelect = document.getElementById("eer-disjoint-select");
    const cSelect = document.getElementById("eer-completeness-select");
    if (dSelect && cSelect) {
      const updateEer = () => {
        this.activeEerState = {
          disjoint: dSelect.value,
          completeness: cSelect.value
        };
        const simContainer = document.getElementById("eer-sim-container");
        if (simContainer) {
          simContainer.outerHTML = DiagramRenderer.renderEerVisualizer(this.activeEerState.disjoint, this.activeEerState.completeness);
          this.attachEerListeners();
        }
      };
      dSelect.addEventListener("change", updateEer);
      cSelect.addEventListener("change", updateEer);
    }
  }

  toggleTopic(topicId, chapterId) {
    const isNow = progressManager.toggleTopicCompleted(topicId, chapterId);
    showToast(isNow ? "تم تحديد الموضوع كمكتمل!" : "تمت إزالة اكتمال الموضوع", "success");
    this.renderEncyclopedia();
    this.updateStatsUI();
  }

  saveChapterNote(chapterId) {
    const textarea = document.getElementById("chapter-notes-input");
    if (textarea) {
      progressManager.saveNote(chapterId, textarea.value);
      showToast("تم حفظ ملاحظاتك بنجاح!", "success");
    }
  }

  // 3. Simulators Lab (4 Tools)
  renderSimulators() {
    const container = document.getElementById("view-simulators");
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">🧪 مختبر المحاكاة التفاعلية (Interactive Simulators Lab)</h2>
            <p class="card-subtitle">تطبيق المفاهيم الرياضية والهندسية عملياً على بيانات وخوارزميات حقيقية</p>
          </div>
        </div>

        <!-- Simulators Sub-tabs -->
        <div class="tabs-nav">
          <button class="tab-btn ${this.currentSimTab === "closure" ? "active" : ""}" onclick="window.dbmsApp.switchSimTab('closure')">
            1. حاسبة إغلاق الصفات والمفاتيح المرشحة (X+ & CK)
          </button>
          <button class="tab-btn ${this.currentSimTab === "normalization" ? "active" : ""}" onclick="window.dbmsApp.switchSimTab('normalization')">
            2. محاكي مراحل التطبيع (Normalization Visualizer)
          </button>
          <button class="tab-btn ${this.currentSimTab === "mapper" ? "active" : ""}" onclick="window.dbmsApp.switchSimTab('mapper')">
            3. محاكي التحويل ذو الخطوات السبع (7-Step ER Mapper)
          </button>
          <button class="tab-btn ${this.currentSimTab === "relational" ? "active" : ""}" onclick="window.dbmsApp.switchSimTab('relational')">
            4. مختبر الجبر العلائقي (Relational Algebra Playground)
          </button>
        </div>

        <div id="sim-tab-content">
          <!-- Dynamic Simulator Content -->
        </div>
      </div>
    `;

    this.renderSimTabContent();
  }

  switchSimTab(tabName) {
    this.currentSimTab = tabName;
    this.renderSimulators();
  }

  renderSimTabContent() {
    const container = document.getElementById("sim-tab-content");
    if (!container) return;

    switch (this.currentSimTab) {
      case "closure":
        this.renderClosureCalculator(container);
        break;
      case "normalization":
        this.renderNormalizationVisualizer(container);
        break;
      case "mapper":
        this.renderErMapper(container);
        break;
      case "relational":
        this.renderRelationalPlayground(container);
        break;
    }

    renderMathInElementSafely(container);
  }

  // Sim 1: Closure & Candidate Keys Calculator
  renderClosureCalculator(container) {
    container.innerHTML = `
      <div class="sim-grid">
        <!-- Input Form -->
        <div style="background-color: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <h4 style="margin-bottom: 1rem; color: var(--primary);">مدخلات المسألة والاعتماديات الوظيفية</h4>

          <div class="form-group">
            <label class="form-label">اختر مسألة جاهزة من المنهج:</label>
            <select id="closure-preset-select" class="form-control">
              <option value="">-- تخصيص مسألة جديدة --</option>
              ${SIMULATOR_PRESETS.closureProblems.map(p => `
                <option value="${p.id}">${p.name}</option>
              `).join("")}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">سمات العلاقة (مفصولة بفاصلة):</label>
            <input type="text" id="closure-attrs-input" class="form-control ltr" value="SSN, FName, LName, PNo, PName, PLocation, Hours" />
          </div>

          <div class="form-group">
            <label class="form-label">الاعتماديات الوظيفية (كل اعتمادية في سطر بصيغة X -> Y):</label>
            <textarea id="closure-fds-input" class="form-control ltr" rows="4">SSN -> FName, LName
PNo -> PName, PLocation
SSN, PNo -> Hours</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">مجموعة السمات المراد حساب إغلاقها X+ :</label>
            <input type="text" id="closure-query-input" class="form-control ltr" value="SSN, PNo" />
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-calc-closure">حساب الإغلاق X+</button>
            <button class="btn btn-outline" id="btn-find-ck">استخراج كافة المفاتيح المرشحة (CKs)</button>
            <button class="btn btn-outline" id="btn-check-bcnf">فحص شرط BCNF</button>
          </div>
        </div>

        <!-- Output Results -->
        <div id="closure-output-card" style="background-color: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <h4 style="margin-bottom: 0.75rem; color: var(--primary);">نتائج الحساب الأكاديمي وخطوات الحل</h4>
          <div id="closure-output-body" style="font-size: 0.9rem; line-height: 1.7;">
            اضغط على "حساب الإغلاق X+" أو "استخراج كافة المفاتيح المرشحة" لبدء التنفيذ وعرض النتائج خطوة بخطوة.
          </div>
        </div>
      </div>
    `;

    // Bind inputs
    const presetSelect = document.getElementById("closure-preset-select");
    const attrsInput = document.getElementById("closure-attrs-input");
    const fdsInput = document.getElementById("closure-fds-input");
    const queryInput = document.getElementById("closure-query-input");
    const outputBody = document.getElementById("closure-output-body");

    presetSelect.addEventListener("change", (e) => {
      const p = SIMULATOR_PRESETS.closureProblems.find(item => item.id === e.target.value);
      if (p) {
        attrsInput.value = p.attributes.join(", ");
        fdsInput.value = p.fds.map(f => `${f.from.join(", ")} -> ${f.to.join(", ")}`).join("\n");
        queryInput.value = p.defaultQuery.join(", ");
      }
    });

    document.getElementById("btn-calc-closure").addEventListener("click", () => {
      try {
        const attrs = ClosureCalculator.parseAttributes(attrsInput.value);
        const fds = ClosureCalculator.parseFDs(fdsInput.value);
        const query = ClosureCalculator.parseAttributes(queryInput.value);

        if (query.length === 0) {
          showToast("يرجى إدخال سمة واحدة على الأقل لحساب الإغلاق.", "error");
          return;
        }

        const res = ClosureCalculator.computeClosure(attrs, fds, query);

        outputBody.innerHTML = `
          <div style="background-color: var(--primary-light); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
            <strong>النتيجة النهائية لإغلاق { ${res.query.join(", ")} }+:</strong>
            <div class="ltr" style="font-size: 1.1rem; font-weight: 700; color: var(--primary); margin: 0.25rem 0;">
              { ${res.finalClosure.join(", ")} }
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              هل يمثل مفتاحاً فائقاً (Superkey)؟ 
              <span class="badge ${res.isSuperkey ? "badge-pk" : "badge-fk"}">
                ${res.isSuperkey ? "نعم (يغطي العلاقة كاملة)" : "لا (ناقص ولا يغطي كل الجدول)"}
              </span>
            </div>
          </div>

          <h5 style="margin-bottom: 0.5rem; font-weight: 700;">خطوات تطبيق الخوارزمية خطوة بخطوة:</h5>
          <div class="table-responsive">
            <table class="academic-table">
              <thead>
                <tr>
                  <th>الخطوة</th>
                  <th>الاعتمادية المطبقة</th>
                  <th>السمات المضافة حديثاً</th>
                  <th>الإغلاق الحالي X+</th>
                </tr>
              </thead>
              <tbody>
                ${res.steps.map(s => `
                  <tr>
                    <td><strong>${s.stepNumber}</strong></td>
                    <td class="ltr">${s.appliedFD}</td>
                    <td class="ltr" style="color: var(--primary); font-weight: 600;">{ ${s.added.join(", ")} }</td>
                    <td class="ltr">{ ${s.currentClosure.join(", ")} }</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
        renderMathInElementSafely(outputBody);
      } catch (err) {
        outputBody.innerHTML = `<div style="color: var(--danger); font-weight: 600;">خطأ: ${err.message}</div>`;
      }
    });

    document.getElementById("btn-find-ck").addEventListener("click", () => {
      try {
        const attrs = ClosureCalculator.parseAttributes(attrsInput.value);
        const fds = ClosureCalculator.parseFDs(fdsInput.value);

        const res = ClosureCalculator.findCandidateKeys(attrs, fds);

        outputBody.innerHTML = `
          <div style="background-color: var(--success-light); padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
            <strong style="color: var(--success);">المفاتيح المرشحة الأصغرية (Candidate Keys) المستخرجة:</strong>
            <div class="ltr" style="font-size: 1.15rem; font-weight: 800; color: #065f46; margin: 0.5rem 0;">
              ${res.candidateKeys.map(k => `( ${k.join(", ")} )`).join("  و  ")}
            </div>
            <div style="font-size: 0.85rem; color: #047857;">
              إجمالي عدد المفاتيح المرشحة: ${res.candidateKeys.length} مفتاح
            </div>
          </div>

          <h5 style="margin-bottom: 0.5rem; font-weight: 700;">تصنيف السمات وفق الاستدلال الأكاديمي (L, R, B, N):</h5>
          <div class="table-responsive">
            <table class="academic-table">
              <thead>
                <tr>
                  <th>التصنيف</th>
                  <th>السمات</th>
                  <th>الدلالة الأكاديمية</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>المجموعة L (Left-only)</strong></td>
                  <td class="ltr">{ ${res.classification.L.join(", ")} }</td>
                  <td>تظهر في اليسار فقط $\\implies$ <strong>إلزامية في كل مفتاح مرشح</strong></td>
                </tr>
                <tr>
                  <td><strong>المجموعة R (Right-only)</strong></td>
                  <td class="ltr">{ ${res.classification.R.join(", ")} }</td>
                  <td>تظهر في اليمين فقط $\\implies$ <strong>لا تدخل في أي مفتاح مرشح</strong></td>
                </tr>
                <tr>
                  <td><strong>المجموعة B (Both)</strong></td>
                  <td class="ltr">{ ${res.classification.B.join(", ")} }</td>
                  <td>تظهر في الطرفين $\\implies$ تختبر كمركبات مع السمات الإلزامية</td>
                </tr>
                <tr>
                  <td><strong>المجموعة N (Neither)</strong></td>
                  <td class="ltr">{ ${res.classification.N.join(", ")} }</td>
                  <td>لا تظهر في أي اعتمادية $\\implies$ <strong>إلزامية في كل مفتاح مرشح</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
        renderMathInElementSafely(outputBody);
      } catch (err) {
        outputBody.innerHTML = `<div style="color: var(--danger); font-weight: 600;">خطأ: ${err.message}</div>`;
      }
    });

    document.getElementById("btn-check-bcnf").addEventListener("click", () => {
      try {
        const attrs = ClosureCalculator.parseAttributes(attrsInput.value);
        const fds = ClosureCalculator.parseFDs(fdsInput.value);

        const res = ClosureCalculator.checkBCNF(attrs, fds);

        outputBody.innerHTML = `
          <div style="background-color: ${res.isBCNF ? "var(--success-light)" : "var(--danger-light)"}; padding: 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
            <strong style="color: ${res.isBCNF ? "var(--success)" : "var(--danger)"};">
              نتيجة فحص شرط BCNF: ${res.isBCNF ? "العلاقة في صيغة BCNF ✓" : "العلاقة تنتهك شرط BCNF ❌"}
            </strong>
            <p style="font-size: 0.85rem; margin-top: 0.35rem;">
              الشرط الصارم: لكل اعتمادية وظيفية غير بديهية X → A، يجب أن يكون الطرف الأيسر X مفتاحاً فائقاً (Superkey).
            </p>
          </div>

          ${res.violations.length > 0 ? `
            <h5 style="color: var(--danger); font-weight: 700; margin-bottom: 0.5rem;">الاعتماديات المنتهكة لشرط BCNF:</h5>
            ${res.violations.map(v => `
              <div style="background-color: var(--bg-subtle); border-right: 3px solid var(--danger); padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.5rem; font-size: 0.85rem;">
                <div class="ltr" style="font-weight: 700; color: var(--danger);">{ ${v.fd.from.join(", ")} } → { ${v.fd.to.join(", ")} }</div>
                <div style="margin-top: 0.25rem;">${v.reason}</div>
              </div>
            `).join("")}
          ` : `
            <div style="color: var(--success); font-weight: 600;">كافة المحددات تمثل مفاتيح فائقة تغطي كامل العلاقة!</div>
          `}
        `;
        renderMathInElementSafely(outputBody);
      } catch (err) {
        outputBody.innerHTML = `<div style="color: var(--danger); font-weight: 600;">خطأ: ${err.message}</div>`;
      }
    });
  }

  // Sim 2: Normalization Visualizer
  renderNormalizationVisualizer(container) {
    const currentCase = NORMALIZATION_CASES[this.normalizationCase];
    const steps = currentCase.steps;
    const currentStep = steps[this.normalizationStepIdx] || steps[0];

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h4 style="color: var(--primary);">${currentCase.title}</h4>
          <div style="font-size: 0.85rem; color: var(--text-muted);">تتبع مراحل تفكيك الجدول خطوة بخطوة حتى BCNF</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn ${this.normalizationCase === "dreamhome" ? "btn-primary" : "btn-outline"}" onclick="window.dbmsApp.setNormCase('dreamhome')">
            مثال DreamHome
          </button>
          <button class="btn ${this.normalizationCase === "student_record" ? "btn-primary" : "btn-outline"}" onclick="window.dbmsApp.setNormCase('student_record')">
            مثال STUDENT_RECORD
          </button>
        </div>
      </div>

      <!-- Stepper Indicator -->
      <div class="stepper-nav">
        ${steps.map((st, i) => `
          <div class="step-node ${i === this.normalizationStepIdx ? "active" : i < this.normalizationStepIdx ? "completed" : ""}" onclick="window.dbmsApp.setNormStep(${i})">
            ${st.stage}
          </div>
        `).join("")}
      </div>

      <!-- Active Stage Card -->
      <div class="card" style="border-top: 4px solid var(--primary);">
        <div class="card-header">
          <h4 class="card-title">${currentStep.title}</h4>
          <span class="badge badge-pk" style="font-size: 0.85rem;">المرحلة ${this.normalizationStepIdx + 1} من ${steps.length}</span>
        </div>

        <!-- Problem Box -->
        <div style="background-color: var(--danger-light); border-right: 4px solid var(--danger); padding: 0.85rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.9rem;">
          <strong>المشكلة والخلل المرصود:</strong> ${currentStep.problem}
        </div>

        <!-- Action Box -->
        <div style="background-color: var(--success-light); border-right: 4px solid var(--success); padding: 0.85rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; font-size: 0.9rem;">
          <strong>الإجراء التصميمي المتخذ:</strong> ${currentStep.action}
        </div>

        <!-- Tables representation -->
        <h5 style="margin-bottom: 0.75rem; font-weight: 700;">هيكل الجداول في هذه المرحلة:</h5>
        ${currentStep.tables ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${currentStep.tables.map(t => `
              <div style="background-color: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
                <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;" class="ltr">${t.name}</div>
                <div class="schema-box" style="margin: 0;">
                  ${t.name} (
                  ${t.attributes.map(a => `
                    <span style="${a.pk ? "text-decoration: underline; font-weight: bold; color: #b45309;" : ""}">
                      ${a.name}${a.fk ? " [FK]" : ""}
                    </span>
                  `).join(" , ")}
                  )
                </div>
              </div>
            `).join("")}
          </div>
        ` : `
          <div class="schema-box">
            ${currentStep.tableName} (
            ${currentStep.attributes.map(a => `
              <span style="${a.pk ? "text-decoration: underline; font-weight: bold; color: #b45309;" : ""}">
                ${a.name}
              </span>
            `).join(" , ")}
            )
          </div>
        `}

        <div style="margin-top: 1.5rem; display: flex; justify-content: space-between;">
          <button class="btn btn-outline" ${this.normalizationStepIdx === 0 ? "disabled" : ""} onclick="window.dbmsApp.setNormStep(${this.normalizationStepIdx - 1})">
            ← المرحلة السابقة
          </button>
          <button class="btn btn-primary" ${this.normalizationStepIdx === steps.length - 1 ? "disabled" : ""} onclick="window.dbmsApp.setNormStep(${this.normalizationStepIdx + 1})">
            المرحلة التالية →
          </button>
        </div>
      </div>
    `;
  }

  setNormCase(caseKey) {
    this.normalizationCase = caseKey;
    this.normalizationStepIdx = 0;
    this.renderSimTabContent();
  }

  setNormStep(idx) {
    this.normalizationStepIdx = idx;
    this.renderSimTabContent();
  }

  // Sim 3: 7-Step ER Mapper
  renderErMapper(container) {
    const step = MAPPING_STEPS_DATA[this.mappingStepIdx] || MAPPING_STEPS_DATA[0];

    container.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <h4 style="color: var(--primary);">محاكي خوارزمية التحويل الرسمية في 7 خطوات (ER-to-Relational Mapper)</h4>
        <div style="font-size: 0.85rem; color: var(--text-muted);">تحويل مخططات ER إلى مخططات قواعد بيانات علائقية متوافقة</div>
      </div>

      <!-- Steps Selector Pills -->
      <div class="tabs-nav">
        ${MAPPING_STEPS_DATA.map((st, i) => `
          <button class="tab-btn ${i === this.mappingStepIdx ? "active" : ""}" onclick="window.dbmsApp.setMappingStep(${i})">
            خطوة ${st.step}
          </button>
        `).join("")}
      </div>

      <!-- Step Card -->
      <div class="card" style="border-top: 4px solid var(--primary);">
        <div class="card-header">
          <h3 class="card-title">${step.title}</h3>
          <span class="badge badge-pk">الخطوة ${step.step} من 7</span>
        </div>

        <div style="font-size: 0.95rem; line-height: 1.8; margin-bottom: 1.25rem;">
          <p><strong>القاعدة الأكاديمية:</strong> ${step.rule}</p>
        </div>

        <div class="sim-grid">
          <div style="background-color: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-weight: 700; color: #b45309; margin-bottom: 0.35rem;">🔑 ضابط المفتاح الأساسي (PK):</div>
            <div style="font-size: 0.88rem;">${step.pkRule}</div>
          </div>

          <div style="background-color: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-weight: 700; color: #0369a1; margin-bottom: 0.35rem;">🔗 ضابط المفتاح الأجنبي (FK):</div>
            <div style="font-size: 0.88rem;">${step.fkRule}</div>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <h5 style="margin-bottom: 0.5rem; font-weight: 700;">المثال التطبيقي المعتمد:</h5>
          <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">${step.example}</div>
          <div class="schema-box ltr">${step.resultSchema}</div>
        </div>

        <div style="margin-top: 1.5rem; display: flex; justify-content: space-between;">
          <button class="btn btn-outline" ${this.mappingStepIdx === 0 ? "disabled" : ""} onclick="window.dbmsApp.setMappingStep(${this.mappingStepIdx - 1})">
            ← الخطوة السابقة
          </button>
          <button class="btn btn-primary" ${this.mappingStepIdx === MAPPING_STEPS_DATA.length - 1 ? "disabled" : ""} onclick="window.dbmsApp.setMappingStep(${this.mappingStepIdx + 1})">
            الخطوة التالية →
          </button>
        </div>
      </div>
    `;
  }

  setMappingStep(idx) {
    this.mappingStepIdx = idx;
    this.renderSimTabContent();
  }

  // Sim 4: Relational Algebra Playground
  renderRelationalPlayground(container) {
    const tableNames = Object.keys(SIMULATOR_PRESETS.relationalTables);

    container.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <h4 style="color: var(--primary);">مختبر الجبر العلائقي التفاعلي (Relational Algebra Playground)</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          محرك حقيقي ينفذ العمليات الجبرية، يحذف التكرار تلقائياً في الإسقاط، ويتحقق بصرامة من شرط التوافقية للاتحاد.
        </p>
      </div>

      <div class="sim-grid">
        <!-- Controls -->
        <div style="background-color: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div class="form-group">
            <label class="form-label">العملية الجبرية المطلوبة:</label>
            <select id="ra-op-select" class="form-control">
              <option value="select">الاختيار (Selection: σ)</option>
              <option value="project">الإسقاط (Projection: π - مع إزالة التكرار)</option>
              <option value="cartesian">حاصل الضرب الديكارتي (Cartesian: ×)</option>
              <option value="union">الاتحاد (Union: ∪)</option>
              <option value="intersect">التقاطع (Intersection: ∩)</option>
              <option value="diff">الفرق / الطرح (Difference: −)</option>
              <option value="join">الربط الطبيعي (Natural Join: ⋈)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">الجدول الأساسي (Relation R):</label>
            <select id="ra-table1-select" class="form-control">
              ${tableNames.map(t => `<option value="${t}">${t}</option>`).join("")}
            </select>
          </div>

          <div class="form-group" id="ra-table2-group" style="display: none;">
            <label class="form-label">الجدول الثاني (Relation S):</label>
            <select id="ra-table2-select" class="form-control">
              ${tableNames.map((t, i) => `<option value="${t}" ${i === 1 ? "selected" : ""}>${t}</option>`).join("")}
            </select>
          </div>

          <div class="form-group" id="ra-condition-group">
            <label class="form-label">شرط الاختيار (Condition):</label>
            <input type="text" id="ra-condition-input" class="form-control ltr" value="Salary > 20000" placeholder="مثال: Salary > 20000 أو City = 'Tripoli'" />
          </div>

          <div class="form-group" id="ra-columns-group" style="display: none;">
            <label class="form-label">الأعمدة المراد إسقاطها (مفصولة بفاصلة):</label>
            <input type="text" id="ra-columns-input" class="form-control ltr" value="Position" placeholder="Position أو Name, Salary" />
          </div>

          <button class="btn btn-primary" id="btn-run-ra" style="width: 100%;">تنفيذ العملية الجبرية</button>
        </div>

        <!-- Output Result Table -->
        <div style="background-color: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="color: var(--primary);">نتيجة الاستعلام الجبري</h4>
            <div id="ra-meta-badge"></div>
          </div>
          <div id="ra-output-container" style="font-size: 0.88rem; min-height: 200px;">
            اختر العملية واضغط على "تنفيذ العملية الجبرية" لمشاهدة الجدول الناتج وحسابات Degree و Cardinality.
          </div>
        </div>
      </div>
    `;

    // Dynamic Form adjustments
    const opSelect = document.getElementById("ra-op-select");
    const t2Group = document.getElementById("ra-table2-group");
    const condGroup = document.getElementById("ra-condition-group");
    const colsGroup = document.getElementById("ra-columns-group");

    opSelect.addEventListener("change", (e) => {
      const op = e.target.value;
      if (op === "select") {
        condGroup.style.display = "block";
        colsGroup.style.display = "none";
        t2Group.style.display = "none";
      } else if (op === "project") {
        condGroup.style.display = "none";
        colsGroup.style.display = "block";
        t2Group.style.display = "none";
      } else {
        condGroup.style.display = "none";
        colsGroup.style.display = "none";
        t2Group.style.display = "block";
      }
    });

    document.getElementById("btn-run-ra").addEventListener("click", () => {
      const op = opSelect.value;
      const t1 = document.getElementById("ra-table1-select").value;
      const t2 = document.getElementById("ra-table2-select").value;
      const cond = document.getElementById("ra-condition-input").value;
      const cols = document.getElementById("ra-columns-input").value.split(",").map(c => c.trim()).filter(Boolean);

      const out = document.getElementById("ra-output-container");
      const badge = document.getElementById("ra-meta-badge");

      try {
        let res;
        switch (op) {
          case "select":
            res = this.relationalEngine.select(t1, cond);
            break;
          case "project":
            res = this.relationalEngine.project(t1, cols);
            break;
          case "cartesian":
            res = this.relationalEngine.cartesian(t1, t2);
            break;
          case "union":
            res = this.relationalEngine.union(t1, t2);
            break;
          case "intersect":
            res = this.relationalEngine.intersection(t1, t2);
            break;
          case "diff":
            res = this.relationalEngine.difference(t1, t2);
            break;
          case "join":
            res = this.relationalEngine.naturalJoin(t1, t2);
            break;
        }

        badge.innerHTML = `
          <span class="badge badge-pk">الدرجة: ${res.degree} أعمدة</span>
          <span class="badge badge-fk">الصفوف: ${res.cardinality}</span>
        `;

        let extraNote = "";
        if (op === "project" && res.duplicatesRemoved !== undefined) {
          extraNote = `
            <div style="background-color: var(--info-light); color: var(--info); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem;">
              ℹ️ تم حذف <strong>${res.duplicatesRemoved} صفوف مكررة</strong> تلقائياً عملاً بخاصية المجموعات الجبرية!
            </div>
          `;
        }

        out.innerHTML = `
          ${extraNote}
          <div class="schema-box ltr" style="margin-top: 0;">${res.name}</div>
          <div class="table-responsive">
            <table class="academic-table ltr">
              <thead>
                <tr>${res.columns.map(c => `<th>${c}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${res.data.length > 0 ? res.data.map(r => `
                  <tr>${r.map(val => `<td>${val !== null ? val : "<span style='color: #ef4444;'>NULL</span>"}</td>`).join("")}</tr>
                `).join("") : `<tr><td colspan="${res.columns.length}" style="text-align: center; color: var(--text-muted);">النتيجة علاقة خالية من الصفوف (Empty Relation)</td></tr>`}
              </tbody>
            </table>
          </div>
        `;
      } catch (err) {
        badge.innerHTML = "";
        out.innerHTML = `
          <div style="background-color: var(--danger-light); border-right: 4px solid var(--danger); padding: 1rem; border-radius: var(--radius-sm); color: var(--text-primary);">
            <strong style="color: var(--danger);">خطأ في التنفيذ:</strong>
            <p style="margin-top: 0.35rem; white-space: pre-line;">${err.message}</p>
          </div>
        `;
      }
    });
  }

  // 4. Past Exams Analysis & Pitfalls Radar
  renderPitfalls() {
    const container = document.getElementById("view-pitfalls");
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">🎯 رادار الأفخاخ الامتحانية وتحليل أسئلة الامتحانات النصفية</h2>
            <p class="card-subtitle">دراسة نماذج الامتحانات النصفية والأخطاء الشائعة التي يقع فيها الطلاب</p>
          </div>
        </div>

        <!-- 4 Radar Cards -->
        <h3 style="color: var(--primary); margin-bottom: 1rem;">الأفخاخ الأربعة الأكثر تكراراً في الامتحانات:</h3>
        <div class="radar-grid">
          ${PITFALLS_DATA.map(p => `
            <div class="radar-card">
              <span class="radar-tag">فخ امتحاني #${p.number}</span>
              <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem;">${p.title}</h4>
              <div class="ltr" style="font-size: 0.8rem; color: var(--primary); font-weight: 600; margin-bottom: 0.75rem;">
                ${p.concept}
              </div>

              <div class="radar-trap-box">
                <strong>الخطأ الشائع:</strong> ${p.trap}
              </div>

              <div class="radar-correction-box">
                <strong>التصحيح الأكاديمي:</strong> ${p.correction}
              </div>

              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                <strong>مثال:</strong> ${p.example}
              </div>

              <!-- Interactive Mini Quiz -->
              <div style="background-color: var(--bg-subtle); padding: 0.85rem; border-radius: var(--radius-sm); margin-top: auto;">
                <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem;">سؤال تدريبي فوري:</div>
                <div style="font-size: 0.82rem; margin-bottom: 0.5rem;">${p.quiz.question}</div>
                <div style="display: flex; flex-direction: column; gap: 0.35rem;" id="quiz-options-${p.id}">
                  ${p.quiz.options.map((opt, optIdx) => `
                    <button class="btn btn-outline" style="justify-content: flex-start; font-size: 0.8rem; padding: 0.35rem 0.65rem;" onclick="window.dbmsApp.answerPitfallQuiz('${p.id}', ${optIdx}, ${p.quiz.correctIndex}, '${p.quiz.explanation.replace(/'/g, "\\'")}')">
                      ${opt}
                    </button>
                  `).join("")}
                </div>
                <div id="quiz-feedback-${p.id}" style="margin-top: 0.5rem; font-size: 0.8rem; display: none;"></div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  answerPitfallQuiz(pitfallId, selectedIdx, correctIdx, explanation) {
    const feedbackEl = document.getElementById(`quiz-feedback-${pitfallId}`);
    const isCorrect = selectedIdx === correctIdx;

    progressManager.recordQuizSolved(`pitfall-${pitfallId}`, isCorrect);

    if (feedbackEl) {
      feedbackEl.style.display = "block";
      feedbackEl.style.color = isCorrect ? "var(--success)" : "var(--danger)";
      feedbackEl.innerHTML = `
        <strong>${isCorrect ? "✓ إجابة صحيحة وممتازة!" : "❌ إجابة خاطئة!"}</strong>
        <p style="margin-top: 0.2rem; color: var(--text-primary);">${explanation}</p>
      `;
    }
  }

  // 5. Timed Mock Exam Simulator
  renderMockExam() {
    const container = document.getElementById("view-mock-exam");
    if (!container) return;

    if (!this.mockExamEngine.isRunning && !this.mockExamEngine.isSubmitted) {
      // Exam Setup Screen
      container.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto;">
          <div class="card-header">
            <div>
              <h2 class="card-title">⏱️ محاكي الامتحان النصفي الشامل (Timed Mock Exam)</h2>
              <p class="card-subtitle">اختبار تدريبي يحاكي ظروف وتوزيع درجات الامتحان الجامعي (50 درجة)</p>
            </div>
          </div>

          <div style="font-size: 0.92rem; line-height: 1.8; color: var(--text-secondary); margin-bottom: 1.5rem;">
            <p>يغطي الامتحان المحاضرات التسع الأولى وفق التوزيع المتوازن المعتمد:</p>
            <ul style="padding-right: 1.5rem; margin: 0.75rem 0;">
              <li><strong>السؤال الأول (10 درجات):</strong> 10 عبارات صواب أو خطأ مع اختيار التصحيح الأكاديمي.</li>
              <li><strong>السؤال الثاني (15 درجة):</strong> 10 أسئلة مفاهيم واختيار من متعدد شاملة للمقرر.</li>
              <li><strong>السؤال الثالث (12 درجة):</strong> مسألة تطبيع STUDENT_RECORD وحساب الإغلاق والمفاتيح.</li>
              <li><strong>السؤال الرابع (13 درجة):</strong> أسئلة التصميم المتقدم EER والتحويل والجبر العلائقي.</li>
            </ul>
            <p style="color: var(--danger); font-weight: 600;">
              ⚠️ عند بدء الامتحان، سيتم تفعيل وضع التركيز (Exam Lock Mode) وإخفاء القائمة الجانبية والملاحظات.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">اختر مدة الامتحان التدريبي:</label>
            <select id="exam-duration-select" class="form-control" style="max-width: 300px;">
              <option value="60">60 دقيقة (محاكاة كاملة للامتحان الرسمي)</option>
              <option value="20">20 دقيقة (مراجعة سريعة ومكثفة)</option>
            </select>
          </div>

          <button class="btn btn-primary" style="font-size: 1.05rem; padding: 0.75rem 2rem;" onclick="window.dbmsApp.startExam()">
            ابدأ الامتحان الآن 🚀
          </button>

          <!-- Attempts History -->
          ${progressManager.getExamHistory().length > 0 ? `
            <div style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
              <h4 style="margin-bottom: 0.75rem; color: var(--primary);">سجل محاولاتك السابقة:</h4>
              <div class="table-responsive">
                <table class="academic-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الدرجة</th>
                      <th>النسبة</th>
                      <th>الوقت المستغرق</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${progressManager.getExamHistory().map(att => `
                      <tr>
                        <td>${att.date}</td>
                        <td><strong>${att.score} / ${att.maxScore}</strong></td>
                        <td>${att.percentage}%</td>
                        <td>${formatTime(att.durationSeconds)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ""}
        </div>
      `;
    } else if (this.mockExamEngine.isRunning) {
      // Live Exam Screen
      this.renderLiveExam(container);
    }
  }

  startExam() {
    const sel = document.getElementById("exam-duration-select");
    const duration = sel ? Number(sel.value) : 60;

    this.mockExamEngine.start(duration);
    this.renderMockExam();
    this.startExamTimer();
  }

  startExamTimer() {
    if (this.mockExamEngine.timerInterval) clearInterval(this.mockExamEngine.timerInterval);

    this.mockExamEngine.timerInterval = setInterval(() => {
      this.mockExamEngine.remainingSeconds--;
      this.mockExamEngine.saveState();
      this.updateTimerDisplay();

      if (this.mockExamEngine.remainingSeconds <= 0) {
        clearInterval(this.mockExamEngine.timerInterval);
        showToast("انتهى وقت الامتحان! يتم تسليم الإجابات الآن...", "warning");
        this.submitExam();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const el = document.getElementById("exam-timer-digits");
    const bar = document.getElementById("exam-timer-bar");
    if (!el) return;

    const secs = this.mockExamEngine.remainingSeconds;
    el.textContent = formatTime(secs);

    if (secs < 300) {
      el.className = "timer-digits danger";
    } else if (secs < 600) {
      el.className = "timer-digits warning";
    }

    if (bar) {
      const totalSecs = this.mockExamEngine.exam.durationMinutes * 60;
      const pct = (secs / totalSecs) * 100;
      bar.style.width = `${pct}%`;
    }
  }

  renderLiveExam(container) {
    const exam = this.mockExamEngine.exam;

    container.innerHTML = `
      <!-- Sticky Timer Banner -->
      <div class="timer-banner">
        <div>
          <div style="font-weight: 700; font-size: 1.1rem;">⏱️ الامتحان النصفي التجريبي (وضع التركيز)</div>
          <div style="font-size: 0.82rem; opacity: 0.85;">المجموع الكلي: 50 درجة — يتم الحفظ تلقائياً</div>
        </div>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          <div class="timer-digits" id="exam-timer-digits">${formatTime(this.mockExamEngine.remainingSeconds)}</div>
          <button class="btn btn-danger" onclick="window.dbmsApp.confirmSubmitExam()">تسليم الامتحان</button>
        </div>
      </div>

      <!-- Sections & Questions Form -->
      <form id="exam-form" onsubmit="event.preventDefault();">
        ${exam.sections.map((sec, sIdx) => `
          <div class="card" style="margin-bottom: 2rem;">
            <div class="card-header">
              <div>
                <h3 class="card-title">${sec.title}</h3>
                <p class="card-subtitle">${sec.description}</p>
              </div>
              <span class="badge badge-pk">${sec.marks} درجات</span>
            </div>

            <!-- Questions -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              ${sec.questions.map((q, qIdx) => {
                const currentAns = this.mockExamEngine.getAnswer(q.id);
                return `
                <div style="background-color: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                      ${qIdx + 1}. ${q.text}
                    </div>
                    <span class="badge badge-fk">${q.marks} درجات</span>
                  </div>

                  ${sec.id === "sec-tf" ? `
                    <!-- T/F Options -->
                    <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem;">
                      <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                        <input type="radio" name="tf_${q.id}" value="true" ${currentAns && currentAns.choice === "true" ? "checked" : ""} onchange="window.dbmsApp.handleTFChange('${q.id}', 'true')" />
                        <strong>( ✔ ) صحيح</strong>
                      </label>
                      <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                        <input type="radio" name="tf_${q.id}" value="false" ${currentAns && currentAns.choice === "false" ? "checked" : ""} onchange="window.dbmsApp.handleTFChange('${q.id}', 'false')" />
                        <strong>( ❌ ) خطأ</strong>
                      </label>
                    </div>

                    <!-- Correction picker if selected False -->
                    <div id="correction-box-${q.id}" style="display: ${currentAns && currentAns.choice === "false" ? "block" : "none"}; margin-top: 0.5rem; background-color: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                      <label style="font-size: 0.85rem; font-weight: 600; color: var(--danger); display: block; margin-bottom: 0.35rem;">
                        اختر التصحيح الأكاديمي المعتمد للعبارة الخاطئة:
                      </label>
                      ${q.correctionOptions ? q.correctionOptions.map((opt, cIdx) => `
                        <label style="display: flex; align-items: flex-start; gap: 0.4rem; font-size: 0.85rem; margin-bottom: 0.35rem; cursor: pointer;">
                          <input type="radio" name="corr_${q.id}" value="${cIdx}" ${currentAns && currentAns.correctionIndex === cIdx ? "checked" : ""} onchange="window.dbmsApp.handleCorrectionChange('${q.id}', ${cIdx})" />
                          <span>${opt}</span>
                        </label>
                      `).join("") : ""}
                    </div>
                  ` : `
                    <!-- MCQ Options -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                      ${q.options.map((opt, optIdx) => `
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; padding: 0.5rem; background-color: var(--bg-surface); border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer;">
                          <input type="radio" name="mcq_${q.id}" value="${optIdx}" ${currentAns !== undefined && Number(currentAns) === optIdx ? "checked" : ""} onchange="window.dbmsApp.handleMCQChange('${q.id}', ${optIdx})" />
                          <span>${opt}</span>
                        </label>
                      `).join("")}
                    </div>
                  `}
                </div>
              `}).join("")}
            </div>
          </div>
        `).join("")}

        <div style="text-align: center; margin: 2rem 0;">
          <button class="btn btn-danger" style="font-size: 1.1rem; padding: 0.85rem 3rem;" onclick="window.dbmsApp.confirmSubmitExam()">
            تسليم الامتحان النهائي للتقييم 📥
          </button>
        </div>
      </form>
    `;
  }

  handleTFChange(qId, val) {
    const current = this.mockExamEngine.getAnswer(qId) || {};
    current.choice = val;
    this.mockExamEngine.setAnswer(qId, current);

    const corrBox = document.getElementById(`correction-box-${qId}`);
    if (corrBox) {
      corrBox.style.display = val === "false" ? "block" : "none";
    }
  }

  handleCorrectionChange(qId, cIdx) {
    const current = this.mockExamEngine.getAnswer(qId) || {};
    current.correctionIndex = cIdx;
    this.mockExamEngine.setAnswer(qId, current);
  }

  handleMCQChange(qId, optIdx) {
    this.mockExamEngine.setAnswer(qId, optIdx);
  }

  confirmSubmitExam() {
    if (confirm("هل أنت متأكد من تسليم ورقة الامتحان الآن لحساب الدرجة والتقرير؟")) {
      this.submitExam();
    }
  }

  submitExam() {
    const result = this.mockExamEngine.submitExam();
    this.renderDiagnosticReport(result);
  }

  renderDiagnosticReport(result) {
    const container = document.getElementById("view-mock-exam");
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="max-width: 900px; margin: 0 auto; border-top: 6px solid ${result.percentage >= 70 ? "var(--success)" : "var(--danger)"};">
        <div class="card-header">
          <div>
            <h2 class="card-title">📊 التقرير التشخيصي الأكاديمي للامتحان (Diagnostic Report)</h2>
            <p class="card-subtitle">تحليل مستوى الطالب، تحديد نقاط القوة والموضوعات التي تتطلب المراجعة</p>
          </div>
          <button class="btn btn-outline" onclick="window.print()">🖨️ طباعة التقرير</button>
        </div>

        <!-- Score Overview -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; text-align: center;">
          <div style="background-color: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md);">
            <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${result.score} / ${result.maxScore}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">الدرجة الإجمالية</div>
          </div>

          <div style="background-color: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md);">
            <div style="font-size: 2rem; font-weight: 800; color: ${result.percentage >= 70 ? "var(--success)" : "var(--danger)"};">${result.percentage}%</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">النسبة المئوية</div>
          </div>

          <div style="background-color: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md);">
            <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">${formatTime(result.durationSeconds)}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">الوقت المستغرق</div>
          </div>

          <div style="background-color: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md);">
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--success);">${result.correctCount} <span style="font-size: 1rem; color: var(--text-muted);">صحيح</span> / <span style="color: var(--danger);">${result.wrongCount}</span> <span style="font-size: 1rem; color: var(--text-muted);">خطأ</span></div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">عدد الإجابات</div>
          </div>
        </div>

        <!-- Section Breakdown -->
        <h4 style="margin-bottom: 0.75rem; color: var(--primary);">توزيع الدرجات حسب أقسام الامتحان:</h4>
        <div class="table-responsive" style="margin-bottom: 2rem;">
          <table class="academic-table">
            <thead>
              <tr>
                <th>القسم</th>
                <th>الدرجة المحرزة</th>
                <th>الدرجة الكاملة</th>
                <th>نسبة الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              ${result.sectionBreakdowns.map(s => `
                <tr>
                  <td><strong>${s.title}</strong></td>
                  <td><strong>${s.earnedMarks}</strong></td>
                  <td>${s.maxMarks}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div class="progress-bar-mini" style="width: 100px;">
                        <div class="progress-fill-mini" style="width: ${s.percentage}%;"></div>
                      </div>
                      <span>${s.percentage}%</span>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- Diagnostic Feedback: Mastered vs Review Needed -->
        <div class="sim-grid" style="margin-bottom: 2rem;">
          <div style="background-color: var(--success-light); border-right: 4px solid var(--success); padding: 1.25rem; border-radius: var(--radius-md);">
            <h5 style="color: var(--success); font-weight: 800; margin-bottom: 0.5rem;">✓ الموضوعات المتقنة (Mastered):</h5>
            ${result.masteredTopics.length > 0 ? `
              <ul style="padding-right: 1.25rem; font-size: 0.88rem;">
                ${result.masteredTopics.map(t => `<li>${t.topic} (${t.percentage}%)</li>`).join("")}
              </ul>
            ` : `<div style="font-size: 0.85rem;">لم تصل نسبة الإتقان إلى 80% في أي موضوع بعد. يُنصح بإعادة مراجعة الفصول.</div>`}
          </div>

          <div style="background-color: var(--danger-light); border-right: 4px solid var(--danger); padding: 1.25rem; border-radius: var(--radius-md);">
            <h5 style="color: var(--danger); font-weight: 800; margin-bottom: 0.5rem;">⚠️ الموضوعات التي تحتاج لمراجعة فورية:</h5>
            ${result.reviewTopics.length > 0 ? `
              <ul style="padding-right: 1.25rem; font-size: 0.88rem;">
                ${result.reviewTopics.map(t => `<li>${t.topic} (${t.percentage}%)</li>`).join("")}
              </ul>
            ` : `<div style="font-size: 0.85rem;">أداء ممتاز! تم إتقان كافة الموضوعات بنجاح.</div>`}
          </div>
        </div>

        <!-- Detailed Question Review -->
        <h4 style="margin-bottom: 1rem; color: var(--primary);">مراجعة وتفسير كافة إجابات الامتحان:</h4>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${result.questionDetails.map((q, idx) => `
            <div style="background-color: var(--bg-subtle); border-right: 4px solid ${q.isCorrect ? "var(--success)" : "var(--danger)"}; padding: 1rem; border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                <div style="font-weight: 700; font-size: 0.9rem;">${idx + 1}. ${q.text}</div>
                <span class="badge ${q.isCorrect ? "badge-pk" : "badge-fk"}">${q.earned} / ${q.maxMarks} درجات</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">
                <strong>التفسير الأكاديمي والنموذجي:</strong> ${q.explanation}
              </div>
            </div>
          `).join("")}
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn btn-primary" onclick="window.dbmsApp.resetExamScreen()">إجراء محاولة جديدة 🔄</button>
        </div>
      </div>
    `;

    renderMathInElementSafely(container);
  }

  resetExamScreen() {
    this.mockExamEngine.isRunning = false;
    this.mockExamEngine.isSubmitted = false;
    this.renderMockExam();
  }

  // 6. Question Bank & Model Answers
  renderQuestionBank() {
    const container = document.getElementById("view-question-bank");
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">📝 بنك الأسئلة التدريبية والحلول النموذجية الشاملة</h2>
            <p class="card-subtitle">الأسئلة الامتحانية الثمانية المعتمدة في الفصلين 10 و 11 مصنفة حسب الأقسام</p>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          ${QUESTION_BANK.map((q, idx) => `
            <div class="card" id="${q.id}" style="border: 1px solid var(--border-color); margin-bottom: 0;">
              <div class="card-header">
                <div>
                  <span class="badge badge-fk" style="margin-bottom: 0.35rem;">القسم ${q.section}: ${q.sectionName}</span>
                  <h3 class="card-title" style="font-size: 1.1rem;">${q.title}</h3>
                </div>
                <button class="btn btn-outline" id="btn-toggle-ans-${q.id}" onclick="window.dbmsApp.toggleModelAnswer('${q.id}')">
                  عرض الحل النموذجي خطوة بخطوة 👁️
                </button>
              </div>

              <div class="question-text academic-prose" style="margin-bottom: 1rem;">
                ${formatAcademicText(q.text)}
              </div>

              <!-- Model Answer Container (Hidden by default) -->
              <div id="answer-box-${q.id}" style="display: none; background-color: var(--bg-subtle); border-right: 4px solid var(--success); padding: 1.25rem; border-radius: var(--radius-md); margin-top: 1rem;">
                <h4 style="color: var(--success); font-weight: 800; margin-bottom: 0.75rem;">الإجابة النموذجية المعتمدة (الفصل الحادي عشر):</h4>
                <div class="model-answer-content academic-prose">
                  ${q.modelAnswer ? formatAcademicText(q.modelAnswer) : ""}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  toggleModelAnswer(qId) {
    const box = document.getElementById(`answer-box-${qId}`);
    const btn = document.getElementById(`btn-toggle-ans-${qId}`);
    if (box && btn) {
      if (box.style.display === "none") {
        box.style.display = "block";
        btn.textContent = "إخفاء الحل النموذجي ✕";
        btn.classList.add("btn-primary");
        btn.classList.remove("btn-outline");
        renderMathInElementSafely(box);
      } else {
        box.style.display = "none";
        btn.textContent = "عرض الحل النموذجي خطوة بخطوة 👁️";
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-outline");
      }
    }
  }

  // 7. Cheat Sheets
  renderCheatSheets() {
    const container = document.getElementById("view-cheatsheets");
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">📑 بطاقات المراجعة السريعة (Rapid Review Cheat Sheet)</h2>
            <p class="card-subtitle">جداول الفصل الثاني عشر الشاملة والمصممة خصيصاً للطباعة والمراجعة ليلة الامتحان</p>
          </div>
          <button class="btn btn-outline" onclick="window.print()">🖨️ طباعة المراجعة السريعة</button>
        </div>

        <!-- 1. ER Symbols -->
        <h3 style="color: var(--primary); margin: 1.5rem 0 0.75rem;">1. جدول الرموز القياسية في نموذج ER و EER:</h3>
        <div class="table-responsive">
          <table class="academic-table">
            <thead>
              <tr>
                <th>المفهوم الأكاديمي</th>
                <th>الرمز القياسي</th>
                <th>الوظيفة والدلالة الأكاديمية</th>
              </tr>
            </thead>
            <tbody>
              ${CHEAT_SHEETS.erSymbols.map(s => `
                <tr>
                  <td><strong>${s.name}</strong></td>
                  <td style="color: var(--primary); font-weight: 700;">${s.symbol}</td>
                  <td>${s.usage}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- 2. Mapping Rules -->
        <h3 style="color: var(--primary); margin: 2rem 0 0.75rem;">2. جدول خلاصة قواعد التحويل السبع من ER إلى جداول علائقية:</h3>
        <div class="table-responsive">
          <table class="academic-table">
            <thead>
              <tr>
                <th>العنصر في مخطط ER</th>
                <th>طريقة التحويل في قاعدة البيانات</th>
                <th>المفتاح الأساسي للجدول الناتج (PK)</th>
              </tr>
            </thead>
            <tbody>
              ${CHEAT_SHEETS.mappingRules.map(m => `
                <tr>
                  <td><strong>${m.element}</strong></td>
                  <td>${m.mappingMethod}</td>
                  <td style="color: #b45309; font-weight: 700;">${m.pk}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- 3. Normalization Summary -->
        <h3 style="color: var(--primary); margin: 2rem 0 0.75rem;">3. جدول خلاصة درجات التطبيع الأربع (1NF إلى BCNF):</h3>
        <div class="table-responsive">
          <table class="academic-table">
            <thead>
              <tr>
                <th>الصيغة</th>
                <th>المتطلب الأكاديمي</th>
                <th>الخلل المعالج</th>
                <th>الإجراء التصميمي المتبع</th>
              </tr>
            </thead>
            <tbody>
              ${CHEAT_SHEETS.normalizationSummary.map(n => `
                <tr>
                  <td><strong style="color: var(--primary); font-size: 1.05rem;">${n.form}</strong></td>
                  <td>${n.requirement}</td>
                  <td>${n.solves}</td>
                  <td>${n.action}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- 4. Relational Algebra Operations -->
        <h3 style="color: var(--primary); margin: 2rem 0 0.75rem;">4. جدول عمليات الجبر العلائقي وشرط التوافقية:</h3>
        <div class="table-responsive">
          <table class="academic-table">
            <thead>
              <tr>
                <th>العملية</th>
                <th>الرمز</th>
                <th>النوع</th>
                <th>الصيغة</th>
                <th>الوظيفة الأساسية</th>
                <th>شرط التوافقية؟</th>
                <th>نسخ</th>
              </tr>
            </thead>
            <tbody>
              ${CHEAT_SHEETS.relationalAlgebra.map(ra => `
                <tr>
                  <td><strong>${ra.op}</strong></td>
                  <td style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${ra.symbol}</td>
                  <td>${ra.type}</td>
                  <td class="ltr"><code>${ra.formula}</code></td>
                  <td>${ra.functionDesc}</td>
                  <td><span class="badge ${ra.unionCompatible.includes("نعم") ? "badge-pk" : "badge-fk"}">${ra.unionCompatible}</span></td>
                  <td>
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onclick="window.dbmsApp.copySymbol('${ra.symbol}')">
                      نسخ
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  copySymbol(sym) {
    copyToClipboard(sym, `تم نسخ الرمز ${sym} بنجاح!`);
  }

  // 8. Traceability Matrix
  renderTraceability() {
    const container = document.getElementById("view-traceability");
    if (!container) return;

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">🔗 مصفوفة تتبع المحاضرات والمصادر الأصلية (Traceability Matrix)</h2>
            <p class="card-subtitle">توثيق الفصل الثالث عشر: ربط كل موضوع بملفات المحاضرات الأكاديمية المعتمدة</p>
          </div>
        </div>

        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          تم تدقيق كافة موضوعات المنصة مقابل السلايدات ونماذج الامتحانات المعتمدة لمقرر نظم قواعد البيانات DBMS (المحاضرات 1 إلى 9).
        </div>

        <div class="table-responsive">
          <table class="academic-table">
            <thead>
              <tr>
                <th>المحاضرة / الامتحان</th>
                <th>اسم الملف الأصلي في مجلد DBMS</th>
                <th>عدد الصفحات</th>
                <th>الموضوعات المغطاة بدقة في المنصة</th>
              </tr>
            </thead>
            <tbody>
              ${TRACEABILITY_MATRIX.map(row => `
                <tr>
                  <td><strong>${row.lecture}</strong></td>
                  <td class="ltr"><code>${row.file}</code></td>
                  <td style="text-align: center;">${row.pages}</td>
                  <td>${row.topics}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div style="background-color: var(--primary-light); padding: 1rem 1.25rem; border-radius: var(--radius-md); margin-top: 1.5rem; font-size: 0.9rem;">
          <strong>تأكيد الالتزام بنطاق المقرر (Strict Scope Commitment):</strong>
          <p style="margin-top: 0.25rem;">
            تتوقف المنصة تماماً عند المحاضرة التاسعة (Relational Algebra)، وتم استبعاد مواضيع SQL التطبيقية المقررة في المحاضرات 10-13، حيث يخصص لها تقييم مستقل.
          </p>
        </div>
      </div>
    `;
  }
}

// Instantiate and expose globally
window.dbmsApp = new App();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.dbmsApp.init();
  });
} else {
  window.dbmsApp.init();
}

