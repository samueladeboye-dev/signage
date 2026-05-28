import { Head, router } from '@inertiajs/react';
import { Clock, Film, Image, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { MediaPreview } from '@/components/media/media-preview';
import { MediaUploader } from '@/components/media/media-uploader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import type { Media, MediaStatus, MediaType } from '@/types';

type PaginatedMedia = {
    data: Media[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    media: PaginatedMedia;
    filters: {
        type?: MediaType;
        status?: MediaStatus;
        search?: string;
    };
};

const statusColors: Record<MediaStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function MediaIndex({ media, filters }: Props) {
    const [preview, setPreview] = useState<Media | null>(null);

    const handleFilter = (key: string, value: string) => {
        router.get('/media', { ...filters, [key]: value === 'all' ? undefined : value }, { preserveState: true });
    };

    const handleDelete = (item: Media) => {
        if (confirm(`Delete "${item.name}"? This cannot be undone.`)) {
            router.delete(`/media/${item.id}`);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <>
            <Head title="Media Library" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title="Media Library" description="Upload and manage images and videos for your playlists." />

                {/* Upload zone */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MediaUploader />
                    </CardContent>
                </Card>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select
                        value={filters.type ?? 'all'}
                        onValueChange={(v) => { handleFilter('type', v); }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="image">Images</SelectItem>
                            <SelectItem value="video">Videos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(v) => { handleFilter('status', v); }}
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>

                    <span className="text-muted-foreground self-center text-sm">
                        {media.total} file{media.total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Media grid */}
                {media.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-muted-foreground text-sm">No media found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {media.data.map((item) => (
                            <div
                                key={item.id}
                                className="group relative overflow-hidden rounded-xl border bg-card"
                            >
                                {/* Thumbnail */}
                                <div
                                    className="relative aspect-video cursor-pointer overflow-hidden bg-black/5"
                                    onClick={() => { if (item.status === 'ready') { setPreview(item); } }}
                                >
                                    {item.thumbnail_url ? (
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.name}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            {item.status === 'processing' ? (
                                                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                                            ) : item.type === 'video' ? (
                                                <Film className="text-muted-foreground h-8 w-8" />
                                            ) : (
                                                <Image className="text-muted-foreground h-8 w-8" />
                                            )}
                                        </div>
                                    )}

                                    {/* Type badge */}
                                    <div className="absolute top-1.5 left-1.5">
                                        <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                                            {item.type === 'video' ? (
                                                <Film className="mr-1 h-2.5 w-2.5" />
                                            ) : (
                                                <Image className="mr-1 h-2.5 w-2.5" />
                                            )}
                                            {item.type}
                                        </Badge>
                                    </div>

                                    {/* Delete button */}
                                    <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-2">
                                    <p className="truncate text-xs font-medium" title={item.name}>
                                        {item.name}
                                    </p>
                                    <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                                        <span>{formatSize(item.size)}</span>
                                        {item.duration && (
                                            <span className="flex items-center gap-0.5">
                                                <Clock className="h-2.5 w-2.5" />
                                                {Math.round(item.duration)}s
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1">
                                        <Badge
                                            variant="secondary"
                                            className={`px-1.5 py-0.5 text-xs ${statusColors[item.status]}`}
                                        >
                                            {item.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {media.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {media.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => { if (link.url) { router.get(link.url); } }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Preview lightbox */}
            {preview && (
                <MediaPreview
                    media={preview}
                    onClose={() => { setPreview(null); }}
                />
            )}
        </>
    );
}

MediaIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media Library', href: '/media' },
    ],
};
