<?php

namespace App\Exceptions;

use Exception;

class UnauthorizedException extends Exception
{
    public function __construct($message = 'Unauthorized action', $code = 403)
    {
        parent::__construct($message, $code);
    }
}