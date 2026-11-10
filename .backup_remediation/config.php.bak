<?php
/**
 * ASH - DBMS Learning Platform Configuration & Environment Loader
 * Supports Local Development (XAMPP / PHP CLI) and Production (Render / Docker)
 */

declare(strict_types=1);

// Prevent direct script execution error leakage
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Root & Paths
define('APP_ROOT', dirname(__DIR__));
define('RAG_FILE_PATH', APP_ROOT . DIRECTORY_SEPARATOR . 'DBMS_Midterm_Summary_Lectures_1-9.md');

// Load .env file if it exists (for local development)
(function () {
    $envFile = APP_ROOT . DIRECTORY_SEPARATOR . '.env';
    if (!file_exists($envFile)) {
        return;
    }

    $lines = @file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        $content = @file_get_contents($envFile);
        if ($content !== false && $content !== '') {
            $lines = preg_split('/\r\n|\r|\n/', $content);
        } else {
            return;
        }
    }

    foreach ($lines as $line) {
        $line = trim($line);
        // Skip comments and empty lines
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            // Remove surrounding quotes if any
            if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                $val = substr($val, 1, -1);
            }

            // Set environment variable only if not already set
            if (getenv($key) === false) {
                putenv("{$key}={$val}");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
    }
})();

class AppConfig
{
    public static function getApiKey(): string
    {
        $key = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_SERVER['GEMINI_API_KEY'] ?? ''));
        return trim((string)$key);
    }

    public static function isApiKeyConfigured(): bool
    {
        $key = self::getApiKey();
        return !empty($key) && $key !== 'your_gemini_api_key_here';
    }

    public static function getModel(): string
    {
        $model = getenv('GEMINI_MODEL') ?: ($_ENV['GEMINI_MODEL'] ?? ($_SERVER['GEMINI_MODEL'] ?? ''));
        $model = trim((string)$model);
        return !empty($model) ? $model : 'gemini-3-flash-preview';
    }

    public static function getEnvironment(): string
    {
        $env = getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? ($_SERVER['APP_ENV'] ?? 'development'));
        return strtolower(trim((string)$env));
    }

    public static function isProduction(): bool
    {
        return self::getEnvironment() === 'production';
    }
}

/**
 * Standard JSON response helper
 */
function jsonResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
