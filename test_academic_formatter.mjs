// Test Academic Formatter
import { formatAcademicText } from "./js/utils.js";

console.log("==========================================");
console.log("TESTING ACADEMIC LECTURE FORMATTER");
console.log("==========================================");

const sample1 = `
قبل ظهور أنظمة إدارة قواعد البيانات، كانت المؤسسات تعتمد على **نظام الملفات**.

على سبيل المثال:
* **قسم الطلاب:** يحتفظ بملف خاص.
* **قسم المالية:** يحتفظ بملف الحسابات.

هذا أدى إلى مشاكل كثيرة.
`;

const res1 = formatAcademicText(sample1);
console.log("Result 1:\n", res1);

if (!res1.includes('<strong class="academic-bold">نظام الملفات</strong>')) {
  console.error("FAIL: bold text not converted");
  process.exit(1);
}

if (!res1.includes('<ul class="academic-list">')) {
  console.error("FAIL: bullet list not converted");
  process.exit(1);
}

if (!res1.includes('<p class="topic-paragraph">')) {
  console.error("FAIL: paragraph not converted");
  process.exit(1);
}

const sample2 = `
### العنوان الفرعي الأول
1. الخطوة الأولى في التحويل
2. الخطوة الثانية في التحويل
`;

const res2 = formatAcademicText(sample2);
console.log("Result 2:\n", res2);

if (!res2.includes('<h4 class="academic-subheading">العنوان الفرعي الأول</h4>')) {
  console.error("FAIL: subheading not converted");
  process.exit(1);
}

if (!res2.includes('<ol class="academic-list">')) {
  console.error("FAIL: ordered list not converted");
  process.exit(1);
}

console.log("✓ ALL FORMATTER TESTS PASSED!");

