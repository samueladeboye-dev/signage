<?php

namespace App\Jobs;

use App\Enums\MediaType;
use App\Models\Media;
use FFMpeg\Format\Video\X264;
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

    public int $timeout = 1800;

    public function __construct(public readonly Media $media) {}

    public function handle(): void
    {
        $media = $this->media->fresh();

        if (! $media) {
            return;
        }

        $media->update(['status' => 'processing']);

        try {
            if ($media->type === MediaType::Image) {
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
        $extension = pathinfo($media->path, PATHINFO_EXTENSION);
        $tempPath = tempnam(sys_get_temp_dir(), 'sig_').'.'.$extension;

        $stream = Storage::disk($media->disk)->readStream($media->path);
        file_put_contents($tempPath, $stream);

        if (extension_loaded('gd') && file_exists($tempPath)) {
            [$width, $height] = getimagesize($tempPath) ?: [null, null];
            $media->update(['width' => $width, 'height' => $height]);

            if ($width && $height) {
                $this->generateImageThumbnail($media, $tempPath);
            }
        }

        @unlink($tempPath);
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
        $stream = fopen($thumbLocalPath, 'r');
        Storage::disk($media->disk)->writeStream($thumbS3Path, $stream);
        fclose($stream);
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

            // Transcode to HLS for efficient browser streaming
            $this->generateHls($media);
        } catch (\Throwable $e) {
            Log::warning('FFmpeg video processing failed, skipping thumbnail', [
                'media_id' => $media->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function generateHls(Media $media): void
    {
        try {
            $hlsDir = 'hls/'.Str::uuid();
            $manifestPath = $hlsDir.'/playlist.m3u8';

            $format = (new X264)->setKiloBitrate(2000)->setAudioKiloBitrate(128);

            FFMpeg::fromDisk($media->disk)
                ->open($media->path)
                ->exportForHLS()
                ->setSegmentLength(6)
                ->setKeyFrameInterval(48)
                ->addFormat($format)
                ->toDisk('public')
                ->save($manifestPath);

            $media->update(['hls_path' => $manifestPath]);
        } catch (\Throwable $e) {
            Log::warning('HLS transcoding failed, falling back to original video', [
                'media_id' => $media->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
