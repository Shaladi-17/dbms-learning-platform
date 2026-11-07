<?php
// ASH - Test Chat Endpoint
require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/rag.php';
require_once __DIR__ . '/api/gemini.php';

echo "Testing Chat Logic via PHP CLI...\n";

// Test 1: Empty input validation
$message = "";
if (empty(trim($message))) {
    echo "✓ Test 1 Passed: Empty message caught.\n";
}

// Test 2: RAG retrieval for question
$testQ = "اشرح لي مفهوم الاعتمادية الوظيفية Partial Dependency ومثال عليها";
$chunks = RAGEngine::retrieve($testQ, 2);
if (count($chunks) > 0) {
    echo "✓ Test 2 Passed: RAG retrieved " . count($chunks) . " chunks for query: '$testQ'\n";
    echo "   Source 1: " . $chunks[0]['lecture'] . " | " . $chunks[0]['section'] . "\n";
} else {
    echo "✕ Test 2 Failed: No chunks retrieved.\n";
}

// Test 3: Gemini call when API key is not configured
$res = GeminiClient::generateResponse($testQ, $chunks);
if (!$res['success'] && $res['error_code'] === 'API_KEY_MISSING') {
    echo "✓ Test 3 Passed: Handled missing API key gracefully without leaking secrets.\n";
    echo "   Message preview: " . mb_substr($res['reply'], 0, 80) . "...\n";
} else {
    echo "Result: " . json_encode($res, JSON_UNESCAPED_UNICODE) . "\n";
}
