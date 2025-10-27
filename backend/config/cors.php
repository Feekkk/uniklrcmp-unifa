<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:8080', 
        'http://localhost:5173', 
        'http://localhost:3000',
        'https://unifa.rcmp.edu.my',
        'https://api.unifa.rcmp.edu.my'
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];