<?php

declare(strict_types=1);

use Aftandilmmd\WorkflowAutomation\Models\Workflow;
use Pest\Browser\Playwright\Playwright;

it('ativa um workflow inactivo pela UI do editor', function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    $workflow = Workflow::factory()->create(['is_active' => false]);

    Playwright::setTimeout(25_000);

    $page = visit('/workflow-editor/'.$workflow->id);

    $page->assertTitle('Workflow Editor')
        ->resize(1280, 800)
        ->assertSee('Inactive')
        ->click('button[title="Activate"]');

    $page->assertSee('Active');

    expect($workflow->fresh()->is_active)->toBeTrue();
});
