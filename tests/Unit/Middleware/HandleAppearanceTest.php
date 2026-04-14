<?php

declare(strict_types=1);

use App\Http\Middleware\HandleAppearance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\View;

it('shares appearance cookie value with views', function (): void {
    $middleware = new HandleAppearance();

    $request = Request::create('/', 'GET');
    $request->cookies->set('appearance', 'dark');

    $response = $middleware->handle($request, fn ($req): Response => response('OK'));

    expect(View::shared('appearance'))->toBe('dark')
        ->and($response->getContent())->toBe('OK');
});

it('defaults to system when appearance cookie not present', function (): void {
    $middleware = new HandleAppearance();

    $request = Request::create('/', 'GET');

    $response = $middleware->handle($request, fn ($req): Response => response('OK'));

    expect(View::shared('appearance'))->toBe('system')
        ->and($response->getContent())->toBe('OK');
});

it('handles light appearance', function (): void {
    $middleware = new HandleAppearance();

    $request = Request::create('/', 'GET');
    $request->cookies->set('appearance', 'light');

    $middleware->handle($request, fn ($req): Response => response('OK'));

    expect(View::shared('appearance'))->toBe('light');
});

it('handles system appearance', function (): void {
    $middleware = new HandleAppearance();

    $request = Request::create('/', 'GET');
    $request->cookies->set('appearance', 'system');

    $middleware->handle($request, fn ($req): Response => response('OK'));

    expect(View::shared('appearance'))->toBe('system');
});

it('resolves appearance from json cookie for authenticated user', function (): void {
    $user = User::factory()->create();
    $middleware = new HandleAppearance();

    $request = Request::create('/', 'GET');
    $request->setUserResolver(static fn (): User => $user);
    $request->cookies->set('appearance', json_encode([(string) $user->getAuthIdentifier() => 'light']));

    $middleware->handle($request, fn ($req): Response => response('OK'));

    expect(View::shared('appearance'))->toBe('light');
});

it('defaults to system for authenticated user when json cookie omits their id', function (): void {
    $user = User::factory()->create();
    $middleware = new HandleAppearance();

    $request = Request::create('/', 'GET');
    $request->setUserResolver(static fn (): User => $user);
    $request->cookies->set('appearance', json_encode(['other-id' => 'dark']));

    $middleware->handle($request, fn ($req): Response => response('OK'));

    expect(View::shared('appearance'))->toBe('system');
});
