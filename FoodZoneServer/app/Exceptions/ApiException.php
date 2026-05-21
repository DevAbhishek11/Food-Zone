<?php

namespace App\Exceptions;

use Exception;

/**
 * Domain/business-rule exception. Thrown deliberately by services and
 * controllers and rendered as a clean JSON error by the global handler.
 */
class ApiException extends Exception
{
    public function __construct(
        string $message,
        protected int $status = 422,
        protected mixed $errors = null,
    ) {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return $this->status;
    }

    public function errors(): mixed
    {
        return $this->errors;
    }

    public static function make(string $message, int $status = 422, mixed $errors = null): self
    {
        return new self($message, $status, $errors);
    }
}
