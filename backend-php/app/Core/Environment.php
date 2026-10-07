<?php

declare(strict_types=1);

namespace App\Core;

class Environment
{
    private static array $loadedFiles = [];

    public static function load(string $file): void
    {
        $path = realpath($file);
        if ($path === false || isset(self::$loadedFiles[$path])) {
            return;
        }
        self::$loadedFiles[$path] = true;

        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            throw new \RuntimeException('Unable to read environment file.');
        }

        foreach ($lines as $lineNumber => $line) {
            $line = trim($line);
            if ($lineNumber === 0) {
                $line = ltrim($line, "\xEF\xBB\xBF");
            }
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (str_starts_with($line, 'export ')) {
                $line = substr($line, 7);
            }
            if (preg_match('/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/', $line, $matches) !== 1) {
                throw new \RuntimeException('Invalid environment file syntax on line ' . ($lineNumber + 1) . '.');
            }

            $name = $matches[1];
            $value = trim($matches[2]);
            if (getenv($name) !== false || isset($_ENV[$name]) || isset($_SERVER[$name])) {
                continue;
            }

            if (strlen($value) >= 2 && $value[0] === '"' && str_ends_with($value, '"')) {
                $decoded = json_decode($value, true);
                if (!is_string($decoded)) {
                    throw new \RuntimeException('Invalid quoted environment value on line ' . ($lineNumber + 1) . '.');
                }
                $value = $decoded;
            } elseif (strlen($value) >= 2 && $value[0] === "'" && str_ends_with($value, "'")) {
                $value = substr($value, 1, -1);
            } else {
                $value = preg_replace('/\s+#.*$/', '', $value) ?? $value;
            }

            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
            putenv($name . '=' . $value);
        }
    }

    public static function get(string $name): ?string
    {
        $value = $_ENV[$name] ?? $_SERVER[$name] ?? getenv($name);
        return is_string($value) ? $value : null;
    }
}
