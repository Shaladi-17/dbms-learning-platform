<?php
/**
 * ASH - DBMS Platform Query & Security Validator
 * Enforces Zero-Token Pre-Validation:
 * 1. Zero-Code Rule: Strictly blocks all code generation, execution, completion, or debugging requests without consuming Gemini API tokens.
 * 2. Academic Intent Analyzer: Accurately distinguishes theoretical/conceptual questions from code generation requests.
 * 3. Scope Enforcer: Restricts queries to DBMS theoretical curriculum (Lectures 1–9).
 * 4. Input Sanitization & Max Length limits (500 chars).
 * 5. Sliding Window Log Server-Side Rate Limiter: Enforces strict Fail-Closed policy and resilient IP resolution.
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
     * Comprehensive Zero-Token Pre-Validation
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

        // 3. Prompt Injection & Security Sanitization (Highest Severity Policy Check)
        if (self::isPromptInjection($trimmed)) {
            return [
                'valid' => false,
                'reply' => '⚠️ تم رصد نمط إدخال غير آمن أو محاولة تجاوز لسياسات المنصة. يرجى صياغة سؤالك في سياق مقرر نظم قواعد البيانات فقط.',
                'error_code' => 'SECURITY_VIOLATION'
            ];
        }

        // 4. Zero-Code Rule: Strictly reject requests asking for executable code, SQL queries, or debugging
        if (self::isCodeRequest($trimmed)) {
            return [
                'valid' => false,
                'reply' => "⚠️ **سياسة المنصة الصارمة (Zero-Code Policy):**\n\nمساعد الذكاء الاصطناعي مخصص حصرياً للشرح الأكاديمي النظري، والمفاهيم الرياضية (الجبر العلائقي، والاعتماديات الوظيفية، ونظرية التطبيع)، وممنوع برمجياً من كتابة أو تصحيح أو توليد أي كود برمجي تنفيذي (مثل استعلامات SQL، أو بايثون، أو جافا، أو PHP، أو C++).\n\n💡 **نطاق المنصة:** الاستعداد للامتحان النصفي النظري (المحاضرات 1–9). أوامر SQL التطبيقية مقررة في المحاضرات 10–13 (الامتحان العملي والنهائي).\n\nيمكنك سؤالي عن: المفاهيم، المقارنات، شروط التطبيع، خوارزمية إغلاق السمات، أو رموز نموذج ER.",
                'error_code' => 'ZERO_CODE_VIOLATION'
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

        // 6. Sliding Window Log Rate Limiter (Enforces Fail-Closed security for valid questions)
        $rateLimitCheck = self::checkRateLimit();
        if (!$rateLimitCheck['allowed']) {
            return [
                'valid' => false,
                'reply' => $rateLimitCheck['reply'] ?? ('⚠️ لقد تجاوزت الحد المسموح به من الأسئلة المتتالية (' . self::RATE_LIMIT_MAX_REQUESTS . ' استفسارات في الدقيقة). يرجى الانتظار قليلاً لتنظيم حركة المرور الأكاديمية.'),
                'error_code' => $rateLimitCheck['error_code'] ?? 'RATE_LIMIT_EXCEEDED'
            ];
        }

        return ['valid' => true];
    }

    /**
     * Checks if the message is requesting executable code, debugging, or script generation.
     * Accurately distinguishes theoretical inquiries from code creation/debugging actions.
     */
    public static function isCodeRequest(string $message): bool
    {
        $trimmed = trim($message);

        // A. Whitelist Explicit Conceptual Questions:
        // Questions asking for definitions, theoretical differences, or taxonomy must NOT be blocked by Zero-Code.
        $conceptualPatterns = [
            '/^\s*(ما\s*الفرق\s*بين|قارن\s*بين|ما\s*المقصود\s*بـ?|ما\s*مفهوم|ما\s*معنى|اشرح\s*مفهوم|اشرح\s*نظريا|عرف|عرّف|ما\s*هو\s*مفهوم|ما\s*وظيفة)\s+.+/iu',
            '/^\s*(what\s+is\s+the\s+difference\s+between|compare|what\s+is\s+meant\s+by|explain\s+the\s+concept\s+of|define|explain\s+theoretically)\s+.+/i'
        ];

        $isExplicitConceptual = false;
        foreach ($conceptualPatterns as $cp) {
            if (preg_match($cp, $trimmed)) {
                $isExplicitConceptual = true;
                break;
            }
        }

        // Even if phrased conceptually, if it contains an actual raw SQL query or executable code snippet, it must be caught!
        $rawExecutableCodePatterns = [
            '/\b(SELECT\s+.+\s+FROM|INSERT\s+INTO\s+.+|UPDATE\s+.+\s+SET|DELETE\s+FROM\s+.+|CREATE\s+TABLE\s+.+|DROP\s+TABLE\s+.+|ALTER\s+TABLE\s+.+)\b/i',
            '/<\?php/i',
            '/\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/i',
            '/\bfunction\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/i',
            '/\bpublic\s+(static\s+)?void\s+main\b/i',
            '/#include\s*<[a-zA-Z0-9_\.]+>/i',
            '/import\s+java\.[a-zA-Z0-9_\.]+/i'
        ];

        foreach ($rawExecutableCodePatterns as $rep) {
            if (preg_match($rep, $trimmed)) {
                return true;
            }
        }

        if ($isExplicitConceptual) {
            return false;
        }

        // B. Intent-Based Detection for Code Generation, Completion, and Debugging
        $codeIntentPatterns = [
            // 1. Generation verbs in Arabic (write, create, build, generate, provide, give me) + (code, program, query, script, function, class)
            '/(اكتب|انشئ|أنشئ|اعمل|سو|سوي|برمج|ولد|ولّد|صمم|اعطني|أعطني|هات|اريد|أريد|ابي|أبي)\s*.*?(كود|شفرة|برنامج|سكريبت|استعلام|دالة|تابع|class|function|script|query|code)/iu',

            // 2. Fixing, debugging, completing, or modifying code in Arabic
            '/(صحح|عدل|عدّل|صلح|صلّح|أكمل|اكمل|أصلح|اصلح|فحص|افحص|تنقيح|ديوج|دي\s*باج)\s*.*?(كود|الكود|برنامج|البرنامج|سكريبت|استعلام|الخطأ|code|script|query)/iu',

            // 3. Solving / Implementing using a programming language (Arabic)
            '/(حل|برمج|طبق|طبّق|اكتب|نفذ|نفّذ)\s*.*?(باستخدام|بـ|بلغة|بواسطة|عبر)?\s*(c\+\+|cpp|c\#|csharp|python|java|javascript|php|sql|golang|rust|ruby)(?:\b|\s|:|[^\w]|$)/iu',

            // 4. Generation verbs in English
            '/\b(write|create|generate|give\s*me|build|provide|produce|code|script)\s*.*?\b(code|script|sql\s*query|program|function|class|query)\b/i',

            // 5. Fixing, debugging, completing in English
            '/\b(fix|debug|correct|complete|solve|optimize|refactor)\s*.*?\b(code|script|query|program|function|bug|error)\b/i',

            // 6. Implementing an algorithm into code in English
            '/\b(implement|code|program)\s+.*?(\b(algorithm|query|in|using|with)\b)/i',

            // 7. Explicit "Write a [Language] script/code"
            '/\bwrite\s+a\s+(php|python|java|javascript|c\+\+|cpp|c\#|sql)\s+(script|code|program|query)\b/i',
            '/\bcreate\s+(javascript|python|java|php|c\+\+|c\#|sql)\s+(code|script|program)\b/i',

            // 8. Explicit "حل هذا السؤال بكود" or "حل السؤال بكود"
            '/حل\s+.*?\s*بكود/iu'
        ];

        foreach ($codeIntentPatterns as $cip) {
            if (preg_match($cip, $trimmed)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detects prompt injection patterns and unauthorized system overrides
     */
    public static function isPromptInjection(string $message): bool
    {
        $patterns = [
            '/ignore\s+(all\s+)?(previous|prior)\s+instructions/i',
            '/you\s+are\s+now\s+(unrestricted|DAN|jailbreak)/i',
            '/تجاهل\s+(جميع|كل)?\s*(التعليمات|الأوامر|القواعد|السياسات)/iu',
            '/ألغِ\s*(سياسة|قواعد)?\s*منع\s*الأكواد/iu',
            '/reveal\s+(your\s+)?(system\s*prompt|(?:gemini_)?api\s*key)/i',
            '/show\s+(me\s+)?(your\s+)?(system\s*prompt|(?:gemini_)?api\s*key)/i',
            '/(gemini_api_key|api_key|مفتاح\s*api|system\s*prompt|البرومبت\s*الأساسي|البرومبت\s*النظامي)/iu',
            '/(ما\s*هو|اعطني|أعطني|اكشف|أظهر)\s*.*?(مفتاح\s*(?:api|المنصة|الذكاء|الخادم|السري)|api\s*key|system\s*prompt)/iu'
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
    public static function isDbmsScope(string $message): bool
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

        $arabicKeywords = [
            'قاعدة', 'قواعد', 'بيانات', 'داتابيز', 'مقرر', 'نظم', 'ملف', 'ملفات',
            'جدول', 'جداول', 'سجل', 'سجلات', 'حقل', 'حقول', 'صفة', 'صفات',
            'مفتاح', 'مفاتيح', 'أساسي', 'أجنبي', 'مرشح', 'فائق', 'بديل', 'مركب',
            'علاقة', 'كيان', 'كيانات', 'ارتباط', 'تطبيع', 'معيارية', 'شائبة', 'شوائب',
            'اعتمادية', 'وظيفية', 'إغلاق', 'رمز', 'رموز', 'مخطط', 'معمارية',
            'داخلي', 'مفاهيمي', 'خارجي', 'استقلالية', 'جبر', 'علائقي', 'اختيار',
            'إسقاط', 'ربط', 'جداء', 'ديكارتي', 'اتحاد', 'تقاطع', 'فرق', 'تكامل',
            'مرجعي', 'كياني', 'امتحان', 'نصفي', 'درجة', 'محاضرة', 'فصل',
            'تكرار', 'تجزئة', 'فقدان'
        ];

        $englishKeywords = [
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
            'closure', 'armstrong', 'ddl', 'dml', 'sql', 'nosql', 'er'
        ];

        $lowerMsg = mb_strtolower($message);

        // Check Arabic keywords by substring
        foreach ($arabicKeywords as $kw) {
            if (mb_strpos($lowerMsg, $kw) !== false) {
                return true;
            }
        }

        // Check English keywords using strict word boundaries to avoid false substring matches (e.g. "er" in "compiler")
        foreach ($englishKeywords as $kw) {
            if (preg_match('/(?:\b|^)' . preg_quote($kw, '/') . '(?:\b|$)/i', $message)) {
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
     * Safely resolve client IP for rate limiting.
     * Prevents IP spoofing while properly supporting Render reverse proxy.
     */
    public static function getClientIp(): string
    {
        // 1. In Render environment (Render automatically sets RENDER=true), trust X-Forwarded-For
        $isRender = getenv('RENDER') !== false || !empty($_ENV['RENDER']) || !empty($_SERVER['RENDER']);

        if ($isRender && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $clientIp = trim($ips[0]);
            if (filter_var($clientIp, FILTER_VALIDATE_IP)) {
                return $clientIp;
            }
        }

        // 2. Direct web server or local XAMPP: Prioritize REMOTE_ADDR to prevent header spoofing
        if (!empty($_SERVER['REMOTE_ADDR']) && filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP)) {
            return $_SERVER['REMOTE_ADDR'];
        }

        // 3. Fallback for CLI or untrusted contexts
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
     * Sliding Window Log Server-Side Rate Limiter
     * Enforces strict FAIL-CLOSED policy: If storage, locking, or decoding fails,
     * the request is safely rejected with an error notice.
     */
    public static function checkRateLimit(): array
    {
        $now = time();
        $ip = self::getClientIp();
        $ipHash = hash('sha256', 'dbms_rl_' . $ip);
        $tempDir = sys_get_temp_dir();
        $rateFile = $tempDir . DIRECTORY_SEPARATOR . 'dbms_rl_' . substr($ipHash, 0, 16) . '.json';

        // 1. Fail-Closed if fopen fails (unwritable directory, permission denied, etc.)
        $fp = @fopen($rateFile, 'c+');
        if ($fp === false) {
            error_log("[DBMS RateLimit Fail-Closed] Failed to open rate file: {$rateFile}");
            return [
                'allowed' => false,
                'error_code' => 'RATE_LIMIT_STORAGE_UNAVAILABLE',
                'reply' => '⚠️ تعذر الوصول إلى مسجل معدل الطلبات في الخادم. تم حظر الطلب كإجراء أمان احترازي.'
            ];
        }

        // 3. Fail-Closed if flock fails
        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            error_log("[DBMS RateLimit Fail-Closed] Lock acquisition failed for IP hash: " . substr($ipHash, 0, 16));
            return [
                'allowed' => false,
                'error_code' => 'RATE_LIMIT_LOCK_FAILED',
                'reply' => '⚠️ الخادم مشغول حالياً بتنظيم حركة الطلبات المتزامنة. يرجى الانتظار بضع ثوانٍ.'
            ];
        }

        $content = stream_get_contents($fp);
        $history = [];
        if ($content !== false && $content !== '') {
            $decoded = json_decode($content, true);
            // 4. Fail-Closed if data is corrupted
            if (!is_array($decoded)) {
                flock($fp, LOCK_UN);
                fclose($fp);
                error_log("[DBMS RateLimit Fail-Closed] Corrupted data in rate file: {$rateFile}");
                return [
                    'allowed' => false,
                    'error_code' => 'RATE_LIMIT_CORRUPTED',
                    'reply' => '⚠️ تم رصد خطأ في بنية سجل الطلبات الآمن. تم حظر الطلب كإجراء احترازي.'
                ];
            }
            $history = $decoded;
        }

        // Sliding Window Log: Prune entries older than 60 seconds
        $history = array_values(array_filter($history, fn($ts) => is_int($ts) && ($now - $ts) < self::RATE_LIMIT_WINDOW_SECONDS));

        // Enforce quota
        if (count($history) >= self::RATE_LIMIT_MAX_REQUESTS) {
            flock($fp, LOCK_UN);
            fclose($fp);
            return [
                'allowed' => false,
                'error_code' => 'RATE_LIMIT_EXCEEDED',
                'reply' => '⚠️ لقد تجاوزت الحد المسموح به من الأسئلة المتتالية (' . self::RATE_LIMIT_MAX_REQUESTS . ' استفسارات في الدقيقة). يرجى الانتظار قليلاً لتنظيم حركة المرور الأكاديمية.'
            ];
        }

        // Append current request timestamp
        $history[] = $now;
        $encoded = json_encode($history);
        if ($encoded === false) {
            flock($fp, LOCK_UN);
            fclose($fp);
            return [
                'allowed' => false,
                'error_code' => 'RATE_LIMIT_WRITE_FAILED',
                'reply' => '⚠️ فشل تشفير سجل الطلبات. يرجى إعادة المحاولة.'
            ];
        }

        ftruncate($fp, 0);
        rewind($fp);
        $written = fwrite($fp, $encoded);
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        // 5. Fail-Closed if fwrite fails
        if ($written === false || $written < strlen($encoded)) {
            error_log("[DBMS RateLimit Fail-Closed] Write failure on rate file: {$rateFile}");
            return [
                'allowed' => false,
                'error_code' => 'RATE_LIMIT_WRITE_FAILED',
                'reply' => '⚠️ فشل حفظ تحديث سجل الطلبات في الخادم. يرجى إعادة المحاولة.'
            ];
        }

        // Keep session synchronized when active
        if (session_status() === PHP_SESSION_ACTIVE || session_status() === PHP_SESSION_NONE) {
            @session_start();
            $_SESSION['dbms_rate_limit_history'] = $history;
        }

        return ['allowed' => true];
    }
}
