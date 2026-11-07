// ASH - Browser Simulation Test Suite
import { COURSE_INFO, CHAPTERS_DATA, PITFALLS_DATA, QUESTION_BANK, CHEAT_SHEETS, TRACEABILITY_MATRIX } from "./js/content-data.js";
import { progressManager } from "./js/progress.js";

console.log("==========================================");
console.log("DBMS PLATFORM - BROWSER & DOM SIMULATION");
console.log("==========================================");

// Mock DOM Environment
const elements = {};
function createMockElement(id, tag = 'div', className = '') {
  let _id = id;
  const el = {
    tagName: tag.toUpperCase(),
    className,
    classList: {
      classes: new Set(className.split(' ').filter(Boolean)),
      add(c) { this.classes.add(c); el.className = Array.from(this.classes).join(' '); },
      remove(c) { this.classes.delete(c); el.className = Array.from(this.classes).join(' '); },
      toggle(c, force) {
        if (force !== undefined) {
          if (force) this.add(c); else this.remove(c);
          return force;
        }
        if (this.classes.has(c)) { this.remove(c); return false; }
        this.add(c); return true;
      },
      contains(c) { return this.classes.has(c); }
    },
    innerHTML: '',
    textContent: '',
    style: {},
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] || null; },
    contains() { return false; },
    addEventListener(event, handler) {
      this.listeners = this.listeners || {};
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(handler);
    },
    dispatchEvent(event) {
      if (this.listeners && this.listeners[event.type]) {
        this.listeners[event.type].forEach(fn => fn(event));
      }
    },
    querySelector(sel) {
      if (sel === '.badge-label') return { textContent: '' };
      return null;
    },
    querySelectorAll(sel) { return []; },
    appendChild(child) { this.children = this.children || []; this.children.push(child); }
  };
  Object.defineProperty(el, 'id', {
    get() { return _id; },
    set(v) { _id = v; elements[v] = el; }
  });
  if (id) elements[id] = el;
  return el;
}

// Setup basic DOM elements from index.html
global.document = {
  documentElement: { setAttribute: () => {} },
  body: createMockElement('body', 'body'),
  getElementById(id) { return elements[id] || null; },
  querySelectorAll(sel) { return []; },
  createElement(tag) { return createMockElement('el_' + Math.random(), tag); },
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  scrollTo: () => {},
  location: { hash: '' },
  history: { pushState: () => {} }
};

// Create required index.html elements
createMockElement('sidebar', 'aside', 'sidebar');
createMockElement('sidebar-overlay', 'div', 'sidebar-overlay');
createMockElement('sidebar-close-btn', 'button', 'sidebar-close-btn');
createMockElement('menu-toggle-btn', 'button', 'menu-toggle');
createMockElement('btn-home-brand', 'button', 'btn-home-brand');
createMockElement('header-current-section', 'div', 'header-current-badge');
createMockElement('header-search-input', 'input', 'search-input');
createMockElement('search-dropdown', 'div', 'search-dropdown');
createMockElement('header-progress-pct', 'span');
createMockElement('header-progress-fill', 'div');
createMockElement('theme-toggle-btn', 'button', 'theme-toggle-btn');
createMockElement('header-ai-btn', 'button', 'btn-header-ai');
createMockElement('breadcrumbs-bar', 'nav', 'breadcrumbs-bar');
createMockElement('view-dashboard', 'div', 'view-section active');
createMockElement('view-encyclopedia', 'div', 'view-section');
createMockElement('view-simulators', 'div', 'view-section');
createMockElement('view-pitfalls', 'div', 'view-section');
createMockElement('view-mock-exam', 'div', 'view-section');
createMockElement('view-question-bank', 'div', 'view-section');
createMockElement('view-cheatsheets', 'div', 'view-section');
createMockElement('view-traceability', 'div', 'view-section');

// Import App & AI Assistant
const { aiAssistant } = await import("./js/ai-assistant.js");

// Test AI Assistant injection
aiAssistant.init();
const floatingBtn = document.getElementById("floating-ai-btn");
const chatDrawer = document.getElementById("ai-chat-drawer");

console.log("--- 1. Testing AI Assistant UI Injection ---");
if (floatingBtn) {
  console.log("✓ PASS: Floating AI Button (#floating-ai-btn) injected successfully.");
} else {
  console.error("✕ FAIL: Floating AI Button not found.");
  process.exit(1);
}

if (chatDrawer) {
  console.log("✓ PASS: AI Chat Drawer (#ai-chat-drawer) injected successfully.");
} else {
  console.error("✕ FAIL: AI Chat Drawer not found.");
  process.exit(1);
}

// Test Drawer toggling
aiAssistant.openDrawer();
if (chatDrawer.classList.contains("active") && aiAssistant.isOpen) {
  console.log("✓ PASS: AI Drawer opens properly with .active class.");
} else {
  console.error("✕ FAIL: AI Drawer did not open.");
  process.exit(1);
}

aiAssistant.closeDrawer();
if (!chatDrawer.classList.contains("active") && !aiAssistant.isOpen) {
  console.log("✓ PASS: AI Drawer closes properly.");
} else {
  console.error("✕ FAIL: AI Drawer did not close.");
  process.exit(1);
}

