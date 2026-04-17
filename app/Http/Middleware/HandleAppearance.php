<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

final readonly class HandleAppearance
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        View::share('appearance', $this->resolveAppearance($request));

        return $next($request);
    }

    private function resolveAppearance(Request $request): string
    {
        $raw = $request->cookie('appearance') ?? 'system';
        $user = $request->user();

        if ($user === null) {
            return $this->normalizeAppearance(is_string($raw) && ! str_starts_with($raw, '{') ? $raw : 'system');
        }

        $id = (string) $user->getAuthIdentifier();

        if (is_string($raw) && str_starts_with($raw, '{')) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded) && array_key_exists($id, $decoded)) {
                return $this->normalizeAppearance((string) $decoded[$id]);
            }
        }

        if (is_string($raw) && in_array($raw, ['light', 'dark', 'system'], true)) {
            return $this->normalizeAppearance($raw);
        }

        return 'system';
    }

    private function normalizeAppearance(string $value): string
    {
        return in_array($value, ['light', 'dark', 'system'], true) ? $value : 'system';
    }
}
