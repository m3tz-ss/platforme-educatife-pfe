<?php
/**
 * Usage : php database/seeders/sql/generate_password_hash.php
 * Affiche un hash bcrypt (cost 12) pour coller dans les scripts SQL.
 */
echo password_hash($argv[1] ?? 'user123', PASSWORD_BCRYPT, ['cost' => 12]), PHP_EOL;
