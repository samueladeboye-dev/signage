import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import type { ScreenSchedule } from '@/types';

type Screen = { id: number; name: string; location: string | null };
type Playlist = { id: number; name: string };

type Props = {
    schedules: ScreenSchedule[];
    screens: Screen[];
    playlists: Playlist[];
};

export default function SchedulesIndex({ schedules, screens, playlists }: Props) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        screen_id: '',
        playlist_id: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/schedules', {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    };

    const handleDelete = (schedule: ScreenSchedule) => {
        if (confirm('Delete this schedule?')) {
            router.delete(`/schedules/${schedule.id}`);
        }
    };

    const handleToggleActive = (schedule: ScreenSchedule) => {
        router.patch(`/schedules/${schedule.id}`, {
            screen_id: schedule.screen?.id,
            playlist_id: schedule.playlist.id,
            is_active: !schedule.is_active,
        });
    };

    return (
        <>
            <Head title="Schedules" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Schedules"
                        description="Schedule playlists to play on specific screens at specific times."
                    />
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Schedule
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Schedule</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Screen *</Label>
                                    <Select
                                        value={data.screen_id}
                                        onValueChange={(v) => { setData('screen_id', v); }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a screen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {screens.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {s.name}
                                                    {s.location && ` — ${s.location}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.screen_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Playlist *</Label>
                                    <Select
                                        value={data.playlist_id}
                                        onValueChange={(v) => { setData('playlist_id', v); }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a playlist" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {playlists.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.playlist_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Starts At</Label>
                                    <Input
                                        type="datetime-local"
                                        value={data.starts_at}
                                        onChange={(e) => { setData('starts_at', e.target.value); }}
                                    />
                                    <p className="text-muted-foreground text-xs">Leave blank to start immediately.</p>
                                    <InputError message={errors.starts_at} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Ends At</Label>
                                    <Input
                                        type="datetime-local"
                                        value={data.ends_at}
                                        onChange={(e) => { setData('ends_at', e.target.value); }}
                                    />
                                    <p className="text-muted-foreground text-xs">Leave blank for a permanent schedule.</p>
                                    <InputError message={errors.ends_at} />
                                </div>

                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Schedule'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Schedules ({schedules.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {schedules.length === 0 ? (
                            <div className="text-muted-foreground p-6 text-center text-sm">
                                No schedules yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Screen</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Playlist</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Starts</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Ends</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Status</th>
                                            <th className="text-muted-foreground px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedules.map((s) => (
                                            <tr key={s.id} className="hover:bg-muted/50 border-b last:border-0">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{s.screen?.name}</div>
                                                    {s.screen?.location && (
                                                        <div className="text-muted-foreground text-xs">{s.screen.location}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{s.playlist.name}</td>
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
                                                    <Badge
                                                        variant={s.is_active ? 'default' : 'secondary'}
                                                        className={
                                                            s.is_active
                                                                ? 'cursor-pointer bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'cursor-pointer'
                                                        }
                                                        onClick={() => { handleToggleActive(s); }}
                                                    >
                                                        {s.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive h-8 w-8"
                                                        onClick={() => { handleDelete(s); }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SchedulesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Schedules', href: '/schedules' },
    ],
};
