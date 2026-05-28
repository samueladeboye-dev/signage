import { Head, Link, router } from '@inertiajs/react';
import { ImagePlay, Monitor, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Heading from '@/components/heading';
import type { Playlist } from '@/types';

type Props = { playlists: Playlist[] };

export default function PlaylistsIndex({ playlists }: Props) {
    const handleDelete = (playlist: Playlist) => {
        if (confirm(`Delete playlist "${playlist.name}"?`)) {
            router.delete(`/playlists/${playlist.id}`);
        }
    };

    return (
        <>
            <Head title="Playlists" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading title="Playlists" description="Create and manage content playlists." />
                    <Button asChild>
                        <Link href="/playlists/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Playlist
                        </Link>
                    </Button>
                </div>

                {playlists.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-muted-foreground mb-4 text-sm">No playlists yet.</p>
                            <Button asChild>
                                <Link href="/playlists/create">Create your first playlist</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {playlists.map((playlist) => (
                            <Card key={playlist.id} className="group hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={`/playlists/${playlist.id}`}
                                                className="hover:text-primary truncate text-sm font-semibold"
                                            >
                                                {playlist.name}
                                            </Link>
                                            {playlist.description && (
                                                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                                                    {playlist.description}
                                                </p>
                                            )}
                                        </div>
                                        <ImagePlay className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                                    </div>

                                    <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs">
                                        <span>{playlist.items_count ?? 0} items</span>
                                        <span className="flex items-center gap-1">
                                            <Monitor className="h-3 w-3" />
                                            {playlist.screens_count ?? 0} screen{(playlist.screens_count ?? 0) !== 1 ? 's' : ''}
                                        </span>
                                        {playlist.is_looping && <span>Looping</span>}
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <Button variant="outline" size="sm" asChild className="flex-1">
                                            <Link href={`/playlists/${playlist.id}`}>Edit</Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => { handleDelete(playlist); }}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

PlaylistsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Playlists', href: '/playlists' },
    ],
};
