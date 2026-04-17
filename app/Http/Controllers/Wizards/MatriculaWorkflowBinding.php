<?php

declare(strict_types=1);

namespace App\Http\Controllers\Wizards;

/**
 * Liga o assistente de matrícula ao registo em `workflows` (por ID estável).
 *
 * Altere {@see self::DEFAULT_WORKFLOW_ID} ao ID real na sua base. Em testes usa-se
 * {@see self::setWorkflowIdForTesting()}.
 */
final class MatriculaWorkflowBinding
{
    /**
     * ID na tabela `workflows` (não o nome do fluxo).
     */
    private const DEFAULT_WORKFLOW_ID = 28;

    private static ?int $testOverride = null;

    public static function setWorkflowIdForTesting(?int $id): void
    {
        self::$testOverride = $id;
    }

    public static function workflowId(): int
    {
        return self::$testOverride ?? self::DEFAULT_WORKFLOW_ID;
    }
}
