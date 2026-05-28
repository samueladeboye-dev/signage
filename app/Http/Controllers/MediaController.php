<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessMediaJob;
use App\Models\Media;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Media::class);

        $query = Media::query()->orderBy('created_at', 'desc');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        $media = $query->paginate(24)->through(fn (Media $item) => [
            'id' => $item->id,
            'name' => $item->name,
            'type' => $item->type,
            'mime_type' => $item->mime_type,
            'size' => $item->size,
            'duration' => $item->duration,
            'status' => $item->status,
            'thumbnail_url' => $item->thumbnail_url,
            'url' => $item->isReady() ? $item->signed_url : null,
            'created_at' => $item->created_at->toISOString(),
        ]);

        return Inertia::render('media/index', [
            'media' => $media,
            'filters' => $request->only('type', 'status', 'search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Media::class);

        // Determine max size before validation: 500 MB for video, 50 MB for images
        $uploadedFile = $request->file('file');
        $mimeType = $uploadedFile?->getMimeType() ?? '';
        $isVideo = str_starts_with($mimeType, 'video/');
        $maxKb = $isVideo ? 512000 : 51200; // 500 MB : 50 MB

        $request->validate([
            'file' => ['required', 'file', "max:{$maxKb}", 'mimetypes:image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();
        $type = str_starts_with($mimeType, 'image/') ? 'image' : 'video';
        $extension = $file->getClientOriginalExtension();
        $path = 'media/'.Str::uuid().'.'.$extension;

        $storageDisk = config('filesystems.default');
        Storage::disk($storageDisk)->putFileAs('', $file, $path);

        $media = Media::create([
            'user_id' => $request->user()->id,
            'name' => $request->name ?: pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'original_name' => $file->getClientOriginalName(),
            'type' => $type,
            'disk' => $storageDisk,
            'path' => $path,
            'mime_type' => $mimeType,
            'size' => $file->getSize(),
            'status' => 'pending',
        ]);

        ProcessMediaJob::dispatch($media);

        return redirect()->route('media.index')->with('success', 'Media uploaded and queued for processing.');
    }

    public function show(Media $media): \Illuminate\Http\JsonResponse
    {
        $this->authorize('view', $media);

        return response()->json([
            'id' => $media->id,
            'name' => $media->name,
            'type' => $media->type,
            'url' => $media->signed_url,
            'thumbnail_url' => $media->thumbnail_url,
            'duration' => $media->duration,
            'width' => $media->width,
            'height' => $media->height,
            'size' => $media->size,
            'status' => $media->status,
        ]);
    }

    public function destroy(Media $media): RedirectResponse
    {
        $this->authorize('delete', $media);

        if ($media->path) {
            Storage::disk($media->disk)->delete($media->path);
        }

        if ($media->thumbnail_path) {
            Storage::disk($media->disk)->delete($media->thumbnail_path);
        }

        $media->delete();

        return redirect()->route('media.index')->with('success', 'Media deleted.');
    }
}
