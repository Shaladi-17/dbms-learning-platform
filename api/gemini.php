<?php
/**
 * ASH - DBMS Platform Gemini API Client
 * Secure integration with Google Gemini Generative Language API
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

class GeminiClient
{
    private const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

    /**
     * Send a query with RAG context to Gemini
     */
    public static function generateResponse(string $userMessage, array $ragChunks = []): array
    {
        if (!AppConfig::isApiKeyConfigured()) {
            return [
                'success' => false,
                'reply' => "⚠️ **تنبيه الإعداد:** لم يتم ضبط مفتاح `GEMINI_API_KEY` بعد.\n\nلتفعيل مساعد الذكاء الاصطناعي:\n- **محلياً (XAMPP):** قم بإضافة مفتاحك داخل ملف `.env` بصيغة `GEMINI_API_KEY=your_key`.\n- **على Render:** أضف المتغير `GEMINI_API_KEY` في إعدادات **Environment Variables** الخاصة بالخدمة.\n\nيمكنك الحصول على مفتاح مجاني من [Google AI Studio](https://aistudio.google.com/).",
                'error_code' => 'API_KEY_MISSING'
            ];
        }

        $apiKey = AppConfig::getApiKey();
        $primaryModel = AppConfig::getModel();
        $candidateModels = array_values(array_unique([
            $primaryModel,
            'gemini-3-flash-preview',
            'gemini-3.1-flash-lite',
            'gemini-flash-latest'
        ]));

        // Build System Instruction & Context
        $systemInstruction = self::buildSystemInstruction();
        $promptWithContext = self::buildPromptWithRAG($userMessage, $ragChunks);

        $payload = [
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemInstruction]
                ]
            ],
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $promptWithContext]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.4,
                'topP' => 0.85,
                'topK' => 40,
                'maxOutputTokens' => 2048
            ]
        ];

        $lastError = null;
        $lastHttpCode = 0;

        foreach ($candidateModels as $model) {
            $url = self::BASE_URL . "/{$model}:generateContent?key=" . urlencode($apiKey);

            $ch = curl_init($url);
            if ($ch === false) {
                continue;
            }

            $jsonData = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $jsonData,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json; charset=utf-8'
                ],
                CURLOPT_TIMEOUT => 25,
                CURLOPT_CONNECTTIMEOUT => 8,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($response === false) {
                $lastError = "Gemini Network Error: " . $curlError;
                $lastHttpCode = 0;
                continue;
            }

            $result = json_decode($response, true);

            if ($httpCode === 200 && !empty($result['candidates'][0]['content']['parts'][0]['text'])) {
                $replyText = trim($result['candidates'][0]['content']['parts'][0]['text']);
                return [
                    'success' => true,
                    'reply' => $replyText,
                    'model' => $model
                ];
            }

            // If 503 or 404 or 429, try next model
            $lastHttpCode = $httpCode;
            $lastError = $result['error']['message'] ?? 'Unknown error';
            error_log("Gemini model {$model} returned HTTP {$httpCode}: {$lastError}. Trying next fallback...");
        }

        // Mask any key if present in error message
        $safeError = str_replace($apiKey, '***KEY***', (string)$lastError);
        error_log("All Gemini models failed. Last HTTP: {$lastHttpCode}, Error: {$safeError}");

        if ($lastHttpCode === 429) {
            return [
                'success' => false,
                'reply' => "تم تجاوز حد الطلبات المسموح به مؤقتاً في خدمة الذكاء الاصطناعي. يرجى الانتظار دقيقة والمحاولة مجدداً.",
                'error_code' => 'RATE_LIMIT'
            ];
        }

        return [
            'success' => false,
            'reply' => "تعذر الحصول على استجابة من المساعد الذكي حالياً (خطأ في الخادم أو الشبكة). يرجى المحاولة مرة أخرى بعد قليل.",
            'error_code' => 'API_ERROR',
            'http_status' => $lastHttpCode
        ];
    }

    /**
     * Build strict academic system instruction
     */
    private static function buildSystemInstruction(): string
    {
        return <<<INSTRUCTION
أنت "DBMS AI Assistant" (مساعد الداتا بيز الذكي)، مساعد تعليمي متقدم ومتخصص في مقرر نظم إدارة قواعد البيانات (Database Management Systems - DBMS).

قواعد السلوك الأكاديمي الصارمة:
1. مرجعك الأكاديمي الأساسي والحاكم هو محتوى "سياق المرجع الأكاديمي المسترجع" المرفق في كل طلب.
2. أعطِ الأولوية القصوى لمعلومات المرجع واعتمد على تعاريفه ومعادلاته وأمثلته الرسمية.
3. اشرح المفاهيم بأسلوب تعليمي متدرج، منظم، وشيق، مع استخدام العناوين والنقاط وجداول المقارنة عند الحاجة.
4. استخدم اللغة العربية الفصحى السليمة في الشرح، مع الحفاظ الدائم على المصطلحات التقنية باللغة الإنجليزية كما هي (مثل: Primary Key, Foreign Key, Functional Dependency, Normalization, 1NF, 2NF, 3NF, BCNF, Attribute Closure, Relational Algebra, Selection, Projection, Natural Join, Degree, Cardinality).
5. عند شرح أمثلة SQL أو الجبر العلائقي، اكتب الأكواد والتعبيرات واضحة داخل كتل تعليمية منسقة.
6. لا تخترع معلومات أو تنسب إلى المرجع ما ليس فيه؛ إذا كانت المعلومة غير موجودة في المرجع، صرّح بذلك بوضوح ("لم يرد هذا الموضوع في ملخص المقرر المعتمد...") ثم قدم الإجابة الأكاديمية العامة مميزاً إياها بأنها "معلومة إضافية".
7. إذا كان سؤال الطالب مبهماً أو ناقصاً، اطلب منه التوضيح بأسلوب لطيف ومباشر.
8. اذكر دائماً في نهاية الإجابة اسم المحاضرة أو القسم الذي تم الاعتماد عليه (مثلاً: 📌 المرجع: المحاضرة 7 - نظرية التطبيع).
INSTRUCTION;
    }

    /**
     * Build the user prompt enriched with RAG context
     */
    private static function buildPromptWithRAG(string $userMessage, array $ragChunks): string
    {
        if (empty($ragChunks)) {
            return $userMessage;
        }

        $contextBlock = "=== سياق المرجع الأكاديمي المسترجع من ملخص المقرر (DBMS Lectures 1-9) ===\n\n";

        foreach ($ragChunks as $i => $chunk) {
            $idx = $i + 1;
            $contextBlock .= "--- [المصدر {$idx}]: {$chunk['lecture']} | {$chunk['section']} ---\n";
            $contextBlock .= $chunk['content'] . "\n\n";
        }

        $contextBlock .= "=== نهاية السياق الأكاديمي المعتمد ===\n\n";
        $contextBlock .= "سؤال الطالب:\n" . $userMessage;

        return $contextBlock;
    }
}
