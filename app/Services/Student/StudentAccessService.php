<?php

namespace App\Services\Student;

use App\Models\User;

class StudentAccessService
{
    public function ensureStudent(User $user): void
    {
        $isStudent = ($user->type ?? '') === 'student' || ($user->role ?? '') === 'student';
        if (!$isStudent) {
            abort(403, 'Réservé aux étudiants');
        }
    }
}
