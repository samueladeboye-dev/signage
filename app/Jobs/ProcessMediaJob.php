<?php

namespace App\Jobs;

use App\Models\Media;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;

class ProcessMediaJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(public readonly Media $media) {}

    public function handle(): void
    {
        $media = $this->media->fresh();

        if (! $media) {
            return;
        }

        $media->update(['status' => 'processing']);

        try {
            if ($media->type === 'image') {
                $this->processImage($media);
            } else {
                $this->processVideo($media);
            }

            $media->update(['status' => 'ready']);
        } catch (\Throwable $e) {
            Log::error('Media processing failed', [
                'media_id' => $media->id,
                'error' => $e->getMessage(),
            ]);

            $media->update(['status' => 'failed', 'metadata' => ['error' => $e->getMessage()]]);
        }
    }

    private function processImage(Media $media): void
    {
        // Get image dimensions from S3 using GD or Imagick if available
        $tempPath = tempnam(sys_get_temp_dir(), 'sig_').'.'.pathinfo($media->path, PATHINFO_EXTENSION);

        Storage::disk($media->disk)->copy($media->path, basename($tempPath));
        $localTempPath = storage_path('app/'.basename($tempPath));
        Storage::disk('local')->put(basename($tempPath), Storage::disk($media->disk)->get($media->path));

        if (extension_loaded('gd') && file_exists($localTempPath)) {
            [$width, $height] = getimagesize($localTempPath) ?: [null, null];
            $media->update(['width' => $width, 'height' => $height]);

            // Generate thumbnail (resize to 400x225)
            if ($width && $height) {
                $this->generateImageThumbnail($media, $localTempPath);
            }
        }

        @unlink($localTempPath);
    }

    private function generateImageThumbnail(Media $media, string $localPath): void
    {
        $mimeType = $media->mime_type;
        $image = match (true) {
            str_contains($mimeType, 'png') => imagecreatefrompng($localPath),
            str_contains($mimeType, 'gif') => imagecreatefromgif($localPath),
            str_contains($mimeType, 'webp') => imagecreatefromwebp($localPath),
            default => imagecreatefromjpeg($localPath),
        };

        if (! $image) {
            return;
        }

        $thumbWidth = 400;
        $thumbHeight = 225;
        $thumb = imagecreatetruecolor($thumbWidth, $thumbHeight);
        imagecopyresampled($thumb, $image, 0, 0, 0, 0, $thumbWidth, $thumbHeight, imagesx($image), imagesy($image));

        $thumbLocalPath = tempnam(sys_get_temp_dir(), 'sig_thumb_').'.jpg';
        imagejpeg($thumb, $thumbLocalPath, 85);

        $thumbS3Path = 'thumbnails/'.Str::uuid().'.jpg';
        Storage::disk($media->disk)->put($thumbS3Path, file_get_contents($thumbLocalPath));
        $media->update(['thumbnail_path' => $thumbS3Path]);

        imagedestroy($image);
        imagedestroy($thumb);
        @unlink($thumbLocalPath);
    }

    private function processVideo(Media $media): void
    {
        // Use pbmedia/laravel-ffmpeg to extract metadata and generate thumbnail
        try {
            $video = FFMpeg::fromDisk($media->disk)->open($media->path);
            $videoStream = $video->getVideoStream();

            $duration = $video->getDurationInSeconds();
            $dimensions = $videoStream?->getDimensions();

            $updates = ['duration' => $duration];

            if ($dimensions) {
                $updates['width'] = $dimensions->getWidth();
                $updates['height'] = $dimensions->getHeight();
            }

            // Generate thumbnail at 1 second mark
            $thumbPath = 'thumbnails/'.Str::uuid().'.jpg';
            $video->getFrameFromSeconds(min(1, $duration / 2))
                ->export()
                ->toDisk($media->disk)
                ->save($thumbPath);

            $updates['thumbnail_path'] = $thumbPath;

            $media->update($updates);
        } catch (\Throwable $e) {
            Log::warning('FFmpeg video processing failed, skipping thumbnail', [
                'media_id' => $media->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
