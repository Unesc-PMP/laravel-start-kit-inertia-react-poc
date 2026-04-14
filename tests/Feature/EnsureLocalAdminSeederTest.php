<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\EnsureLocalAdminSeeder;
use Illuminate\Foundation\Application;

it('marks all users admin in local when user count is within cap', function (): void {
    /** @var Application $app */
    $app = app();
    $app->detectEnvironment(fn (): string => 'local');

    User::factory()->create(['email' => 'first@example.com', 'is_admin' => false]);
    User::factory()->create(['email' => 'second@example.com', 'is_admin' => false]);

    (new EnsureLocalAdminSeeder)->run();

    expect(User::query()->where('is_admin', false)->count())->toBe(0)
        ->and(User::query()->where('is_admin', true)->count())->toBe(2);
});

it('does nothing when user count exceeds cap', function (): void {
    /** @var Application $app */
    $app = app();
    $app->detectEnvironment(fn (): string => 'local');

    User::factory()->count(51)->create(['is_admin' => false]);

    (new EnsureLocalAdminSeeder)->run();

    expect(User::query()->where('is_admin', true)->count())->toBe(0);
});
