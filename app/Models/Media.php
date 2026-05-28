<?php

namespace App\Models;

use Database\Factories\MediaFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

#[Fillable(['user_id', 'name', 'original_name', 'type', 'disk', 'path', 'thumbnail_path', 'mime_type', 'size', 'duration', 'width', 'height', 'status', 'metadata'])]
class Media extends Model
{
    /** @use HasFactory<MediaFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'size' => 'integer',
            'duration' => 'float',
            'width' => 'integer',
            'height' => 'integer',
            'type' => \App\Enums\MediaType::class,
            'status' => \App\Enums\MediaStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function playlistItems(): HasMany
    {
        return $this->hasMany(PlaylistItem::class);
    }

    /** Cloud disks that support temporaryUrl(). */
    private const CLOUD_DISKS = ['s3', 'r2', 'gcs', 'spaces'];

    public function getSignedUrlAttribute(): ?string
    {
        if (! $this->path) {
            return null;
        }

        if (in_array($this->disk, self::CLOUD_DISKS, true)) {
            try {
                return Storage::disk($this->disk)->temporaryUrl($this->path, now()->addHours(6));
            } catch (\Throwable) {
                // Fall through if cloud is misconfigured (e.g. local dev with no credentials)
            }
        }

        return Storage::disk($this->disk)->url($this->path);
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (! $this->thumbnail_path) {
            return $this->type === \App\Enums\MediaType::Image ? $this->signed_url : null;
        }

        if (in_array($this->disk, self::CLOUD_DISKS, true)) {
            try {
                return Storage::disk($this->disk)->temporaryUrl($this->thumbnail_path, now()->addHours(6));
            } catch (\Throwable) {
                // Fall through if cloud is misconfigured
            }
        }

        return Storage::disk($this->disk)->url($this->thumbnail_path);
    }

    public function isReady(): bool
    {
        return $this->status === \App\Enums\MediaStatus::Ready;
    }

    public function isImage(): bool
    {
        return $this->type === \App\Enums\MediaType::Image;
    }

    public function isVideo(): bool
    {
        return $this->type === \App\Enums\MediaType::Video;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<Media>  $query
     */
    public function scopeReady($query): void
    {
        $query->where('status', \App\Enums\MediaStatus::Ready->value);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<Media>  $query
     */
    public function scopeImages($query): void
    {
        $query->where('type', \App\Enums\MediaType::Image->value);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<Media>  $query
     */
    public function scopeVideos($query): void
    {
        $query->where('type', \App\Enums\MediaType::Video->value);
    }
}
