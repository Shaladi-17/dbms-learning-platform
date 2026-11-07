<?php
// ASH - Test RAG Engine
require_once __DIR__ . '/api/rag.php';

$chunks = RAGEngine::getChunks();
echo "Total Chunks loaded: " . count($chunks) . "\n";

$testQueries = [
    "ما هو التطبيع وما هي 2NF؟",
    "ما الفرق بين Primary Key و Foreign Key؟",
    "اشرح لي معمارية ANSI-SPARC الثلاثية",
    "كيف تعمل خوارزمية إغلاق الصفات X+ ؟",
    "ما هو شرط التوافقية للاتحاد في الجبر العلائقي؟"
];

foreach ($testQueries as $q) {
    echo "\nQuery: $q\n";
    $results = RAGEngine::retrieve($q, 2);
    foreach ($results as $i => $r) {
        echo "  [" . ($i + 1) . "] Lecture: " . $r['lecture'] . " | Section: " . $r['section'] . "\n";
    }
}
