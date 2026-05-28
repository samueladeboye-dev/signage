<?php

namespace Database\Seeders;

use App\Models\Media;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\Screen;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Super Admin
        $superAdmin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'superadmin@landmark.edu.ng',
            'role' => \App\Enums\Role::SuperAdmin->value,
        ]);

        // Admin
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@landmark.edu.ng',
            'role' => \App\Enums\Role::Admin->value,
        ]);

        // Viewer
        User::factory()->create([
            'name' => 'Viewer User',
            'email' => 'viewer@landmark.edu.ng',
            'role' => \App\Enums\Role::Viewer->value,
        ]);
    }
}
