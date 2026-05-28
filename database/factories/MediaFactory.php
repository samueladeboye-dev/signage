<?php

namespace Database\Factories;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement([\App\Enums\MediaType::Image->value, \App\Enums\MediaType::Video->value]);

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'original_name' => fake()->slug(2).($type === \App\Enums\MediaType::Image->value ? '.jpg' : '.mp4'),
            'type' => $type,
            'disk' => 's3',
            'path' => 'media/'.fake()->uuid().($type === \App\Enums\MediaType::Image->value ? '.jpg' : '.mp4'),
            'thumbnail_path' => null,
            'mime_type' => $type === \App\Enums\MediaType::Image->value ? 'image/jpeg' : 'video/mp4',
            'size' => fake()->numberBetween(100000, 50000000),
            'duration' => $type === \App\Enums\MediaType::Video->value ? fake()->randomFloat(1, 5, 300) : null,
            'width' => $type === \App\Enums\MediaType::Image->value ? fake()->randomElement([1920, 1280, 3840]) : null,
            'height' => $type === \App\Enums\MediaType::Image->value ? fake()->randomElement([1080, 720, 2160]) : null,
            'status' => \App\Enums\MediaStatus::Ready->value,
            'metadata' => null,
        ];
    }

    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => \App\Enums\MediaType::Image->value,
            'mime_type' => 'image/jpeg',
            'original_name' => fake()->slug(2).'.jpg',
            'path' => 'media/'.fake()->uuid().'.jpg',
            'duration' => null,
            'width' => 1920,
            'height' => 1080,
        ]);
    }

    public function video(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => \App\Enums\MediaType::Video->value,
            'mime_type' => 'video/mp4',
            'original_name' => fake()->slug(2).'.mp4',
            'path' => 'media/'.fake()->uuid().'.mp4',
            'duration' => fake()->randomFloat(1, 15, 180),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => ['status' => \App\Enums\MediaStatus::Pending->value]);
    }
}
