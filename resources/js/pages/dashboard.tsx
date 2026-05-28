import { Head, Link } from '@inertiajs/react';
import { ImagePlay, Library, Monitor, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import type { DashboardStats } from '@/types';

type RecentScreen = {
    id: number;
    name: string;
    location: string | null;
    status: 'online' | 'offline';
    last_seen_at: string | null;
    current_playlist: string | null;
};

type Props = {
    stats: DashboardStats;
    recentScreens: RecentScreen[];
};

export default function Dashboard({ stats, recentScreens }: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Stats grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
                            <Monitor className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_screens}</div>
                            <p className="text-muted-foreground text-xs">
                                {stats.online_screens} online
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Online Screens</CardTitle>
                            <Wifi className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.online_screens}</div>
                            <p className="text-muted-foreground text-xs">
                                {stats.total_screens - stats.online_screens} offline
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
                            <Library className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_media}</div>
                            <p className="text-muted-foreground text-xs">In media library</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Playlists</CardTitle>
                            <ImagePlay className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_playlists}</div>
                            <p className="text-muted-foreground text-xs">Total playlists</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent screens table */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Screen Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentScreens.length === 0 ? (
                            <div className="text-muted-foreground p-6 text-center text-sm">
                                No screens registered yet.{' '}
                                <Link href="/screens/create" className="text-primary underline">
                                    Register your first screen
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                                                Screen
                                            </th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                                                Status
                                            </th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                                                Current Playlist
                                            </th>
                                            <th className="text-muted-foreground px-4 py-3 text-left font-medium">
                                                Last Seen
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentScreens.map((screen) => (
                                            <tr key={screen.id} className="hover:bg-muted/50 border-b last:border-0">
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/screens/${screen.id}`}
                                                        className="hover:text-primary font-medium"
                                                    >
                                                        {screen.name}
                                                    </Link>
                                                    {screen.location && (
                                                        <div className="text-muted-foreground text-xs">
                                                            {screen.location}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={screen.status === 'online' ? 'default' : 'secondary'}
                                                        className={
                                                            screen.status === 'online'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : ''
                                                        }
                                                    >
                                                        {screen.status === 'online' ? (
                                                            <Wifi className="mr-1 h-3 w-3" />
                                                        ) : (
                                                            <WifiOff className="mr-1 h-3 w-3" />
                                                        )}
                                                        {screen.status}
                                                    </Badge>
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {screen.current_playlist ?? '—'}
                                                </td>
                                                <td className="text-muted-foreground px-4 py-3">
                                                    {screen.last_seen_at ?? 'Never'}
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

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
