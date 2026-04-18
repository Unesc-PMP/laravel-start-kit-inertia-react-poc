<?php

declare(strict_types=1);

use Aftandilmmd\WorkflowAutomation\Engine\GraphExecutor;
use Aftandilmmd\WorkflowAutomation\Enums\RunStatus;
use Aftandilmmd\WorkflowAutomation\Models\Workflow;
use App\Models\User;
use Database\Seeders\UserUpdatedEmailExampleWorkflowSeeder;

it('cria o workflow de exemplo com gatilho model_event e ação send_mail', function (): void {
    $this->seed(UserUpdatedEmailExampleWorkflowSeeder::class);

    $workflow = Workflow::query()->where('name', UserUpdatedEmailExampleWorkflowSeeder::WORKFLOW_NAME)->first();

    expect($workflow)->not->toBeNull()
        ->and($workflow->is_active)->toBeTrue();

    $nodes = $workflow->nodes()->orderBy('id')->get();
    expect($nodes)->toHaveCount(2)
        ->and($nodes[0]->node_key)->toBe('model_event')
        ->and($nodes[1]->node_key)->toBe('send_mail');

    expect($workflow->edges()->count())->toBe(1);
});

it('executa o grafo até concluir com o payload do User (equivalente ao model_event)', function (): void {
    $this->seed(UserUpdatedEmailExampleWorkflowSeeder::class);

    $workflow = Workflow::query()->where('name', UserUpdatedEmailExampleWorkflowSeeder::WORKFLOW_NAME)->firstOrFail();

    $user = User::factory()->create(['name' => 'Antes']);
    $payload = [$user->fresh()->toArray()];

    $run = app(GraphExecutor::class)->execute($workflow, $payload);

    expect($run->status)->toBe(RunStatus::Completed);
});
