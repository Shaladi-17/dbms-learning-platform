/**
 * ASH - DBMS AI Assistant Frontend Module
 * Professional interactive chat widget powered by PHP Backend & Gemini RAG
 */

import { showToast, copyToClipboard, escapeHtml, renderMathInElementSafely } from "./utils.js";
import { searchEngine } from "./search.js";

export class AIAssistant {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.messages = [];
    this.storageKey = "dbms_ai_chat_history_v1";
    this.loadHistory();
    if (typeof window !== "undefined") {
      window.aiAssistant = this;
    }
  }

  init() {
    if (typeof window !== "undefined") {
      window.aiAssistant = this;
    }
    this.injectUI();
    this.bindEvents();
    if (this.messages.length > 0) {
      this.renderMessages();
    }
  }

  loadHistory() {
    try {
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) {
        this.messages = JSON.parse(saved);
      }
    } catch (e) {
      this.messages = [];
    }
  }

  saveHistory() {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch (e) {
      // ignore
    }
  }

  injectUI() {
    if (document.getElementById("ai-chat-drawer")) {
      this.bindEvents();
      return;
    }

    // 1. Floating AI Button
    const floatingBtn = document.createElement("button");
    floatingBtn.id = "floating-ai-btn";
    floatingBtn.className = "floating-ai-btn";
    floatingBtn.setAttribute("aria-label", "مساعد الداتا بيز AI");
    floatingBtn.innerHTML = `
      <span class="ai-btn-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
        </svg>
      </span>
      <span class="ai-btn-label">مساعد الداتا بيز AI</span>
      <span class="ai-pulse-dot"></span>
    `;
    document.body.appendChild(floatingBtn);

    // 2. Chat Drawer / Modal Container
    const drawer = document.createElement("div");
    drawer.id = "ai-chat-drawer";
    drawer.className = "ai-chat-drawer";
    drawer.innerHTML = `
      <!-- Header -->
      <div class="ai-drawer-header">
        <div class="ai-header-info">
          <div class="ai-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
            </svg>
          </div>
          <div>
            <div class="ai-title">
              <span>مساعد الداتا بيز AI</span>
              <span class="ai-model-badge" id="ai-model-tag">Gemini RAG</span>
            </div>
            <div class="ai-subtitle">المساعد الأكاديمي الذكي المعتمد على ملخص المقرر L1–9</div>
          </div>
        </div>
        <div class="ai-header-actions">
          <button class="ai-btn-action" id="ai-clear-btn" title="بدء محادثة جديدة">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M8 16H3v5"></path>
            </svg>
            <span>جديدة</span>
          </button>
          <button class="ai-btn-action ai-close-btn" id="ai-close-btn" title="إغلاق النافذة">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Body -->
      <div class="ai-drawer-body" id="ai-messages-body">
        <div class="ai-welcome-card" id="ai-welcome-card">
          <div class="ai-welcome-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          </div>
          <h4>أهلاً بك في مساعد الداتا بيز AI</h4>
          <p>
            أنا مساعدك الأكاديمي المتخصص في مادة <strong>نظم إدارة قواعد البيانات (DBMS)</strong>. 
            أعتمد على ملخص المحاضرات 1 إلى 9 كمرجع أساسي موثق للإجابة على استفساراتك وحل المسائل الرياضية والتطبيقية.
          </p>
          <div class="ai-prompt-chips">
            <span class="ai-chip" data-prompt="ما الفرق بين Primary Key و Foreign Key؟">ما الفرق بين Primary Key و Foreign Key؟</span>
            <span class="ai-chip" data-prompt="اشرح لي مراحل التطبيع 1NF و 2NF و 3NF بطريقة مبسطة">اشرح مراحل التطبيع 1NF و 2NF و 3NF</span>
            <span class="ai-chip" data-prompt="كيف أستخرج Candidate Keys بطريقة تصنيف L/R/B/N؟">كيف أستخرج المفاتيح المرشحة بطريقة L/R/B/N؟</span>
            <span class="ai-chip" data-prompt="ما هو شرط التوافقية للاتحاد (Union Compatibility) في الجبر العلائقي؟">شرط التوافقية للاتحاد في الجبر العلائقي</span>
            <span class="ai-chip" data-prompt="ما الفرق بين الكيان القوي والكيان الضعيف في نموذج ER؟">الكيان القوي مقابل الكيان الضعيف في ER</span>
          </div>
        </div>
      </div>

      <!-- Thinking Indicator -->
      <div class="ai-thinking-indicator" id="ai-thinking" style="display: none;">
        <span class="ai-spinner"></span>
        <span>جاري البحث في المحاضرات وصياغة الإجابة النموذجية...</span>
      </div>

      <!-- Footer / Input Form -->
      <div class="ai-drawer-footer">
        <form id="ai-chat-form" class="ai-chat-form">
          <textarea 
            id="ai-user-input" 
            class="ai-input" 
            rows="1" 
            placeholder="اسأل المساعد في أي مفهوم، خوارزمية، أو مسألة في المقرر..." 
            autocomplete="off"
          ></textarea>
          <button type="submit" id="ai-send-btn" class="ai-send-btn" aria-label="إرسال السؤال">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <div class="ai-input-hint">اضغط Enter للإرسال، أو Shift + Enter لسطر جديد. المرجع المعتمد: Lectures 1–9</div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  bindEvents() {
    const floatingBtn = document.getElementById("floating-ai-btn");
    const headerAiBtn = document.getElementById("header-ai-btn");
    const closeBtn = document.getElementById("ai-close-btn");
    const clearBtn = document.getElementById("ai-clear-btn");
    const form = document.getElementById("ai-chat-form");
    const input = document.getElementById("ai-user-input");

    floatingBtn?.addEventListener("click", () => this.toggleDrawer());
    headerAiBtn?.addEventListener("click", () => this.toggleDrawer());
    closeBtn?.addEventListener("click", () => this.closeDrawer());

    clearBtn?.addEventListener("click", () => {
      if (confirm("هل تريد مسح سجل المحادثة والبدء من جديد؟")) {
        this.messages = [];
        this.saveHistory();
        this.renderMessages();
      }
    });

    // Auto-grow textarea
    input?.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });

    // Keyboard submit: Enter sends, Shift+Enter creates line
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form?.dispatchEvent(new Event("submit"));
      }
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || this.isLoading) return;

      input.value = "";
      input.style.height = "auto";
      this.sendMessage(text);
    });

    // Delegate chips click
    document.addEventListener("click", (e) => {
      const chip = e.target.closest(".ai-chip");
      if (chip) {
        const prompt = chip.getAttribute("data-prompt");
        if (prompt && !this.isLoading) {
          this.sendMessage(prompt);
        }
      }

      // Delegate copy answer button
      const copyBtn = e.target.closest(".ai-copy-btn");
      if (copyBtn) {
        const textToCopy = copyBtn.getAttribute("data-copy");
        if (textToCopy) {
          copyToClipboard(textToCopy, "تم نسخ إجابة المساعد بنجاح!");
        }
      }
    });
  }

  toggleDrawer() {
    if (this.isOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  openDrawer() {
    let drawer = document.getElementById("ai-chat-drawer");
    if (!drawer) {
      this.injectUI();
      drawer = document.getElementById("ai-chat-drawer");
    }
    if (drawer) {
      drawer.classList.add("active");
      this.isOpen = true;
      const input = document.getElementById("ai-user-input");
      if (input) {
        setTimeout(() => input.focus(), 120);
      }
      this.scrollToBottom();
    }
  }

  closeDrawer() {
    const drawer = document.getElementById("ai-chat-drawer");
    if (drawer) {
      drawer.classList.remove("active");
      this.isOpen = false;
    }
  }

  async sendMessage(userText) {
    // 1. Add user message
    this.messages.push({
      role: "user",
      text: userText,
      timestamp: Date.now()
    });
    this.renderMessages();

    // 2. Show thinking
    this.setLoading(true);

    try {
      // 3. Request PHP Backend
      const response = await fetch("api/chat.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();

      if (data.model) {
        const tag = document.getElementById("ai-model-tag");
        if (tag) tag.textContent = data.model;
      }

      this.messages.push({
        role: "assistant",
        text: data.reply || "عذراً، لم أتمكن من الحصول على إجابة.",
        sources: data.sources || [],
        timestamp: Date.now()
      });
    } catch (err) {
      // Intelligent Local Academic RAG Fallback
      let fallbackText = "";
      const localMatches = searchEngine.search(userText, 3);
      if (localMatches && localMatches.length > 0) {
        const top = localMatches[0];
        fallbackText = `**💡 إجابة أكاديمية موثقة من المرجع المحلي (${top.badge}):**\n\n`;
        fallbackText += `### ${top.title}\n\n`;
        fallbackText += `${top.snippet}\n\n`;
        if (localMatches.length > 1) {
          fallbackText += `\n**موضوعات ذات صلة في المقرر:**\n`;
          for (let i = 1; i < localMatches.length; i++) {
            fallbackText += `* **${localMatches[i].badge}**: ${localMatches[i].title}\n`;
          }
        }
        this.messages.push({
          role: "assistant",
          text: fallbackText,
          sources: [{ lecture: top.badge, section: top.title, chapter: top.targetChapter || "" }],
          timestamp: Date.now()
        });
      } else {
        this.messages.push({
          role: "assistant",
          text: "تعذر الاتصال بخادم الذكاء الاصطناعي حالياً، ولم يتم العثور على تطابق مباشر في المرجع السريع. يمكنك استخدام شريط البحث الأكاديمي بالأعلى أو تصفح الموسوعة.",
          sources: [],
          timestamp: Date.now(),
          isError: true
        });
      }
    } finally {
      this.setLoading(false);
      this.saveHistory();
      this.renderMessages();
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const thinking = document.getElementById("ai-thinking");
    const sendBtn = document.getElementById("ai-send-btn");
    if (thinking) thinking.style.display = loading ? "flex" : "none";
    if (sendBtn) sendBtn.disabled = loading;
    this.scrollToBottom();
  }

  renderMessages() {
    const body = document.getElementById("ai-messages-body");
    const welcome = document.getElementById("ai-welcome-card");
    if (!body) return;

    if (this.messages.length === 0) {
      if (welcome) welcome.style.display = "block";
      return;
    }

    if (welcome) welcome.style.display = "none";

    const html = this.messages.map(msg => {
      const isUser = msg.role === "user";
      const formattedText = isUser ? escapeHtml(msg.text) : this.formatMarkdown(msg.text);

      let sourcesHtml = "";
      if (!isUser && msg.sources && msg.sources.length > 0) {
        sourcesHtml = `
          <div class="ai-sources-bar">
            <span class="ai-source-label">📌 المرجع المسترجع:</span>
            ${msg.sources.map(s => `
              <span class="ai-source-chip" title="${escapeHtml(s.chapter || "")}">
                ${escapeHtml(s.lecture)} - ${escapeHtml(s.section)}
              </span>
            `).join("")}
          </div>
        `;
      }

      let copyBtnHtml = "";
      if (!isUser) {
        copyBtnHtml = `
          <button class="ai-copy-btn" data-copy="${escapeHtml(msg.text)}" title="نسخ الإجابة">
            📋 نسخ
          </button>
        `;
      }

      return `
        <div class="ai-msg ${isUser ? "ai-msg-user" : "ai-msg-assistant"}">
          <div class="ai-msg-bubble">
            ${formattedText}
            ${sourcesHtml}
          </div>
          ${copyBtnHtml}
        </div>
      `;
    }).join("");

    body.innerHTML = html;
    renderMathInElementSafely(body);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const body = document.getElementById("ai-messages-body");
    if (body) {
      body.scrollTop = body.scrollHeight;
    }
  }

  formatMarkdown(text) {
    if (!text) return "";

    const PUA_S = "\uE000";
    const PUA_E = "\uE001";

    // 1. Stash and protect fenced code blocks
    const codeBlocks = [];
    let out = text.replace(/```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: lang || "code", code: code.trim() });
      return `${PUA_S}_C_${idx}_${PUA_E}`;
    });

    // 2. Stash and protect inline code
    const inlineCodes = [];
    out = out.replace(/`([^`\r\n]+)`/g, (match, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(code);
      return `${PUA_S}_I_${idx}_${PUA_E}`;
    });

    // 3. Escape ALL remaining raw HTML to prevent XSS attacks
    out = escapeHtml(out);

    // 4. Headers
    out = out.replace(/^### (.*$)/gim, '<h5 class="ai-h3">$1</h5>');
    out = out.replace(/^## (.*$)/gim, '<h4 class="ai-h2">$1</h4>');
    out = out.replace(/^# (.*$)/gim, '<h3 class="ai-h1">$1</h3>');

    // 5. Bold and italics
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 6. Bullet lists
    out = out.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li class="ai-li">$1</li>');
    out = out.replace(/(<li class="ai-li">.*<\/li>)/gms, '<ul class="ai-ul">$1</ul>');

    // 7. Numbered lists
    out = out.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li class="ai-oli">$2</li>');

    // 8. Paragraph linebreaks
    out = out.replace(/\r?\n\r?\n/g, '<br><br>');
    out = out.replace(/\r?\n/g, '<br>');

    // 9. Restore code blocks with safely escaped content
    out = out.replace(new RegExp(`${PUA_S}_C_(\\d+)_${PUA_E}`, "g"), (match, idx) => {
      const item = codeBlocks[parseInt(idx, 10)];
      if (!item) return "";
      return `<div class="ai-code-block ltr"><div class="ai-code-header"><span>${escapeHtml(item.lang)}</span></div><pre><code>${escapeHtml(item.code)}</code></pre></div>`;
    });

    // 10. Restore inline codes with safely escaped content
    out = out.replace(new RegExp(`${PUA_S}_I_(\\d+)_${PUA_E}`, "g"), (match, idx) => {
      const code = inlineCodes[parseInt(idx, 10)];
      return `<code class="ai-inline-code ltr">${escapeHtml(code || "")}</code>`;
    });

    return out;
  }
}

export const aiAssistant = new AIAssistant();
