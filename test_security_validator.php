<?php
/**
 * Test Security & Zero-Token Pre-Validation
 */

declare(strict_types=1);

require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/validator.php';

// Clean rate limit slate for deterministic unit testing
QueryValidator::resetRateLimit();

echo "==========================================\n";
echo "TESTING ZERO-TOKEN PRE-VALIDATION & SCOPE\n";
echo "==========================================\n";

$tests = [
    // 1. Code generation query (MUST BE REJECTED with ZERO_CODE_VIOLATION)
    [
        'query' => 'اكتب لي كود SQL لإنشاء جدول الطلاب مع المفتاح الأساسي',
        'expect_valid' => false,
        'expect_error' => 'ZERO_CODE_VIOLATION'
    ],
    [
        'query' => 'SELECT * FROM Students WHERE gpa > 3.5;',
        'expect_valid' => false,
        'expect_error' => 'ZERO_CODE_VIOLATION'
    ],
    [
        'query' => 'Write a python script to connect to database',
        'expect_valid' => false,
        'expect_error' => 'ZERO_CODE_VIOLATION'
    ],
    // 2. Off-topic query (MUST BE REJECTED with OUT_OF_SCOPE)
    [
        'query' => 'ما هي طريقة تحضير البيتزا الإيطالية بالفرن؟',
        'expect_valid' => false,
        'expect_error' => 'OUT_OF_SCOPE'
    ],
    [
        'query' => 'من فاز في مباراة ريال مدريد وبرشلونة الأخيرة؟',
        'expect_valid' => false,
        'expect_error' => 'OUT_OF_SCOPE'
    ],
    // 3. Length violation (> 500 chars)
    [
        'query' => str_repeat('ما هو مفهوم قواعد البيانات؟ ', 30),
        'expect_valid' => false,
        'expect_error' => 'MESSAGE_TOO_LONG'
    ],
    // 4. Valid DBMS Theory Queries (MUST PASS)
    [
        'query' => 'ما الفرق بين المفتاح الأساسي والمفتاح الأجنبي؟',
        'expect_valid' => true,
        'expect_error' => null
    ],
    [
        'query' => 'اشرح لي مستويات معمارية ANSI-SPARC الثلاثة',
        'expect_valid' => true,
        'expect_error' => null
    ],
    [
        'query' => 'كيف يتم استخراج المفاتيح المرشحة Candidate Keys بطريقة L/R/B/N؟',
        'expect_valid' => true,
        'expect_error' => null
    ],
    [
        'query' => 'ما هو شرط الصيغة المعيارية الثانية 2NF؟',
        'expect_valid' => true,
        'expect_error' => null
    ]
];

$passed = 0;
$total = count($tests);

foreach ($tests as $i => $t) {
    $num = $i + 1;
    $res = QueryValidator::validate($t['query']);

    if ($t['expect_valid']) {
        if ($res['valid'] === true) {
            echo "✓ PASS [Test {$num}]: Valid DBMS Query passed validation successfully.\n";
            $passed++;
        } else {
            echo "✕ FAIL [Test {$num}]: Expected valid, but got rejected with {$res['error_code']}: {$res['reply']}\n";
        }
    } else {
        if ($res['valid'] === false && $res['error_code'] === $t['expect_error']) {
            echo "✓ PASS [Test {$num}]: Correctly rejected ({$res['error_code']}) with 0 tokens consumed.\n";
            $passed++;
        } else {
            echo "✕ FAIL [Test {$num}]: Expected rejection with {$t['expect_error']}, but got: " . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n";
        }
    }
}

echo "==========================================\n";
echo "SUMMARY: {$passed} / {$total} TESTS PASSED\n";
echo "==========================================\n";

if ($passed === $total) {
    exit(0);
} else {
    exit(1);
}

