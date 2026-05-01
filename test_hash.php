<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$start = microtime(true);
$user = App\Models\User::where('email', 'student@example.com')->first();
echo 'Find user time: ' . (microtime(true) - $start) . PHP_EOL;

if ($user) {
    $start = microtime(true);
    Illuminate\Support\Facades\Hash::check('password', $user->password);
    echo 'Hash check time: ' . (microtime(true) - $start) . PHP_EOL;

    $start = microtime(true);
    $user->tokens()->delete();
    echo 'Tokens delete time: ' . (microtime(true) - $start) . PHP_EOL;
    
    $start = microtime(true);
    $user->createToken('auth_token')->plainTextToken;
    echo 'Create token time: ' . (microtime(true) - $start) . PHP_EOL;
}
