<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $runsTable = config('workflow-automation.tables.runs', 'workflow_runs');
        $nodeRunsTable = config('workflow-automation.tables.node_runs', 'workflow_node_runs');

        Schema::create('workflow_form_conversations', function (Blueprint $table) use ($runsTable, $nodeRunsTable): void {
            $table->id();
            $table->foreignId('workflow_run_id')->constrained($runsTable)->cascadeOnDelete();
            $table->foreignId('workflow_node_run_id')->constrained($nodeRunsTable)->cascadeOnDelete();
            $table->json('messages')->default('[]');
            $table->timestamps();

            $table->unique(['workflow_run_id', 'workflow_node_run_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_form_conversations');
    }
};
