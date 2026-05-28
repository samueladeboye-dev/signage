import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Heading from '@/components/heading';

type FormData = {
    name: string;
    description: string;
    is_looping: boolean;
    default_image_duration: number;
};

export default function PlaylistCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        description: '',
        is_looping: true,
        default_image_duration: 10,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/playlists');
    };

    return (
        <>
            <Head title="New Playlist" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title="New Playlist" description="Create a playlist to organise your media content." />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Playlist Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => { setData('name', e.target.value); }}
                                    placeholder="e.g. Campus News Reel"
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => { setData('description', e.target.value); }}
                                    placeholder="Optional description..."
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="default_image_duration">
                                    Default Image Duration (seconds)
                                </Label>
                                <Input
                                    id="default_image_duration"
                                    type="number"
                                    min="1"
                                    max="3600"
                                    value={data.default_image_duration}
                                    onChange={(e) => {
                                        setData('default_image_duration', parseInt(e.target.value) || 10);
                                    }}
                                />
                                <p className="text-muted-foreground text-xs">
                                    How long each image shows before advancing. Can be overridden per item.
                                </p>
                                <InputError message={errors.default_image_duration} />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    id="is_looping"
                                    type="checkbox"
                                    checked={data.is_looping}
                                    onChange={(e) => { setData('is_looping', e.target.checked); }}
                                    className="h-4 w-4 rounded border"
                                />
                                <Label htmlFor="is_looping" className="cursor-pointer">
                                    Loop playlist (repeat from beginning when finished)
                                </Label>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Playlist'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => { window.history.back(); }}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PlaylistCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Playlists', href: '/playlists' },
        { title: 'New Playlist', href: '/playlists/create' },
    ],
};
