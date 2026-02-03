'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, CalendarX2, Calendar, Users, Gift, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AdminLoader from '@/components/admin/AdminLoader';
import { formatDate } from '@/lib/helpers';

interface EventWithStats {
    _id: string;
    code: string;
    name: string;
    status: 'draft' | 'live' | 'ended';
    createdAt: string;
    stats: {
        attendees: number;
        prizes: number;
        winners: number;
    };
}

const statusColors = {
    draft: 'bg-zinc-500',
    live: 'bg-green-500',
    ended: 'bg-red-500',
};

const statusLabels = {
    draft: 'Nháp',
    live: 'Đang mở',
    ended: 'Kết thúc',
};

export default function EventsListPage() {
    const [events, setEvents] = useState<EventWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newEventName, setNewEventName] = useState('');
    const [newEventCode, setNewEventCode] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/admin/events');
            const data = await res.json();
            if (data.success) {
                setEvents(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const res = await fetch('/api/admin/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newEventName,
                    code: newEventCode || undefined,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setIsDialogOpen(false);
                setNewEventName('');
                setNewEventCode('');
                fetchEvents();
            } else {
                alert(data.error || 'Failed to create event');
            }
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <AdminLoader />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Quản lý Sự kiện</h1>
                    <p className="text-zinc-400 mt-1">Tạo và quản lý các sự kiện check-in</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                            <Plus size={18} />
                            Tạo sự kiện mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white">Tạo sự kiện mới</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Tạo sự kiện mới để bắt đầu nhận check-in
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300">Tên sự kiện *</Label>
                                <Input
                                    id="name"
                                    value={newEventName}
                                    onChange={(e) => setNewEventName(e.target.value)}
                                    placeholder="Ví dụ: Tiệc Tất niên 2026"
                                    required
                                    minLength={2}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-zinc-300">Mã sự kiện (tùy chọn)</Label>
                                <Input
                                    id="code"
                                    value={newEventCode}
                                    onChange={(e) => setNewEventCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    placeholder="Ví dụ: yearend-2026"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                                <p className="text-xs text-zinc-500">Để trống sẽ tự động tạo mã ngẫu nhiên</p>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="border-zinc-700 text-zinc-300"
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={creating} className="bg-purple-600 hover:bg-purple-700 gap-2">
                                    {creating ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            Tạo sự kiện
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {events.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-16 text-center">
                        <CalendarX2 className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
                        <p className="text-zinc-400 text-lg font-medium">Chưa có sự kiện nào</p>
                        <p className="text-zinc-500 mt-2">Bấm nút &quot;Tạo sự kiện mới&quot; để bắt đầu</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {events.map((event) => (
                        <Link key={event._id} href={`/admin/events/${event._id}`}>
                            <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-white text-xl">{event.name}</CardTitle>
                                        <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                                            <Calendar size={14} className="shrink-0" />
                                            Mã: <code className="bg-zinc-800 px-2 py-0.5 rounded">{event.code}</code>
                                            <span className="mx-1">•</span>
                                            Tạo: {formatDate(event.createdAt)}
                                        </p>
                                    </div>
                                    <Badge className={`${statusColors[event.status]} text-white`}>
                                        {statusLabels[event.status]}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-8 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={16} className="text-zinc-500 shrink-0" />
                                            <span className="text-zinc-500">Người check-in:</span>
                                            <span className="text-white font-medium">{event.stats.attendees}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Gift size={16} className="text-zinc-500 shrink-0" />
                                            <span className="text-zinc-500">Giải thưởng:</span>
                                            <span className="text-white font-medium">{event.stats.prizes}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Trophy size={16} className="text-zinc-500 shrink-0" />
                                            <span className="text-zinc-500">Đã trúng:</span>
                                            <span className="text-white font-medium">{event.stats.winners}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
