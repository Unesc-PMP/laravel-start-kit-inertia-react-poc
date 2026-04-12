<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Credenciais de teste — procedure prss_login_r01 (Sybase SAU)
    |--------------------------------------------------------------------------
    |
    | Apenas para desenvolvimento/POC (ping, login enquanto não há integração
    | com o formulário). Definir valores reais no .env local; não commitar segredos.
    |
    */

    'prss_login' => [
        'credentialId' => env('SAU_PRSS_LOGIN_CREDENTIAL_ID', ''),
        'credentialType' => env('SAU_PRSS_LOGIN_CREDENTIAL_TYPE', 'COD'),
        'password' => env('SAU_PRSS_LOGIN_PASSWORD', ''),
    ],

];
