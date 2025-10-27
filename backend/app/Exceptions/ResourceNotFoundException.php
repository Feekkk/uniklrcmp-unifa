<?php

namespace App\Exceptions;

use Exception;

class ResourceNotFoundException extends Exception
{
    public function __construct($message = 'Resource not found', $code = 404)
    {
        parent::__construct($message, $code);
    }
}