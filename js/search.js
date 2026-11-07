/**
 * ASH - DBMS Learning Platform - Instant Arabic & English Search Engine
 */

import { CHAPTERS_DATA, PITFALLS_DATA, QUESTION_BANK, CHEAT_SHEETS, TRACEABILITY_MATRIX } from "./content-data.js";

function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // remove arabic diacritics
    .trim();
}

export class SearchEngine {
  constructor() {
    this.index = [];
    this.buildIndex();
  }

  buildIndex() {
    this.index = [];

    // 1. Chapters & Topics
    for (const ch of CHAPTERS_DATA) {
      this.index.push({
        id: ch.id,
        title: `${ch.lecture}: ${ch.title}`,
        titleEn: ch.titleEn,
        snippet: ch.summary,
        type: "chapter",
        badge: "فصل دراسي",
        targetView: "encyclopedia",
        targetChapter: ch.id,
        rawText: `${ch.title} ${ch.titleEn} ${ch.summary} ${ch.lecture}`
      });

      for (const topic of ch.topics) {
        this.index.push({
          id: topic.id,
          title: topic.title,
          titleEn: topic.titleEn,
          snippet: topic.content ? topic.content.slice(0, 160) + "..." : "",
          type: "topic",
          badge: `موضوع في ${ch.lecture}`,
          targetView: "encyclopedia",
          targetChapter: ch.id,
          targetTopic: topic.id,
          rawText: `${topic.title} ${topic.titleEn || ""} ${topic.content || ""} ${ch.lecture}`
        });
      }
    }

    // 2. Exam Pitfalls
    for (const pit of PITFALLS_DATA) {
      this.index.push({
        id: pit.id,
        title: `الفخ ${pit.number}: ${pit.title}`,
        titleEn: pit.concept,
        snippet: pit.trap + " | " + pit.correction,
        type: "pitfall",
        badge: "فخ امتحاني",
        targetView: "pitfalls",
        targetId: pit.id,
        rawText: `${pit.title} ${pit.concept} ${pit.trap} ${pit.correction}`
      });
    }

    // 3. Question Bank
    for (const q of QUESTION_BANK) {
      this.index.push({
        id: q.id,
        title: q.title,
        titleEn: q.sectionName,
        snippet: q.text.slice(0, 160) + "...",
        type: "question",
        badge: `سؤال بنك - قسم ${q.section}`,
        targetView: "question-bank",
        targetId: q.id,
        rawText: `${q.title} ${q.text} ${q.modelAnswer || ""} ${q.sectionName}`
      });
    }

    // 4. Cheat Sheets: ER & EER Symbols
    for (const sym of CHEAT_SHEETS.erSymbols) {
      this.index.push({
        id: "er-" + sym.name,
        title: sym.name,
        titleEn: sym.symbol,
        snippet: sym.usage,
        type: "cheatsheet",
        badge: "رمز ER / EER",
        targetView: "cheatsheets",
        rawText: `${sym.name} ${sym.symbol} ${sym.usage}`
      });
    }

    // 5. Cheat Sheets: Relational Algebra
    for (const op of CHEAT_SHEETS.relationalAlgebra) {
      this.index.push({
        id: "ra-" + op.op,
        title: `${op.op} (${op.symbol})`,
        titleEn: op.formula,
        snippet: `${op.functionDesc} | توافقية: ${op.unionCompatible}`,
        type: "cheatsheet",
        badge: "عملية جبر علائقي",
        targetView: "cheatsheets",
        rawText: `${op.op} ${op.symbol} ${op.formula} ${op.functionDesc}`
      });
    }
  }

  search(query, maxResults = 10) {
    if (!query || query.trim().length < 2) return [];

    const normQuery = normalizeText(query);
    const words = normQuery.split(/\s+/).filter(w => w.length > 0);

    const matches = [];

    for (const item of this.index) {
      const normItemText = normalizeText(item.rawText);
      let score = 0;

      for (const word of words) {
        if (normItemText.includes(word)) {
          score += 1;
          if (normalizeText(item.title).includes(word)) score += 5;
          if (normalizeText(item.titleEn || "").includes(word)) score += 4;
        }
      }

      if (score > 0) {
        matches.push({ item, score });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, maxResults).map(m => m.item);
  }
}

export const searchEngine = new SearchEngine();

