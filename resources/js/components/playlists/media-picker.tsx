import { router } from '@inertiajs/react';
import { Film, Image, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Playlist } from '@/types';

type AvailableMedia = {
    id: number;
    name: string;
    type: 'image' | 'video';
    duration: number | null;
    thumbnail_url: string | null;
    size: number;
};

type Props = {
    playlist: Playlist;
    availableMedia: AvailableMedia[];
};

export function MediaPicker({ playlist, availableMedia }: Props) {
    const [search, setSearch] = useState('');
    const [adding, setAdding] = useState<number | null>(null);

    const filtered = availableMedia.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()),
    );

    const handleAdd = (mediaId: number) => {
        setAdding(mediaId);
        router.post(
            `/playlists/${playlist.id}/items`,
            { media_id: mediaId },
            {
                preserveScroll: true,
                onFinish: () => { setAdding(null); },
            },
        );
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                    placeholder="Search media..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); }}
                    className="pl-9"
                />
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <p className="text-muted-foreground p-4 text-center text-sm">No media found.</p>
                ) : (
                    filtered.map((media) => (
                        <div
                            key={media.id}
                            className={cn(
                                'hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-2 transition-colors',
                            )}
                        >
                            {/* Thumbnail */}
                            <div className="h-9 w-14 flex-shrink-0 overflow-hidden rounded bg-black/5">
                                {media.thumbnail_url ? (
                                    <img
                                        src={media.thumbnail_url}
                                        alt={media.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        {media.type === 'video' ? (
                                            <Film className="text-muted-foreground h-3.5 w-3.5" />
                                        ) : (
                                            <Image className="text-muted-foreground h-3.5 w-3.5" />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{media.name}</p>
                                <p className="text-muted-foreground text-xs capitalize">
                                    {media.type}
                                    {media.duration && ` · ${Math.round(media.duration)}s`}
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { handleAdd(media.id); }}
                                disabled={adding === media.id}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
