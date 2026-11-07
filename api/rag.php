<?php
/**
 * ASH - DBMS Platform Retrieval-Augmented Generation (RAG) Engine
 * Parses, segments, and indexes the academic summary document:
 * DBMS_Midterm_Summary_Lectures_1-9.md
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

class RAGEngine
{
    private static ?array $chunksCache = null;

    /**
     * Load, chunk, and index the primary markdown file
     */
    public static function getChunks(): array
    {
        if (self::$chunksCache !== null) {
            return self::$chunksCache;
        }

        $filePath = RAG_FILE_PATH;
        if (!file_exists($filePath)) {
            error_log("RAG Error: Summary file not found at: {$filePath}");
            return [];
        }

        $content = @file_get_contents($filePath);
        if ($content === false || empty($content)) {
            error_log("RAG Error: Unable to read content from summary file: {$filePath}");
            return [];
        }

        self::$chunksCache = self::segmentMarkdown($content);
        return self::$chunksCache;
    }

    /**
     * Segment markdown document into structured academic chunks
     */
    private static function segmentMarkdown(string $markdown): array
    {
        $lines = explode("\n", $markdown);
        $chunks = [];

        $currentChapter = "مقدمة المقرر ونطاقه الأكاديمي";
        $currentSection = "التعريف العام";
        $currentLecture = "المحاضرات 1–9";
        $currentContent = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // Check for H1 (Chapter / Lecture)
            if (str_starts_with($trimmed, '# ')) {
                if (!empty($currentContent)) {
                    $text = trim(implode("\n", $currentContent));
                    if (mb_strlen($text) > 40) {
                        $chunks[] = [
                            'lecture' => $currentLecture,
                            'chapter' => $currentChapter,
                            'section' => $currentSection,
                            'content' => $text
                        ];
                    }
                    $currentContent = [];
                }

                $title = trim(substr($trimmed, 2));
                $currentChapter = $title;
                $currentSection = $title;

                // Extract Lecture tag if found
                if (preg_match('/(Lecture\s*\d+(\.\d+)?|المحاضرة\s*\d+(\.\d+)?)/iu', $title, $m)) {
                    $currentLecture = $m[0];
                } elseif (preg_match('/(الفصل\s*(التاسع|العاشر|الحادي عشر|الثاني عشر|الثالث عشر))/iu', $title, $m)) {
                    $currentLecture = $m[0];
                }
                continue;
            }

            // Check for H2 or H3 (Sections)
            if (str_starts_with($trimmed, '## ') || str_starts_with($trimmed, '### ')) {
                if (!empty($currentContent)) {
                    $text = trim(implode("\n", $currentContent));
                    if (mb_strlen($text) > 40) {
                        $chunks[] = [
                            'lecture' => $currentLecture,
                            'chapter' => $currentChapter,
                            'section' => $currentSection,
                            'content' => $text
                        ];
                    }
                    $currentContent = [];
                }

                $secTitle = trim(preg_replace('/^#{2,3}\s+/', '', $trimmed));
                $currentSection = $secTitle;

                if (preg_match('/(Lecture\s*\d+(\.\d+)?|المحاضرة\s*\d+(\.\d+)?)/iu', $secTitle, $m)) {
                    $currentLecture = $m[0];
                }
                continue;
            }

            $currentContent[] = $line;
        }

        // Add trailing chunk
        if (!empty($currentContent)) {
            $text = trim(implode("\n", $currentContent));
            if (mb_strlen($text) > 40) {
                $chunks[] = [
                    'lecture' => $currentLecture,
                    'chapter' => $currentChapter,
                    'section' => $currentSection,
                    'content' => $text
                ];
            }
        }

        return $chunks;
    }

    /**
     * Retrieve the most relevant chunks for a student query
     */
    public static function retrieve(string $query, int $limit = 3): array
    {
        $chunks = self::getChunks();
        if (empty($chunks)) {
            return [];
        }

        $normQuery = self::normalizeText($query);
        $queryWords = self::extractKeywords($normQuery);

        if (empty($queryWords)) {
            // Default to first few essential overview chunks
            return array_slice($chunks, 0, $limit);
        }

        $scoredChunks = [];

        foreach ($chunks as $idx => $chunk) {
            $chunkTitle = self::normalizeText($chunk['chapter'] . ' ' . $chunk['section'] . ' ' . $chunk['lecture']);
            $chunkText = self::normalizeText($chunk['content']);
            $score = 0;

            // 1. Exact query match bonus
            if (mb_stripos($chunkTitle, $normQuery) !== false) {
                $score += 30;
            }
            if (mb_stripos($chunkText, $normQuery) !== false) {
                $score += 15;
            }

            // 2. Individual word matches
            foreach ($queryWords as $word) {
                // Title matches
                if (mb_stripos($chunkTitle, $word) !== false) {
                    $score += 8;
                }
                // Content count
                $count = mb_substr_count($chunkText, $word);
                if ($count > 0) {
                    $score += min($count, 6) * 2;
                }
            }

            if ($score > 0) {
                $scoredChunks[] = [
                    'chunk' => $chunk,
                    'score' => $score
                ];
            }
        }

        if (empty($scoredChunks)) {
            return array_slice($chunks, 0, $limit);
        }

        // Sort descending by score
        usort($scoredChunks, fn($a, $b) => $b['score'] <=> $a['score']);

        $results = [];
        $selectedCount = min(count($scoredChunks), $limit);
        for ($i = 0; $i < $selectedCount; $i++) {
            $results[] = $scoredChunks[$i]['chunk'];
        }

        return $results;
    }

    /**
     * Text normalization helper for Arabic and English
     */
    private static function normalizeText(string $str): string
    {
        $str = mb_strtolower($str, 'UTF-8');
        // Normalize Arabic letters
        $str = preg_replace('/[أإآ]/u', 'ا', $str);
        $str = preg_replace('/ة/u', 'ه', $str);
        $str = preg_replace('/ى/u', 'ي', $str);
        // Remove diacritics
        $str = preg_replace('/[\x{064B}-\x{065F}]/u', '', $str);
        return (string)$str;
    }

    /**
     * Extract clean keywords from text, ignoring common stop words
     */
    private static function extractKeywords(string $text): array
    {
        $words = preg_split('/[^\p{L}\p{N}]+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
        if ($words === false) {
            return [];
        }

        $stopWords = [
            'في', 'من', 'على', 'عن', 'إلى', 'الى', 'مع', 'هذا', 'هذه', 'تم', 'ما', 'هو', 'هي', 'هل', 'كيف',
            'التي', 'الذي', 'الذين', 'بين', 'كل', 'او', 'أو', 'ثم', 'لكن', 'كان', 'يكون', 'ان', 'أن', 'لا',
            'the', 'is', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'what', 'how'
        ];
        $stopWordsMap = array_flip($stopWords);

        $keywords = [];
        foreach ($words as $w) {
            if (mb_strlen($w) >= 2 && !isset($stopWordsMap[$w])) {
                $keywords[] = $w;
            }
        }

        return array_values(array_unique($keywords));
    }
}
