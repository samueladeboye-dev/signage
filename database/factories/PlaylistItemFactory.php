<?php

namespace Database\Factories;

use App\Models\Media;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlaylistItem>
 */
class PlaylistItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'playlist_id' => Playlist::factory(),
            'media_id' => Media::factory(),
            'sort_order' => fake()->numberBetween(0, 20),
            'duration' => null,
        ];
    }
}
