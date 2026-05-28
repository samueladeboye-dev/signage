import { Head, Link, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { ScreenStatusBadge } from '@/components/screens/screen-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Heading from '@/components/heading';
import type { Screen } from '@/types';

type Props = {
    screens: Screen[];
};

export default function ScreensIndex({ screens }: Props) {
    const handleDelete = (screen: Screen) => {
        if (confirm(`Delete screen "${screen.name}"? This cannot be undone.`)) {
            router.delete(`/screens/${screen.id}`);
        }
    };

    return (
        <>
            <Head title="Screens" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <Heading title="Screens" description="Manage and monitor your display screens." />
                    <Button asChild>
                        <Link href="/screens/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Screen
                        </Link>
                    </Button>
                </div>

                {screens.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-muted-foreground mb-4 text-sm">No screens registered yet.</p>
                            <Button asChild>
                                <Link href="/screens/create">Register your first screen</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>All Screens ({screens.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Name</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Pairing Code</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Status</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Current Playlist</th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">Last Seen</th>
                                            <th className="text-muted-foreground px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {screens.map((screen) => (
                                            <tr key={screen.id} className="hover:bg-muted/50 border-b last:border-0">
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/screens/${screen.id}`}
                                                        className="hover:text-primary font-medium"
                                                    >
                                                        {screen.name}
                                                    </Link>
                                                    {screen.location && (
                                                        <div className="text-muted-foreground text-xs">{screen.location}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
                                                        {screen.pairing_code}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <ScreenStatusBadge status={screen.status} />
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {screen.current_playlist?.name ?? '—'}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {screen.last_seen_at ?? 'Never'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/screens/${screen.id}`}>View</Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => { handleDelete(screen); }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

ScreensIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Screens', href: '/screens' },
    ],
};
