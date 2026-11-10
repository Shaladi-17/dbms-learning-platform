<?php
/**
 * ASH - DBMS Platform Gemini API Client
 * Secure integration with Google Gemini Generative Language API
 * Strictly enforces academic theory focus and Zero-Code Policy
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
                'reply' => "⚠️ **تنبيه الإعداد الأكاديمي:** لم يتم ضبط مفتاح `GEMINI_API_KEY` بعد في بيئة الخادم.\n\nلتفعيل مساعد الذكاء الاصطناعي:\n- **محلياً (XAMPP):** تأكد من وجود ملف `.env` في جذر المشروع يحتوي على `GEMINI_API_KEY=your_key`.\n- **على استضافة Render:** أضف المتغير `GEMINI_API_KEY` في لوحة **Environment Variables**.\n\nالمساعد جاهز للعمل بمجرد تزويد المفتاح المعتمد.",
                'error_code' => 'API_KEY_MISSING'
            ];
        }

        $apiKey = AppConfig::getApiKey();
        $primaryModel = AppConfig::getModel();
        $candidateModels = array_values(array_unique([
            $primaryModel,
            'gemini-3-flash-preview',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest'
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
                'temperature' => 0.35,
                'topP' => 0.85,
                'topK' => 40,
                'maxOutputTokens' => 1024
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
                $lastError = "Network connection failure: " . $curlError;
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

            $lastHttpCode = $httpCode;
            $lastError = $result['error']['message'] ?? 'Unknown Gemini API error';
            error_log("Gemini model {$model} returned HTTP {$httpCode}: {$lastError}. Attempting fallback...");
        }

        // Mask any key if present in error message
        $safeError = str_replace($apiKey, '***KEY***', (string)$lastError);
        error_log("All candidate Gemini models failed. Last HTTP: {$lastHttpCode}, Safe Error: {$safeError}");

        if ($lastHttpCode === 429) {
            return [
                'success' => false,
                'reply' => "تم تجاوز حد الطلبات اللحظي في خدمة الذكاء الاصطناعي (Rate Limit). يرجى الانتظار 30 ثانية والمحاولة ثانية.",
                'error_code' => 'RATE_LIMIT'
            ];
        }

        return [
            'success' => false,
            'reply' => "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. يمكنك الاعتماد على شروحات الموسوعة التفاعلية وبنك الأسئلة المعتمد داخل المنصة.",
            'error_code' => 'API_ERROR',
            'http_status' => $lastHttpCode
        ];
    }

    /**
     * Build strict academic system instruction with Zero-Code enforcement
     */
    private static function buildSystemInstruction(): string
    {
        return <<<INSTRUCTION
أنت "مساعد الداتا بيز الذكي" (DBMS Academic AI Assistant)، المساعد التعليمي المتخصص في مقرر نظم إدارة قواعد البيانات (Database Management Systems) وفق المرجع الأكاديمي المعتمد (Lectures 1–9 Midterm Summary).

القواعد الأكاديمية والسيادية الملزمة (Strict Academic Constraints):
1. سياسة منع الأكواد الصارمة (Zero-Code Policy):
   - يُمنع منعاً باتاً كتابة أو تصحيح أو توليد أي كود برمجي تنفيذي (مثل استعلامات SQL، أو شفرات Python أو Java أو PHP أو C++ أو HTML).
   - إذا سُئلت عن استعلام SQL، اشرح المفهوم الرياضي المعادل له في الجبر العلائقي (Relational Algebra Expression) أو المفهوم النظري بدلاً من كتابة كود SQL.
2. المرجعية الأكاديمية الحاكمة:
   - مرجعك الأساسي هو سياق المرجع الأكاديمي المرفق (المحاضرات 1 إلى 9).
   - التزم بالتعاريف والمصطلحات والرموز الرسمية الواردة في المرجع (مثل: ANSI-SPARC 3-Level Architecture، مفاهيم الكيانات القوية والضعيفة، قواعد التحويل السبع 7-Step Mapping، شروط التطبيع 1NF, 2NF, 3NF, BCNF، خوارزمية إغلاق السمات وتحديد المفاتيح المرشحة بطريقة L/R/B/N).
3. الأسلوب التعليمي المتقن:
   - اشرح بأسلوب أكاديمي منظم، واضح، ومتسلسل باللغة العربية الفصحى.
   - حافظ على المصطلحات التقنية الأساسية بالإنجليزية بين قوسين (مثل: Primary Key, Foreign Key, Functional Dependency, Attribute Closure, Partial Dependency, Transitive Dependency).
   - رتب الإجابة في نقاط واضحة وعناوين فرعية لتسهيل الفهم والتركيز للامتحان.
4. الأمانة العلمية:
   - لا تختلق أي معلومة غير موثقة في المنهج، واذكر دائماً في نهاية الإجابة اسم المحاضرة أو القسم المرجعي المعتمد (مثلاً: 📌 المرجع: المحاضرة 7 - نظرية التطبيع والاعتماديات الوظيفية).
INSTRUCTION;
    }

    /**
     * Build user prompt enriched with RAG context
     */
    private static function buildPromptWithRAG(string $userMessage, array $ragChunks): string
    {
        if (empty($ragChunks)) {
            return $userMessage;
        }

        $contextBlock = "=== سياق المرجع الأكاديمي المعتمد (DBMS Midterm Summary - Lectures 1-9) ===\n\n";

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
