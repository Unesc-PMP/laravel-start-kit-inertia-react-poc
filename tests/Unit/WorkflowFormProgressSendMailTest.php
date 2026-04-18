<?php

declare(strict_types=1);

use Aftandilmmd\WorkflowAutomation\Enums\RunStatus;
use Aftandilmmd\WorkflowAutomation\Models\Workflow;
use Aftandilmmd\WorkflowAutomation\Models\WorkflowRun;
use App\Support\WorkflowFormProgress;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

it('inclui o passo send_mail no resumo de execução concluída', function (): void {
    $workflow = Workflow::query()->create([
        'name' => 'Teste resumo send_mail',
        'description' => '',
        'is_active' => true,
    ]);

    $trigger = $workflow->addNode('Início', 'manual', []);
    $mailNode = $workflow->addNode('Enviar email', 'send_mail', [
        'send_mode' => 'inline',
        'to' => 'dest@example.com',
        'subject' => 'Assunto de teste',
        'body' => 'Corpo',
    ]);
    $trigger->connect($mailNode);

    $run = WorkflowRun::query()->create([
        'workflow_id' => $workflow->id,
        'status' => RunStatus::Completed,
        'trigger_node_id' => $trigger->id,
        'context' => [
            (string) $mailNode->id => [
                'main' => [
                    [
                        'mail_sent' => true,
                        'subject' => 'Assunto resolvido',
                        'to' => 'user@example.com',
                    ],
                ],
            ],
        ],
    ]);

    $workflow->load(['nodes', 'edges']);
    $sections = WorkflowFormProgress::completedRunReadOnlySections($run, $workflow);

    $mailSection = collect($sections)->firstWhere('heading', 'Enviar email');
    expect($mailSection)->not->toBeNull()
        ->and($mailSection['lines'])->toContain('Estado: enviado')
        ->and($mailSection['lines'])->toContain('Assunto: Assunto resolvido')
        ->and($mailSection['lines'])->toContain('Para: user@example.com');
});
