import { Head, useForm } from '@inertiajs/react';
import { Monitor, Smartphone } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Heading from '@/components/heading';
import type { Orientation } from '@/types';

type FormData = {
    name: string;
    location: string;
    description: string;
    timezone: string;
    orientation: Orientation;
};

export default function ScreenCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        location: '',
        description: '',
        timezone: 'Africa/Lagos',
        orientation: 'landscape',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/screens');
    };

    return (
        <>
            <Head title="Register Screen" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title="Register Screen" description="Add a new display screen to your signage network." />

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Screen Details</CardTitle>
                        <CardDescription>
                            After registering, you'll receive a pairing code to enter on the screen device.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Screen Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => { setData('name', e.target.value); }}
                                    placeholder="e.g. Main Hall Display"
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) => { setData('location', e.target.value); }}
                                    placeholder="e.g. Building A, Ground Floor"
                                />
                                <InputError message={errors.location} />
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
                                <Label htmlFor="timezone">Timezone</Label>
                                <Input
                                    id="timezone"
                                    value={data.timezone}
                                    onChange={(e) => { setData('timezone', e.target.value); }}
                                    placeholder="Africa/Lagos"
                                />
                                <InputError message={errors.timezone} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Screen Orientation</Label>
                                <p className="text-muted-foreground text-xs">How is this screen physically mounted?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setData('orientation', 'landscape'); }}
                                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${data.orientation === 'landscape' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                                    >
                                        <Monitor className={`h-8 w-8 ${data.orientation === 'landscape' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <div className="text-center">
                                            <p className="text-sm font-medium">Landscape</p>
                                            <p className="text-muted-foreground text-xs">16:9 — horizontal</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setData('orientation', 'portrait'); }}
                                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${data.orientation === 'portrait' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                                    >
                                        <Smartphone className={`h-8 w-8 ${data.orientation === 'portrait' ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <div className="text-center">
                                            <p className="text-sm font-medium">Portrait</p>
                                            <p className="text-muted-foreground text-xs">9:16 — vertical</p>
                                        </div>
                                    </button>
                                </div>
                                <InputError message={errors.orientation} />
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Registering...' : 'Register Screen'}
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

ScreenCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Screens', href: '/screens' },
        { title: 'Register', href: '/screens/create' },
    ],
};
