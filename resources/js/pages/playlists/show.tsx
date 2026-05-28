import { Head, useForm } from '@inertiajs/react';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { MediaPicker } from '@/components/playlists/media-picker';
import { PlaylistItemsSortable } from '@/components/playlists/playlist-items-sortable';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Heading from '@/components/heading';
import type { Playlist, PlaylistItem } from '@/types';

type AvailableMedia = {
    id: number;
    name: string;
    type: 'image' | 'video';
    duration: number | null;
    thumbnail_url: string | null;
    size: number;
};

type Props = {
    playlist: Playlist & { items: PlaylistItem[] };
    availableMedia: AvailableMedia[];
};

export default function PlaylistShow({ playlist, availableMedia }: Props) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        name: playlist.name,
        description: playlist.description ?? '',
        is_looping: playlist.is_looping,
        default_image_duration: playlist.default_image_duration,
    });

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/playlists/${playlist.id}`, {
            onSuccess: () => { setSettingsOpen(false); },
        });
    };

    return (
        <>
            <Head title={playlist.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        title={playlist.name}
                        description={`${playlist.items?.length ?? 0} items · ${playlist.is_looping ? 'Looping' : 'No loop'} · ${playlist.default_image_duration}s default`}
                    />
                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings2 className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Playlist Settings</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSaveSettings} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => { setData('name', e.target.value); }}
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={data.description}
                                        onChange={(e) => { setData('description', e.target.value); }}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Default Image Duration (seconds)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="3600"
                                        value={data.default_image_duration}
                                        onChange={(e) => {
                                            setData('default_image_duration', parseInt(e.target.value) || 10);
                                        }}
                                    />
                                    <InputError message={errors.default_image_duration} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="is_looping"
                                        type="checkbox"
                                        checked={data.is_looping}
                                        onChange={(e) => { setData('is_looping', e.target.checked); }}
                                    />
                                    <Label htmlFor="is_looping">Loop playlist</Label>
                                </div>
                                <Button type="submit" disabled={processing}>
                                    Save Settings
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Playlist items */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Playlist Items</CardTitle>
                                <CardDescription>Drag to reorder. Click the clock icon to set custom duration for images.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PlaylistItemsSortable
                                    playlistId={playlist.id}
                                    items={playlist.items ?? []}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Media picker */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Media</CardTitle>
                                <CardDescription>Pick from the media library to add to this playlist.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MediaPicker playlist={playlist} availableMedia={availableMedia} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

PlaylistShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Playlists', href: '/playlists' },
        { title: 'Edit Playlist', href: '#' },
    ],
};
