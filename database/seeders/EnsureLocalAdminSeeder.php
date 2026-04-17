<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Em ambiente local, com poucos utilizadores na base, marca todos como admin
 * para desenvolvimento (menu Utilizadores, impersonation) sem SQL manual.
 * Em produção (não-local) não faz nada.
 */
final class EnsureLocalAdminSeeder extends Seeder
{
    private const LOCAL_BULK_ADMIN_MAX_USERS = 50;

    public function run(): void
    {
        if (! app()->isLocal()) {
            return;
        }

        if (User::query()->count() > self::LOCAL_BULK_ADMIN_MAX_USERS) {
            return;
        }

        User::query()->update(['is_admin' => true]);
    }
}
