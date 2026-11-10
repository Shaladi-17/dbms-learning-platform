<?php
/**
 * ASH - DBMS Platform AI Assistant Chat API Endpoint
 * Handles student requests, performs Zero-Token Pre-Validation, RAG retrieval, and generates AI answers
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/validator.php';
require_once __DIR__ . '/rag.php';
require_once __DIR__ . '/gemini.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse([
        'success' => false,
        'reply' => 'طريقة الطلب غير صالحة. يُسمح فقط بطلبات POST.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ], 405);
}

// Read and decode input
$rawInput = file_get_contents('php://input');
if ($rawInput === false || empty($rawInput)) {
    jsonResponse([
        'success' => false,
        'reply' => 'لم يتم إرسال أي بيانات في الطلب.',
        'error_code' => 'EMPTY_INPUT'
    ], 400);
}

$data = json_decode($rawInput, true);
if (!is_array($data)) {
    jsonResponse([
        'success' => false,
        'reply' => 'تنسيق البيانات غير صحيح (JSON غير صالح).',
        'error_code' => 'INVALID_JSON'
    ], 400);
}

$message = trim((string)($data['message'] ?? ''));

// ========================================================
// ZERO-TOKEN PRE-VALIDATION (Consumes 0 Gemini Tokens)
// ========================================================
$validation = QueryValidator::validate($message);
if (!$validation['valid']) {
    jsonResponse([
        'success' => false,
        'reply' => $validation['reply'],
        'error_code' => $validation['error_code'],
        'sources' => []
    ], 200);
}

// ========================================================
// 1. Retrieve RAG chunks from official summary
// ========================================================
$ragChunks = RAGEngine::retrieve($message, 3);

$sources = array_map(function ($chunk) {
    return [
        'lecture' => $chunk['lecture'],
        'chapter' => $chunk['chapter'],
        'section' => $chunk['section']
    ];
}, $ragChunks);

// ========================================================
// 2. Generate Gemini response with theoretical constraints
// ========================================================
$aiResult = GeminiClient::generateResponse($message, $ragChunks);

if (!$aiResult['success']) {
    jsonResponse([
        'success' => false,
        'reply' => $aiResult['reply'],
        'error_code' => $aiResult['error_code'] ?? 'UNKNOWN_ERROR',
        'sources' => $sources
    ], 200); // 200 with success: false so the UI can render friendly message
}

jsonResponse([
    'success' => true,
    'reply' => $aiResult['reply'],
    'sources' => $sources,
    'model' => $aiResult['model'] ?? AppConfig::getModel()
]);
