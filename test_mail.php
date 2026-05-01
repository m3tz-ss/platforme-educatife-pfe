<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;

echo "Config SMTP:\n";
echo "  Mailer  : " . config('mail.mailer') . "\n";
echo "  Host    : " . config('mail.host') . "\n";
echo "  Port    : " . config('mail.port') . "\n";
echo "  Username: " . config('mail.username') . "\n";
echo "  From    : " . config('mail.from.address') . "\n\n";

echo "Envoi de l'email de test...\n";

try {
    Mail::raw('✅ Test SMTP my_stage — La connexion Gmail fonctionne correctement !', function ($message) {
        $message->to('tarresmoataz840@gmail.com')
                ->subject('✅ Test SMTP my_stage — OK');
    });
    echo "✅ Email envoyé avec succès !\n";
} catch (\Throwable $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
}
