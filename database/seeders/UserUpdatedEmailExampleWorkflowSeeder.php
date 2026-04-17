<?php

declare(strict_types=1);

namespace Database\Seeders;

use Aftandilmmd\WorkflowAutomation\Models\Workflow;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Exemplo mínimo alinhado à documentação do pacote (model_event + send_mail):
 * envia e-mail para fcm@unes.cnet quando qualquer campo de {@see User} é atualizado.
 *
 * O fluxo fica visível em /workflow-editor com o nome {@see self::WORKFLOW_NAME}.
 *
 * Nota: o registo dos gatilhos Eloquent ocorre no arranque da aplicação. Após correr este seeder,
 * volte a carregar o processo PHP (ex.: reiniciar `composer run dev` / `serve`) ou faça um novo
 * pedido HTTP, e limpe a cache do pacote se necessário: a chave `workflow:model_event_triggers`.
 */
final class UserUpdatedEmailExampleWorkflowSeeder extends Seeder
{
    public const string WORKFLOW_NAME = 'Exemplo: e-mail ao atualizar User';

    public function run(): void
    {
        Workflow::withTrashed()
            ->where('name', self::WORKFLOW_NAME)
            ->get()
            ->each(static function (Workflow $workflow): void {
                $workflow->forceDelete();
            });

        $workflow = Workflow::query()->create([
            'name' => self::WORKFLOW_NAME,
            'description' => 'Notifica fcm@unes.cnet com a data ISO e o estado JSON do User após atualização.',
            'is_active' => false,
        ]);

        $trigger = $workflow->addNode('User atualizado', 'model_event', [
            'model' => User::class,
            'events' => ['updated'],
        ]);

        $body = <<<'BODY'
Notificação de exemplo (workflow no projeto).

Data/hora (ISO): {{ now() }}

Estado do User após a atualização (JSON):
{{ json_encode(item) }}
BODY;

        $email = $workflow->addNode('Avisar FCM', 'send_mail', [
            'send_mode' => 'inline',
            'to' => 'fcm@unes.cnet',
            'subject' => 'User #{{ item.id }} foi atualizado',
            'body' => $body,
        ]);

        $trigger->connect($email);

        $workflow->activate();

        $trigger->update(['position_x' => 80, 'position_y' => 160]);
        $email->update(['position_x' => 420, 'position_y' => 160]);

        Cache::forget('workflow:model_event_triggers');
    }
}