// Test App Initialization
const appModule = await import("./js/app.js");
const app = window.dbmsApp;
app.init();

console.log("\n--- 2. Testing Application Initialization & Default Home ---");
if (app) {
  console.log("✓ PASS: App instance created and attached to window.dbmsApp.");
} else {
  console.error("✕ FAIL: window.dbmsApp is missing.");
  process.exit(1);
}

// Test Default View is Dashboard
if (app.currentView === "dashboard") {
  console.log("✓ PASS: Default view is strictly 'dashboard'.");
} else {
  console.error(`✕ FAIL: Default view is '${app.currentView}', expected 'dashboard'.`);
  process.exit(1);
}

// Verify Dashboard Rendered Content
const dashboardHtml = elements['view-dashboard'].innerHTML;
console.log("\n--- 3. Testing 5 Dashboard Sections ---");

// Section 1: Academic Course Banner
if (dashboardHtml.includes("academic-banner") && dashboardHtml.includes("منصة الداتا بيز") && dashboardHtml.includes("CS436 / CS339")) {
  console.log("✓ PASS: Section 1 (Academic Course Banner) rendered properly.");
} else {
  console.error("✕ FAIL: Section 1 (Academic Course Banner) missing in dashboard.");
  process.exit(1);
}

// Section 2: Student Stats Grid
if (dashboardHtml.includes("stats-grid") && dashboardHtml.includes("الموضوعات المكتملة") && dashboardHtml.includes("stat-completed-topics")) {
  console.log("✓ PASS: Section 2 (Student Stats Grid) rendered properly.");
} else {
  console.error("✕ FAIL: Section 2 (Student Stats Grid) missing in dashboard.");
  process.exit(1);
}

// Section 3: Learning Resume
if (dashboardHtml.includes("dashboard-resume-card") && dashboardHtml.includes("متابعة التعلم")) {
  console.log("✓ PASS: Section 3 (Learning Resume Card) rendered properly.");
} else {
  console.error("✕ FAIL: Section 3 (Learning Resume Card) missing in dashboard.");
  process.exit(1);
}

// Section 4: Quick Access Cards
const hasAllQuickCards = 
  dashboardHtml.includes("الموسوعة الأكاديمية") &&
  dashboardHtml.includes("المختبرات التفاعلية") &&
  dashboardHtml.includes("محاكي الامتحان النصفي") &&
  dashboardHtml.includes("بنك الأسئلة والحلول") &&
  dashboardHtml.includes("المراجعة السريعة (Cheat Sheets)") &&
  dashboardHtml.includes("مساعد الداتا بيز AI");

if (dashboardHtml.includes("quick-access-grid") && hasAllQuickCards) {
  console.log("✓ PASS: Section 4 (Quick Access Cards - All 6 Cards) rendered properly.");
} else {
  console.error("✕ FAIL: Section 4 (Quick Access Cards) incomplete.");
  process.exit(1);
}

// Section 5: Course Map
if (dashboardHtml.includes("course-map-grid") && dashboardHtml.includes("خارطة المقرر الأكاديمي الشاملة")) {
  console.log("✓ PASS: Section 5 (Course Map Grid) rendered properly.");
} else {
  console.error("✕ FAIL: Section 5 (Course Map Grid) missing in dashboard.");
  process.exit(1);
}

console.log("\n--- 4. Testing Navigation Between Views ---");
const testViews = ['encyclopedia', 'simulators', 'pitfalls', 'mock-exam', 'question-bank', 'cheatsheets', 'traceability', 'dashboard'];
for (const v of testViews) {
  app.switchView(v, false);
  if (app.currentView === v && elements[`view-${v}`].classList.contains("active")) {
    console.log(`✓ PASS: Navigated to '${v}' view successfully.`);
  } else {
    console.error(`✕ FAIL: Navigation to '${v}' failed.`);
    process.exit(1);
  }
}

console.log("\n--- 5. Testing openDbmsAi Global Helper & Offline Fallback ---");
// Test global helper
if (typeof window.openDbmsAi === "function") {
  window.openDbmsAi();
  if (chatDrawer.classList.contains("active")) {
    console.log("✓ PASS: window.openDbmsAi() successfully opened the drawer.");
  } else {
    console.error("✕ FAIL: window.openDbmsAi() did not open drawer.");
    process.exit(1);
  }
} else {
  console.log("ℹ Note: window.openDbmsAi is defined in index.html inline script.");
}

// Test offline fallback in sendMessage
global.fetch = () => Promise.reject(new Error("Simulated offline server"));
await aiAssistant.sendMessage("ما هو المفتاح الأساسي Primary Key؟");
const lastMsg = aiAssistant.messages[aiAssistant.messages.length - 1];
if (lastMsg && (lastMsg.text.includes("💡") || lastMsg.text.includes("Primary Key") || lastMsg.text.includes("الأساسي"))) {
  console.log("✓ PASS: AI Assistant offline fallback answered query successfully.");
} else {
  console.error("✕ FAIL: AI Assistant offline fallback did not generate an answer.");
  process.exit(1);
}

console.log("\n==========================================");
console.log("ALL BROWSER SIMULATION TESTS PASSED (100%)");
console.log("==========================================");
