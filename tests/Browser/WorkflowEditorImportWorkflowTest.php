<?php

declare(strict_types=1);

use Pest\Browser\Playwright\Playwright;

it('importa o fixture matr-cula-de-calouro.workflow.json pela UI e abre o workflow criado', function (): void {
    app()->detectEnvironment(fn (): string => 'local');

    Playwright::setTimeout(30_000);

    $fixture = realpath(__DIR__.'/../Fixtures/matr-cula-de-calouro.workflow.json');
    expect($fixture)->not->toBeFalse();

    $page = visit('/workflow-editor');

    $page->assertTitle('Workflow Editor')
        ->assertSee('Workflows')
        ->click('Import')
        ->assertSee('Import Workflow');

    $page->attach('input[type="file"][accept=".json"]', $fixture)
        ->assertSee('Matrícula de Calouro - v2')
        ->assertSee('Ready to import');

    // Modal de importação: inner `max-w-lg` (o de «New Workflow» é `max-w-md`).
    $page->click('div.max-w-lg button.bg-blue-600')
        ->wait(2);

    $path = parse_url($page->url(), PHP_URL_PATH);
    expect(is_string($path))->toBeTrue();
    expect($path)->toMatch('#^/workflow-editor/\d+$#');

    $page->assertSee('Matrícula de Calouro - v2');
});
