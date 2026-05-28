import { Head, router, useForm } from '@inertiajs/react';
import { ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { PairingCodeDisplay } from '@/components/screens/pairing-code-display';
import { ScreenStatusBadge } from '@/components/screens/screen-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Heading from '@/components/heading';
import type { Screen, ScreenSchedule } from '@/types';

type Props = {
    screen: Screen & { schedules: ScreenSchedule[] };
    playlists: { id: number; name: string }[];
};

export default function ScreenShow({ screen, playlists }: Props) {
    const { data, setData, patch, processing } = useForm({
        current_playlist_id: screen.current_playlist?.id?.toString() ?? '',
    });

    const handleAssignPlaylist = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/screens/${screen.id}`, {
            data: {
                current_playlist_id: data.current_playlist_id || null,
            },
        });
    };

    const handleRefresh = () => {
        router.post(`/screens/${screen.id}/refresh`);
    };

    const handleDelete = () => {
        if (confirm(`Delete screen "${screen.name}"? This cannot be undone.`)) {
            router.delete(`/screens/${screen.id}`);
        }
    };

    const playerUrl = `/player/${screen.pairing_code}`;

    return (
        <>
            <Head title={screen.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Heading title={screen.name} description={screen.location ?? undefined} />
                        <div className="mt-2 flex items-center gap-2">
                            <ScreenStatusBadge status={screen.status} />
                            {screen.last_seen_at && (
                                <span className="text-muted-foreground text-sm">
                                    Last seen {screen.last_seen_at}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Remote Refresh
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a href={playerUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Player
                            </a>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Pairing info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pairing Code</CardTitle>
                            <CardDescription>
                                Enter this code on the screen device at{' '}
                                <code className="bg-muted rounded px-1 text-xs">{playerUrl}</code>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PairingCodeDisplay code={screen.pairing_code} />
                            <Separator className="my-4" />
                            <div className="text-muted-foreground space-y-1 text-sm">
                                <div>
                                    <strong>Full player URL:</strong>
                                </div>
                                <a
                                    href={playerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary break-all underline"
                                >
                                    {window.location.origin + playerUrl}
                                </a>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assign playlist */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assign Playlist</CardTitle>
                            <CardDescription>Select a playlist to display on this screen.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAssignPlaylist} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Playlist</Label>
                                    <Select
                                        value={data.current_playlist_id}
                                        onValueChange={(v) => { setData('current_playlist_id', v); }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="None — screen shows nothing" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {playlists.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" disabled={processing}>
                                    Save Assignment
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Schedules */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Schedules</CardTitle>
                            <CardDescription>
                                Time-based playlist assignments for this screen.{' '}
                                <a href="/schedules" className="text-primary underline">
                                    Manage all schedules →
                                </a>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {screen.schedules?.length === 0 ? (
                                <p className="text-muted-foreground p-6 text-sm">
                                    No schedules for this screen.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Playlist</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Starts</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Ends</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {screen.schedules?.map((s) => (
                                            <tr key={s.id} className="border-b last:border-0">
                                                <td className="px-4 py-3 font-medium">{s.playlist.name}</td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {s.starts_at
                                                        ? new Date(s.starts_at).toLocaleString()
                                                        : 'Immediately'}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {s.ends_at
                                                        ? new Date(s.ends_at).toLocaleString()
                                                        : 'Permanent'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {s.is_active ? (
                                                        <span className="text-green-600 text-xs font-medium">Yes</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">No</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

ScreenShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Screens', href: '/screens' },
        { title: 'Screen Detail', href: '#' },
    ],
};
