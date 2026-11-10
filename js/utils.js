/**
 * ASH - DBMS Learning Platform - Utility Functions
 */

export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function showToast(message, type = "info", duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type} animate-slide-in`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fade-out");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

export function copyToClipboard(text, successMsg = "تم نسخ الرمز بنجاح!") {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, "success");
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    showToast(successMsg, "success");
  } catch (err) {
    showToast("تعذر النسخ تلقائياً", "error");
  }
  document.body.removeChild(textArea);
}

export function renderMathInElementSafely(container) {
  if (!container) return;
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false,
        errorColor: "#ef4444"
      });
    } catch (e) {
      console.warn("KaTeX rendering error:", e);
    }
  }
}

/**
 * Format raw academic lecture content into structured semantic HTML blocks
 * Handles paragraphs, headers, bullet lists, numbered lists, bold text, and math
 */
export function formatAcademicText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  // 1. Temporarily protect math blocks
  const mathPlaceholders = [];
  let text = rawText.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]+\$|\\\([\s\S]*?\\\))/g, (match) => {
    const placeholder = `__MATH_TOKEN_${mathPlaceholders.length}__`;
    mathPlaceholders.push(match);
    return placeholder;
  });

  // 2. Normalize line endings
  text = text.replace(/\r\n/g, "\n").trim();

  // 3. Split into logical blocks by double newlines
  const rawBlocks = text.split(/\n{2,}/);
  const formattedBlocks = [];

  for (let block of rawBlocks) {
    block = block.trim();
    if (!block) continue;

    // Handle Headings (### or ##)
    if (block.startsWith("### ") || block.startsWith("## ")) {
      const isH4 = block.startsWith("### ");
      const prefix = isH4 ? "### " : "## ";
      const firstLineEnd = block.indexOf("\n");
      if (firstLineEnd !== -1) {
        const headingLine = block.substring(prefix.length, firstLineEnd).trim();
        formattedBlocks.push(isH4 
          ? `<h4 class="academic-subheading">${formatInlineStyles(headingLine)}</h4>` 
          : `<h3 class="academic-subheading-h3">${formatInlineStyles(headingLine)}</h3>`);
        block = block.substring(firstLineEnd + 1).trim();
        if (!block) continue;
      } else {
        const headingText = formatInlineStyles(block.substring(prefix.length).trim());
        formattedBlocks.push(isH4 
          ? `<h4 class="academic-subheading">${headingText}</h4>` 
          : `<h3 class="academic-subheading-h3">${headingText}</h3>`);
        continue;
      }
    }

    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    // Check if entire block is a bullet list (* or -)
    const isBulletList = lines.every(l => l.startsWith("* ") || l.startsWith("- "));
    if (isBulletList) {
      const listItems = lines.map(l => {
        const itemContent = l.replace(/^[\*\-]\s+/, "");
        return `<li>${formatInlineStyles(itemContent)}</li>`;
      }).join("");
      formattedBlocks.push(`<ul class="academic-list">${listItems}</ul>`);
      continue;
    }

    // Check if entire block is a numbered list (1., 2., etc.)
    const isNumberedList = lines.every(l => /^\d+\.\s+/.test(l));
    if (isNumberedList) {
      const listItems = lines.map(l => {
        const itemContent = l.replace(/^\d+\.\s+/, "");
        return `<li>${formatInlineStyles(itemContent)}</li>`;
      }).join("");
      formattedBlocks.push(`<ol class="academic-list">${listItems}</ol>`);
      continue;
    }

    // Check if mixed: starts with introductory sentence then bullet points
    if (lines.length > 1 && (lines[0].endsWith(":") || lines[0].endsWith("：")) && lines.slice(1).every(l => l.startsWith("* ") || l.startsWith("- "))) {
      const intro = `<p class="topic-paragraph">${formatInlineStyles(lines[0])}</p>`;
      const items = lines.slice(1).map(l => `<li>${formatInlineStyles(l.replace(/^[\*\-]\s+/, ""))}</li>`).join("");
      formattedBlocks.push(`${intro}<ul class="academic-list">${items}</ul>`);
      continue;
    }

    // Standard paragraph with inline styling
    const paragraphContent = lines.map(l => formatInlineStyles(l)).join("<br>");
    formattedBlocks.push(`<p class="topic-paragraph">${paragraphContent}</p>`);
  }

  let finalHtml = formattedBlocks.join("\n");

  // Restore protected math blocks
  mathPlaceholders.forEach((math, idx) => {
    finalHtml = finalHtml.replace(`__MATH_TOKEN_${idx}__`, math);
  });

  return finalHtml;
}

/**
 * Format inline bold, italic, code spans, and badges
 */
function formatInlineStyles(str) {
  if (!str) return "";
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong class="academic-bold">$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="academic-code">$1</code>');
}

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

