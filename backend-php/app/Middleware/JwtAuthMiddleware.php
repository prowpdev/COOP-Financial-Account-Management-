<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\JwtAuth;
use UnexpectedValueException;

class JwtAuthMiddleware
{
    private JwtAuth $jwt;

    public function __construct(?JwtAuth $jwt = null)
    {
        $this->jwt = $jwt ?? JwtAuth::fromEnvironment();
    }

    /**
     * Validate the request bearer token and return its claims.
     *
     * Call from a protected controller's constructor:
     * $this->authClaims = (new JwtAuthMiddleware())->handle();
     */
    public function handle(): array
    {
        $token = $this->getBearerToken();
        if ($token === null) {
            $this->unauthorized();
        }

        try {
            return $this->authenticate($token);
        } catch (UnexpectedValueException) {
            $this->unauthorized();
        }
    }

    /**
     * Verify a token string and return its authenticated claims.
     */
    public function authenticate(string $token): array
    {
        if ($token === '') {
            throw new UnexpectedValueException('Bearer token is required.');
        }

        return $this->jwt->verify($token);
    }

    private function getBearerToken(): ?string
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        foreach ($headers as $name => $value) {
            if (is_string($name) && strtolower($name) === 'authorization' && is_string($value)) {
                return $this->parseBearerHeader($value);
            }
        }

        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $serverKey) {
            if (isset($_SERVER[$serverKey]) && is_string($_SERVER[$serverKey])) {
                return $this->parseBearerHeader($_SERVER[$serverKey]);
            }
        }

        return null;
    }

    private function parseBearerHeader(string $header): ?string
    {
        if (preg_match('/^Bearer\s+(\S+)$/i', trim($header), $matches) !== 1) {
            return null;
        }

        return $matches[1];
    }

    private function unauthorized(): never
    {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

        echo json_encode([
            'success' => false,
            'error' => 'Unauthorized or session expired.',
            'details' => null,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
