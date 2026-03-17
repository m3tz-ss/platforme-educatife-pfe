<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         $user = User::create([
            'name' => 'Alice Manager',
            'email' => 'alice.manager@example.com',
            'password' => Hash::make('password123'),
            'type' => 'enterprise',
        ]);

        $user->assignRole('manager');

         $user = User::create([
            'name' => 'Bob Manager',
            'email' => 'bob.manager@example.com',
            'password' => Hash::make('password123'),
            'type' => 'enterprise',
        ]);

        $user->assignRole('manager');
    }
}
