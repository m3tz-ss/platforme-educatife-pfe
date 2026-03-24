<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/../../../vendor/autoload.php';
$app = require __DIR__ . '/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sql = file_get_contents(__DIR__ . '/demo_encadrant_postgresql.sql');
DB::unprepared($sql);
echo "OK: demo_encadrant_postgresql.sql exécuté.\n";
