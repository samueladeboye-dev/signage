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
            'role' => 'super_admin',
        ]);

        // Admin
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@landmark.edu.ng',
            'role' => 'admin',
        ]);

        // Viewer
        User::factory()->create([
            'name' => 'Viewer User',
            'email' => 'viewer@landmark.edu.ng',
            'role' => 'viewer',
        ]);

        // Sample playlists for the admin
        $playlists = Playlist::factory(3)->create(['user_id' => $admin->id]);

        // Sample screens
        Screen::factory(5)->create([
            'created_by' => $admin->id,
            'current_playlist_id' => $playlists->random()->id,
        ]);
    }
}
