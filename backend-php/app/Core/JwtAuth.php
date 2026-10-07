<?php

declare(strict_types=1);

namespace App\Core;

use JsonException;
use RuntimeException;
use UnexpectedValueException;

class JwtAuth
{
    private const ISSUER = 'cooperative-api';
    private const ALGORITHM = 'HS256';
    private const TOKEN_TTL = 3600;

    public function __construct(
        private string $secret,
        private int $ttl = self::TOKEN_TTL
    ) {
        if (strlen($this->secret) < 32) {
            throw new RuntimeException('JWT_SECRET must contain at least 32 bytes.');
        }
        if ($this->ttl < 1) {
            throw new RuntimeException('JWT_TTL must be a positive number of seconds.');
        }
    }

    public static function fromEnvironment(): self
    {
        Environment::load(dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env');

        $secret = Environment::get('JWT_SECRET');
        if (!is_string($secret) || $secret === '') {
            throw new RuntimeException('JWT_SECRET is not configured. Set it in the project .env file or the server environment.');
        }

        $ttl = Environment::get('JWT_TTL') ?? (string)self::TOKEN_TTL;
        $parsedTtl = filter_var($ttl, FILTER_VALIDATE_INT);
        if ($parsedTtl === false || $parsedTtl < 1) {
            throw new RuntimeException('JWT_TTL must be a positive integer number of seconds.');
        }

        return new self($secret, $parsedTtl);
    }

    public function issue(array $claims): string
    {
        $now = time();
        $header = ['typ' => 'JWT', 'alg' => self::ALGORITHM];
        $payload = array_merge($claims, [
            'iss' => self::ISSUER,
            'iat' => $now,
            'exp' => $now + $this->ttl,
        ]);

        try {
            $encodedHeader = $this->encode(json_encode($header, JSON_THROW_ON_ERROR));
            $encodedPayload = $this->encode(json_encode($payload, JSON_THROW_ON_ERROR));
        } catch (JsonException $e) {
            throw new RuntimeException('Unable to encode JWT claims.', 0, $e);
        }

        $signingInput = $encodedHeader . '.' . $encodedPayload;
        $signature = hash_hmac('sha256', $signingInput, $this->secret, true);

        return $signingInput . '.' . $this->encode($signature);
    }

    public function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new UnexpectedValueException('Invalid bearer token.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
        $header = $this->decodeJson($encodedHeader);
        if (($header['alg'] ?? null) !== self::ALGORITHM || ($header['typ'] ?? null) !== 'JWT') {
            throw new UnexpectedValueException('Unsupported bearer token.');
        }

        $signature = $this->decode($encodedSignature);
        $expectedSignature = hash_hmac(
            'sha256',
            $encodedHeader . '.' . $encodedPayload,
            $this->secret,
            true
        );
        if (!hash_equals($expectedSignature, $signature)) {
            throw new UnexpectedValueException('Invalid bearer token.');
        }

        $claims = $this->decodeJson($encodedPayload);
        $now = time();
        if (($claims['iss'] ?? null) !== self::ISSUER
            || !isset($claims['sub'], $claims['type'], $claims['iat'], $claims['exp'])
            || !is_string($claims['sub'])
            || $claims['sub'] === ''
            || !in_array($claims['type'], ['staff', 'member'], true)
            || !is_int($claims['iat'])
            || !is_int($claims['exp'])
            || $claims['iat'] > $now
            || $claims['exp'] <= $now
            || $claims['exp'] <= $claims['iat']
            || (isset($claims['nbf']) && (!is_int($claims['nbf']) || $claims['nbf'] > $now))) {
            throw new UnexpectedValueException('Bearer token is invalid or expired.');
        }

        return $claims;
    }

    public function expiresIn(): int
    {
        return $this->ttl;
    }

    private function encode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function decode(string $value): string
    {
        if ($value === '' || preg_match('/^[A-Za-z0-9_-]+$/', $value) !== 1) {
            throw new UnexpectedValueException('Invalid bearer token.');
        }

        $decoded = base64_decode(
            strtr($value, '-_', '+/') . str_repeat('=', (4 - strlen($value) % 4) % 4),
            true
        );
        if ($decoded === false) {
            throw new UnexpectedValueException('Invalid bearer token.');
        }

        return $decoded;
    }

    private function decodeJson(string $value): array
    {
        try {
            $decoded = json_decode($this->decode($value), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new UnexpectedValueException('Invalid bearer token.', 0, $e);
        }

        if (!is_array($decoded)) {
            throw new UnexpectedValueException('Invalid bearer token.');
        }

        return $decoded;
    }
}
