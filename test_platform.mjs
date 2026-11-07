/**
 * Automated Verification & QA Test Suite for DBMS Learning Platform
 */

import { COURSE_INFO, CHAPTERS_DATA, PITFALLS_DATA, QUESTION_BANK, CHEAT_SHEETS, TRACEABILITY_MATRIX, SIMULATOR_PRESETS } from "./js/content-data.js";
import { ClosureCalculator, RelationalEngine } from "./js/simulators.js";
import { searchEngine } from "./js/search.js";
import { EXAM_DATA } from "./js/mock-exam.js";

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`✕ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

console.log("==========================================");
console.log("DBMS LEARNING PLATFORM - VERIFICATION TEST");
console.log("==========================================\n");

// 1. Content Completeness Tests
console.log("--- 1. Testing Academic Content Completeness ---");
assert(CHAPTERS_DATA.length === 8, "All 8 academic lectures (L1 to L9) present");
assert(PITFALLS_DATA.length === 4, "All 4 exam pitfalls present");
assert(QUESTION_BANK.length === 8, "All 8 comprehensive question bank questions present");
assert(CHEAT_SHEETS.erSymbols.length >= 10, "ER Symbols cheat sheet has full set of symbols");
assert(CHEAT_SHEETS.mappingRules.length === 7, "All 7 ER-to-Relational mapping rules present");
assert(CHEAT_SHEETS.normalizationSummary.length === 4, "All 4 normal forms (1NF, 2NF, 3NF, BCNF) present");
assert(CHEAT_SHEETS.relationalAlgebra.length >= 8, "Relational algebra operations present");
assert(TRACEABILITY_MATRIX.length >= 12, "Traceability matrix maps all lectures and exams");

// 2. Attribute Closure Algorithm Tests
console.log("\n--- 2. Testing Attribute Closure Algorithm ---");

// Test 2.1: EmpProj
const empAttrs = ["SSN", "FName", "LName", "PNo", "PName", "PLocation", "Hours"];
const empFDs = [
  { from: ["SSN"], to: ["FName", "LName"] },
  { from: ["PNo"], to: ["PName", "PLocation"] },
  { from: ["SSN", "PNo"], to: ["Hours"] }
];

const empClSSN = ClosureCalculator.computeClosure(empAttrs, empFDs, ["SSN"]);
assert(empClSSN.finalClosure.length === 3 && !empClSSN.isSuperkey, "EmpProj: {SSN}+ is not a superkey");

const empClKey = ClosureCalculator.computeClosure(empAttrs, empFDs, ["SSN", "PNo"]);
assert(empClKey.finalClosure.length === 7 && empClKey.isSuperkey, "EmpProj: {SSN, PNo}+ is a superkey covering all attributes");

// Test 2.2: R(A, B, C, D, E, F) Candidate Keys Heuristic
console.log("\n--- 3. Testing Finding Candidate Keys Heuristic (L, R, B, N) ---");
const rAttrs = ["A", "B", "C", "D", "E", "F"];
const rFDs = [
  { from: ["A"], to: ["B", "C"] },
  { from: ["B", "D"], to: ["E", "F"] },
  { from: ["F"], to: ["A"] }
];

const ckResult = ClosureCalculator.findCandidateKeys(rAttrs, rFDs);
console.log("Candidate keys found:", ckResult.candidateKeys.map(k => `(${k.join(",")})`).join(", "));
assert(ckResult.candidateKeys.length === 3, "R(A, B, C, D, E, F) has exactly 3 candidate keys");

const stringKeys = ckResult.candidateKeys.map(k => k.sort().join(""));
assert(stringKeys.includes("AD") && stringKeys.includes("BD") && stringKeys.includes("DF"), "Candidate keys are exactly (A,D), (B,D), and (D,F)");

// Test 2.3: Question Bank Q7 R(A, B, C, D, E) Closure of {A, C}
const q7Attrs = ["A", "B", "C", "D", "E"];
const q7FDs = [
  { from: ["A"], to: ["B"] },
  { from: ["B", "C"], to: ["D"] },
  { from: ["D"], to: ["E"] }
];
const q7Closure = ClosureCalculator.computeClosure(q7Attrs, q7FDs, ["A", "C"]);
assert(q7Closure.isSuperkey && q7Closure.finalClosure.length === 5, "Q7: {A, C}+ covers all 5 attributes of R");

// 3. Relational Algebra Playground Tests
console.log("\n--- 4. Testing Relational Algebra Execution Engine ---");
const engine = new RelationalEngine();

// Test Selection
const staffSelect = engine.select("STAFF", "Salary > 20000");
assert(staffSelect.data.length === 3, "Selection (Salary > 20000) returns 3 rows");
assert(staffSelect.degree === 6, "Selection preserves degree (6 columns)");

// Test Projection & Duplicate Elimination
const staffProject = engine.project("STAFF", ["Position"]);
assert(staffProject.data.length === 3, "Projection on Position eliminates duplicates to 3 unique positions (Manager, Assistant, Supervisor)");
assert(staffProject.duplicatesRemoved === 3, "Projection correctly detected 3 duplicate rows removed");

// Test Cartesian Product
const cartesian = engine.cartesian("STAFF", "BRANCH");
assert(cartesian.degree === 6 + 3, "Cartesian product degree is sum: 6 + 3 = 9");
assert(cartesian.cardinality === 6 * 4, "Cartesian product cardinality is product: 6 * 4 = 24");

// Test Union Compatibility Check
let threwIncompatible = false;
try {
  engine.union("STAFF", "BRANCH");
} catch (e) {
  threwIncompatible = true;
}
assert(threwIncompatible, "Union between STAFF and BRANCH strictly enforces Union Compatibility and throws error");

// Test Natural Join
const naturalJoin = engine.naturalJoin("STUDENT", "BRANCH");
assert(naturalJoin.data.length === 5, "Natural join between STUDENT and BRANCH produces matching joined rows");
assert(naturalJoin.degree === 5 + 3 - naturalJoin.commonCols.length, "Natural join eliminates duplicate common columns (" + naturalJoin.commonCols.join(", ") + ")");

// 4. Search Engine Tests
console.log("\n--- 5. Testing Instant Search Engine ---");
const res1 = searchEngine.search("استقلالية البيانات");
assert(res1.length > 0 && res1[0].title.includes("استقلالية"), "Search finds Arabic term 'استقلالية البيانات'");

const res2 = searchEngine.search("ANSI-SPARC");
assert(res2.length > 0, "Search finds English term 'ANSI-SPARC'");

const res3 = searchEngine.search("Projection");
assert(res3.length > 0, "Search finds 'Projection' across topics/pitfalls");

// 5. Exam Structure Tests
console.log("\n--- 6. Testing Mock Exam Model ---");
assert(EXAM_DATA.totalMarks === 50, "Mock exam total marks equals 50");
assert(EXAM_DATA.sections.length === 4, "Mock exam has 4 sections (Q1 to Q4)");
const sectionMarksSum = EXAM_DATA.sections.reduce((acc, s) => acc + s.marks, 0);
assert(sectionMarksSum === 50, "Sum of section marks (10 + 15 + 12 + 13) equals exactly 50");

console.log("\n==========================================");
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log("==========================================");
