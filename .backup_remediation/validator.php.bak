<?php
/**
 * ASH - DBMS Platform Query & Security Validator
 * Enforces Zero-Token Pre-Validation:
 * 1. Zero-Code Rule: Strictly blocks all code generation / debugging requests without consuming Gemini API tokens.
 * 2. Scope Enforcer: Restricts queries to DBMS theoretical curriculum (Lectures 1–9).
 * 3. Input Sanitization & Max Length limits (500 chars).
 * 4. IP/Token-Bucket Server-Side Rate Limiting (survives cookie deletion).
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/rag.php';

class QueryValidator
{
    public const MAX_QUERY_LENGTH = 500;
    public const RATE_LIMIT_MAX_REQUESTS = 12;
    public const RATE_LIMIT_WINDOW_SECONDS = 60;

    /**
     * Comprehensive Pre-Validation
     * Returns ['valid' => true] or ['valid' => false, 'reply' => string, 'error_code' => string]
     */
    public static function validate(string $message): array
    {
        $trimmed = trim($message);

        // 1. Empty Check
        if ($trimmed === '') {
            return [
                'valid' => false,
                'reply' => 'يرجى كتابة سؤال أو استفسار أكاديمي.',
                'error_code' => 'MESSAGE_EMPTY'
            ];
        }

        // 2. Length Check (Max 500 characters)
        if (mb_strlen($trimmed) > self::MAX_QUERY_LENGTH) {
            return [
                'valid' => false,
                'reply' => '⚠️ السؤال طويل جداً. الحد الأقصى المسموح به هو ' . self::MAX_QUERY_LENGTH . ' حرف لضمان دقة الإجابة الأكاديمية.',
                'error_code' => 'MESSAGE_TOO_LONG'
            ];
        }

        // 3. Zero-Code Rule: Strictly reject requests asking for executable code or SQL generation
        if (self::isCodeRequest($trimmed)) {
            return [
                'valid' => false,
                'reply' => "⚠️ **سياسة المنصة الصارمة (Zero-Code Policy):**\n\nمساعد الذكاء الاصطناعي مخصص حصرياً للشرح الأكاديمي النظري، والمفاهيم الرياضية (الجبر العلائقي، والاعتماديات الوظيفية، ونظرية التطبيع)، وممنوع برمجياً من كتابة أو تصحيح أو توليد أي كود برمجي تنفيذي (مثل استعلامات SQL، أو بايثون، أو جافا، أو PHP، أو C++).\n\n💡 **نطاق المنصة:** الاستعداد للامتحان النصفي النظري (المحاضرات 1–9). أوامر SQL التطبيقية مقررة في المحاضرات 10–13 (الامتحان العملي والنهائي).\n\nيمكنك سؤالي عن: المفاهيم، المقارنات، شروط التطبيع، خوارزمية إغلاق السمات، أو رموز نموذج ER.",
                'error_code' => 'ZERO_CODE_VIOLATION'
            ];
        }

        // 4. Prompt Injection & Security Sanitization
        if (self::isPromptInjection($trimmed)) {
            return [
                'valid' => false,
                'reply' => '⚠️ تم رصد نمط إدخال غير آمن. يرجى صياغة سؤالك في سياق مقرر نظم قواعد البيانات فقط.',
                'error_code' => 'SECURITY_VIOLATION'
            ];
        }

        // 5. Scope Enforcer: Ensure query pertains to DBMS curriculum
        if (!self::isDbmsScope($trimmed)) {
            return [
                'valid' => false,
                'reply' => "⚠️ **خارج النطاق الأكاديمي للمقرر:**\n\nهذا السؤال يقع خارج نطاق مقرر نظم إدارة قواعد البيانات (DBMS - Lectures 1–9).\n\nالمساعد الأكاديمي مدرب للإجابة فقط على موضوعات:\n1. نشأة نظم البيانات ومعمارية ANSI-SPARC واستقلالية البيانات.\n2. نموذج الكيانات والعلاقات (ER & EER Modeling).\n3. النموذج العلائقي والقيود التكاملية (Keys & Integrity Constraints).\n4. خوارزميات التحويل من ER إلى جداول علائقية (7-Step Mapping).\n5. عمليات الجبر العلائقي (Selection, Projection, Joins, Set Operations).\n6. نظرية التطبيع والاعتماديات الوظيفية (1NF, 2NF, 3NF, BCNF, Attribute Closure).\n\nيرجى إعادة توجيه سؤالك ضمن هذه المحاور.",
                'error_code' => 'OUT_OF_SCOPE'
            ];
        }

        // 6. Robust Server-Side IP-Based Rate Limiting for valid questions
        $rateLimitCheck = self::checkRateLimit();
        if (!$rateLimitCheck['allowed']) {
            return [
                'valid' => false,
                'reply' => '⚠️ لقد تجاوزت الحد المسموح به من الأسئلة المتتالية (' . self::RATE_LIMIT_MAX_REQUESTS . ' استفسارات في الدقيقة). يرجى الانتظار قليلاً لتنظيم حركة المرور الأكاديمية.',
                'error_code' => 'RATE_LIMIT_EXCEEDED'
            ];
        }

        return ['valid' => true];
    }

    /**
     * Checks if the message is requesting executable code or script writing
     */
    private static function isCodeRequest(string $message): bool
    {
        $patterns = [
            // Explicit code generation verbs in Arabic
            '/(اكتب|انشئ|أنشئ|اعمل|سو|سوي|برمج|كود|اكواد|أكواد|سكريبت)\s*(لي|لنا)?\s*(كود|برنامج|سكريبت|استعلام|دالة|تابع|class|function|script)/iu',
            '/(حل|اكتب|اعطني|أعطني|انشئ|أنشئ|اعمل|سو|سوي|برمج).*?(كود|البرنامج|استعلام|دالة|تابع|سكريبت|script)/iu',
            '/(write|generate|give\s*me|create|build)\s*(a\s*)?(code|script|sql\s*query|program|function|class)/i',
            // Specific programming languages (with boundaries supporting c++, c#, etc.)
            '/(?:\b|\s|^)(python|java|javascript|php|c\+\+|cpp|c\#|golang|rust|ruby|html|css)(?:\b|\s|:|[^\w]|$)/iu',
            // Code keywords & syntaxes
            '/\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE)\b/i',
            '/<\?php/i',
            '/\bdef\s+[a-z_][a-z0-9_]*\s*\(/i',
            '/\bfunction\s+[a-z_][a-z0-9_]*\s*\(/i',
            '/\bpublic\s+(static\s+)?void\s+main\b/i'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $message)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detects prompt injection patterns
     */
    private static function isPromptInjection(string $message): bool
    {
        $patterns = [
            '/ignore\s+(all\s+)?(previous|prior)\s+instructions/i',
            '/you\s+are\s+now\s+(unrestricted|DAN|jailbreak)/i',
            '/تجاهل\s+(جميع|كل)?\s*(التعليمات|الأوامر|القواعد)/iu',
            '/reveal\s+(your\s+)?(system\s*prompt|(?:gemini_)?api\s*key)/i',
            '/show\s+(me\s+)?(your\s+)?(system\s*prompt|(?:gemini_)?api\s*key)/i',
            '/(gemini_api_key|api_key|مفتاح\s*api|system\s*prompt|البرومبت\s*الأساسي)/iu'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $message)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Scope Enforcer: Validates that the query contains relevant DBMS terminology
     * or retrieves at least one relevant chunk with meaningful score from the academic summary
     */
    private static function isDbmsScope(string $message): bool
    {
        // 1. Off-Topic Blacklist Check (instant rejection)
        $offTopicPatterns = [
            '/(بيتزا|طبخ|وصفة|أكل|طعام|طريقة\s*تحضير|شاورما|برجر)/iu',
            '/(مباراة|كرة\s*قدم|ريال\s*مدريد|برشلونة|دوري|كأس|هدف|لاعب|نادي)/iu',
            '/(طقس|درجة\s*حرارة|مناخ|أمطار|رياح)/iu',
            '/(سياسة|انتخابات|حكومة|رئيس|وزير|حرب)/iu',
            '/(فيلم|أفلام|مسلسل|أغنية|موسيقى|ممثل)/iu'
        ];

        foreach ($offTopicPatterns as $pattern) {
            if (preg_match($pattern, $message)) {
                return false;
            }
        }

        $dbmsKeywords = [
            // Core concepts Arabic
            'قاعدة', 'قواعد', 'بيانات', 'داتابيز', 'مقرر', 'نظم', 'ملف', 'ملفات',
            'جدول', 'جداول', 'سجل', 'سجلات', 'حقل', 'حقول', 'صفة', 'صفات',
            'مفتاح', 'مفاتيح', 'أساسي', 'أجنبي', 'مرشح', 'فائق', 'بديل', 'مركب',
            'علاقة', 'كيان', 'كيانات', 'ارتباط', 'تطبيع', 'معيارية', 'شائبة', 'شوائب',
            'اعتمادية', 'وظيفية', 'إغلاق', 'رمز', 'رموز', 'مخطط', 'معمارية',
            'داخلي', 'مفاهيمي', 'خارجي', 'استقلالية', 'جبر', 'علائقي', 'اختيار',
            'إسقاط', 'ربط', 'جداء', 'ديكارتي', 'اتحاد', 'تقاطع', 'فرق', 'تكامل',
            'مرجعي', 'كياني', 'امتحان', 'نصفي', 'درجة', 'محاضرة', 'فصل',
            'تكرار', 'تجزئة', 'فقدان', 'ansi', 'sparc', 'er', 'eer',

            // Core concepts English
            'dbms', 'database', 'rdbms', 'table', 'relation', 'tuple', 'attribute',
            'degree', 'cardinality', 'schema', 'instance', 'ansi', 'sparc',
            'internal', 'conceptual', 'external', 'data independence', 'physical', 'logical',
            'file-based', 'redundancy', 'inconsistency', 'entity', 'relationship',
            'weak entity', 'strong entity', 'identifying', 'composite', 'multivalued',
            'derived', 'primary key', 'foreign key', 'candidate key', 'superkey',
            'alternate key', 'partial key', 'discriminator', 'eer', 'specialization',
            'generalization', 'disjoint', 'overlapping', 'total', 'partial',
            'relational algebra', 'selection', 'projection', 'cartesian product',
            'natural join', 'theta join', 'equijoin', 'union', 'intersection',
            'difference', 'union-compatible', 'normalization', 'functional dependency',
            '1nf', '2nf', '3nf', 'bcnf', 'partial dependency', 'transitive dependency',
            'closure', 'armstrong'
        ];

        $lowerMsg = mb_strtolower($message);

        // Check if any keyword matches
        foreach ($dbmsKeywords as $kw) {
            if (mb_strpos($lowerMsg, $kw) !== false) {
                return true;
            }
        }

        // Secondary check: Test RAG retrieval score
        $topScore = RAGEngine::getTopScore($message);
        if ($topScore >= 12) {
            return true;
        }

        return false;
    }

    /**
     * Safely resolve client IP for rate limiting
     */
    public static function getClientIp(): string
    {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
        if (!empty($_SERVER['HTTP_CLIENT_IP']) && filter_var($_SERVER['HTTP_CLIENT_IP'], FILTER_VALIDATE_IP)) {
            return $_SERVER['HTTP_CLIENT_IP'];
        }
        if (!empty($_SERVER['REMOTE_ADDR']) && filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP)) {
            return $_SERVER['REMOTE_ADDR'];
        }
        return '127.0.0.1';
    }

    /**
     * Reset rate limit state for tests or maintenance
     */
    public static function resetRateLimit(?string $ip = null): void
    {
        $targetIp = $ip ?: self::getClientIp();
        $ipHash = hash('sha256', 'dbms_rl_' . $targetIp);
        $tempDir = sys_get_temp_dir();
        $rateFile = $tempDir . DIRECTORY_SEPARATOR . 'dbms_rl_' . substr($ipHash, 0, 16) . '.json';
        if (file_exists($rateFile)) {
            @unlink($rateFile);
        }
        if (session_status() !== PHP_SESSION_NONE) {
            $_SESSION['dbms_rate_limit_history'] = [];
        }
    }

    /**
     * File-backed + Session IP Rate Limiting (survives deleted cookies)
     */
    private static function checkRateLimit(): array
    {
        $now = time();
        $ip = self::getClientIp();
        $ipHash = hash('sha256', 'dbms_rl_' . $ip);
        $tempDir = sys_get_temp_dir();
        $rateFile = $tempDir . DIRECTORY_SEPARATOR . 'dbms_rl_' . substr($ipHash, 0, 16) . '.json';

        $allowed = true;
        $fp = @fopen($rateFile, 'c+');

        if ($fp !== false) {
            if (flock($fp, LOCK_EX)) {
                $content = stream_get_contents($fp);
                $history = [];
                if ($content !== false && $content !== '') {
                    $decoded = json_decode($content, true);
                    if (is_array($decoded)) {
                        $history = $decoded;
                    }
                }

                // Prune timestamps older than window
                $history = array_values(array_filter($history, fn($ts) => is_int($ts) && ($now - $ts) < self::RATE_LIMIT_WINDOW_SECONDS));

                if (count($history) >= self::RATE_LIMIT_MAX_REQUESTS) {
                    $allowed = false;
                } else {
                    $history[] = $now;
                    ftruncate($fp, 0);
                    rewind($fp);
                    fwrite($fp, json_encode($history));
                    fflush($fp);
                }

                flock($fp, LOCK_UN);
            }
            fclose($fp);
        } else {
            // Fallback to session rate limiting if temp directory is not writable
            return self::checkSessionRateLimit($now);
        }

        // Also update session history if available
        self::checkSessionRateLimit($now);

        return ['allowed' => $allowed];
    }

    /**
     * Session-based Rate Limiter Fallback
     */
    private static function checkSessionRateLimit(int $now): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            @session_start();
        }

        $history = $_SESSION['dbms_rate_limit_history'] ?? [];
        if (!is_array($history)) {
            $history = [];
        }

        $history = array_values(array_filter($history, fn($ts) => is_int($ts) && ($now - $ts) < self::RATE_LIMIT_WINDOW_SECONDS));

        if (count($history) >= self::RATE_LIMIT_MAX_REQUESTS) {
            return ['allowed' => false];
        }

        $history[] = $now;
        $_SESSION['dbms_rate_limit_history'] = $history;

        return ['allowed' => true];
    }
}
