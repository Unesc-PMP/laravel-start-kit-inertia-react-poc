<?php

declare(strict_types=1);

namespace Aftandilmmd\WorkflowAutomation\Exceptions;

use RuntimeException;

/** Thrown when a workflow graph fails structural validation. */
final class WorkflowValidationException extends RuntimeException
{
    /**
     * @param  array<int, string>  $errors  List of validation error messages.
     */
    public function __construct(
        public readonly array $errors = [],
        string $message = 'Workflow validation failed.',
    ) {
        parent::__construct($message);
    }
}
