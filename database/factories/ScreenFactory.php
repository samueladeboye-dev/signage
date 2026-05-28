<?php

namespace Database\Factories;

use App\Models\Screen;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Screen>
 */
class ScreenFactory extends Factory
{
    public function definition(): array
    {
        return [
            'created_by' => User::factory(),
            'current_playlist_id' => null,
            'name' => fake()->words(2, true).' Screen',
            'location' => fake()->randomElement(['Main Hall', 'Library', 'Cafeteria', 'Administration', 'Lecture Hall A', 'Chapel']),
            'description' => fake()->optional()->sentence(),
            'pairing_code' => strtoupper(Str::random(8)),
            'status' => fake()->randomElement(['online', 'offline']),
            'last_seen_at' => fake()->optional()->dateTimeBetween('-7 days', 'now'),
            'timezone' => 'Africa/Lagos',
        ];
    }

    public function online(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'online',
            'last_seen_at' => now(),
        ]);
    }

    public function offline(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'offline',
        ]);
    }
}
