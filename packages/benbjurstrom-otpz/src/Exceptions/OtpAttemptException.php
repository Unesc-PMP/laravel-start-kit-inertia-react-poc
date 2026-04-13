<?php

declare(strict_types=1);

namespace BenBjurstrom\Otpz\Exceptions;

use Exception;

final class OtpAttemptException extends Exception
{
    public function __construct(string $message)
    {
        parent::__construct($message);
    }
}
