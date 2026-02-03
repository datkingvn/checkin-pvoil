'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Presentation,
    Trophy,
    Loader2,
    Plus,
    Trash2,
    History,
    Users,
    Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import AdminLoader from '@/components/admin/AdminLoader';
import { formatDate, formatTicketNumber } from '@/lib/helpers';
import type { AttendeeData, PrizeData, WinnerData } from '@/types';

interface EventDetail {
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

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [attendees, setAttendees] = useState<AttendeeData[]>([]);
    const [prizes, setPrizes] = useState<PrizeData[]>([]);
    const [winners, setWinners] = useState<WinnerData[]>([]);
    const [loading, setLoading] = useState(true);

    // Prize dialog state
    const [isPrizeDialogOpen, setIsPrizeDialogOpen] = useState(false);
    const [newPrizeName, setNewPrizeName] = useState('');
    const [newPrizeQuantity, setNewPrizeQuantity] = useState(1);
    const [savingPrize, setSavingPrize] = useState(false);

    // Toggle excluded from raffle (per-attendee loading)
    const [patchingAttendeeId, setPatchingAttendeeId] = useState<string | null>(null);
    // Delete attendee loading
    const [deletingAttendeeId, setDeletingAttendeeId] = useState<string | null>(null);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}`);
            const data = await res.json();
            if (data.success) {
                setEvent(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
        }
    };

    const fetchAttendees = async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}/attendees`);
            const data = await res.json();
            if (data.success) {
                setAttendees(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendees:', error);
        }
    };

    const fetchPrizes = async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}/prizes`);
            const data = await res.json();
            if (data.success) {
                setPrizes(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch prizes:', error);
        }
    };

    const fetchWinners = async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}/draw`);
            const data = await res.json();
            if (data.success) {
                setWinners(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch winners:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchEvent(), fetchAttendees(), fetchPrizes(), fetchWinners()]);
            setLoading(false);
        };
        loadData();
    }, [eventId]);

    const winnerByAttendeeId = useMemo(() => {
        const map: Record<string, WinnerData> = {};
        winners.forEach((w) => {
            map[w.attendeeId] = w;
        });
        return map;
    }, [winners]);

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setEvent((prev) => prev ? { ...prev, status: newStatus as EventDetail['status'] } : null);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDeleteEvent = async () => {
        if (!confirm('Bạn có chắc muốn xóa sự kiện này? Tất cả dữ liệu sẽ bị mất.')) return;

        try {
            const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                router.push('/admin/events');
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    const handleToggleExcluded = async (attendeeId: string, currentExcluded: boolean) => {
        setPatchingAttendeeId(attendeeId);
        try {
            const res = await fetch(`/api/admin/events/${eventId}/attendees`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendeeId, excludedFromRaffle: !currentExcluded }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchAttendees();
            }
        } catch (error) {
            console.error('Failed to toggle excluded', error);
        } finally {
            setPatchingAttendeeId(null);
        }
    };

    const handleDeleteAttendee = async (attendeeId: string) => {
        if (!confirm('Bạn có chắc muốn xóa người tham dự này khỏi danh sách check-in?')) return;

        setDeletingAttendeeId(attendeeId);
        try {
            const res = await fetch(`/api/admin/events/${eventId}/attendees?attendeeId=${attendeeId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                await fetchAttendees();
                await fetchEvent();
            } else {
                alert(data.error || 'Xóa người tham dự không thành công');
            }
        } catch (error) {
            console.error('Failed to delete attendee', error);
        } finally {
            setDeletingAttendeeId(null);
        }
    };

    const handleAddPrize = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingPrize(true);

        try {
            const res = await fetch(`/api/admin/events/${eventId}/prizes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPrizeName, quantity: newPrizeQuantity }),
            });
            const data = await res.json();
            if (data.success) {
                setIsPrizeDialogOpen(false);
                setNewPrizeName('');
                setNewPrizeQuantity(1);
                fetchPrizes();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Failed to create prize:', error);
        } finally {
            setSavingPrize(false);
        }
    };

    const handleDeletePrize = async (prizeId: string) => {
        if (!confirm('Bạn có chắc muốn xóa giải này?')) return;

        try {
            const res = await fetch(`/api/admin/events/${eventId}/prizes/${prizeId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchPrizes();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Failed to delete prize:', error);
        }
    };

    if (loading || !event) {
        return <AdminLoader />;
    }

    const checkinUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/checkin/${event.code}`
        : `/checkin/${event.code}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{event.name}</h1>
                        <Badge className={`${statusColors[event.status]} text-white`}>
                            {statusLabels[event.status]}
                        </Badge>
                    </div>
                    <p className="text-zinc-400">
                        Mã: <code className="bg-zinc-800 px-2 py-0.5 rounded">{event.code}</code>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={event.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="draft">Nháp</SelectItem>
                            <SelectItem value="live">Đang mở</SelectItem>
                            <SelectItem value="ended">Kết thúc</SelectItem>
                        </SelectContent>
                    </Select>
                    <Link href={`/admin/events/${eventId}/history`}>
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 gap-2">
                            <History size={18} />
                            Lịch sử quay thưởng
                        </Button>
                    </Link>
                    <Link href={`/raffle/${event.code}`} target="_blank">
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 gap-2">
                            <Presentation size={18} />
                            Màn hình quay thưởng
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={handleDeleteEvent} className="gap-2">
                        <Trash2 size={18} />
                        Xóa
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6 text-center">
                        <Users className="mx-auto h-8 w-8 text-blue-400 mb-2" />
                        <p className="text-3xl font-bold text-blue-400">{event.stats.attendees}</p>
                        <p className="text-zinc-400 text-sm mt-1">Người check-in</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6 text-center">
                        <Gift className="mx-auto h-8 w-8 text-purple-400 mb-2" />
                        <p className="text-3xl font-bold text-purple-400">{event.stats.prizes}</p>
                        <p className="text-zinc-400 text-sm mt-1">Giải thưởng</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6 text-center">
                        <Trophy className="mx-auto h-8 w-8 text-amber-400 mb-2" />
                        <p className="text-3xl font-bold text-amber-400">{event.stats.winners}</p>
                        <p className="text-zinc-400 text-sm mt-1">Người thắng</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="qr" className="space-y-4">
                <TabsList className="bg-zinc-800">
                    <TabsTrigger value="qr" className="text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">QR Code</TabsTrigger>
                    <TabsTrigger value="attendees" className="text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                        Danh sách ({attendees.length})
                    </TabsTrigger>
                    <TabsTrigger value="prizes" className="text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
                        Giải thưởng ({prizes.length})
                    </TabsTrigger>
                </TabsList>

                {/* QR Tab */}
                <TabsContent value="qr">
                    <div className="max-w-sm">
                        <QRCodeGenerator url={checkinUrl} title={event.code} />
                    </div>
                </TabsContent>

                {/* Attendees Tab */}
                <TabsContent value="attendees">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Danh sách check-in</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {attendees.length === 0 ? (
                                <p className="text-zinc-400 text-center py-8">Chưa có ai check-in</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800">
                                            <TableHead className="text-zinc-400">#</TableHead>
                                            <TableHead className="text-zinc-400">Họ tên</TableHead>
                                            <TableHead className="text-zinc-400">Phòng ban</TableHead>
                                            <TableHead className="text-zinc-400">Số điện thoại</TableHead>
                                            <TableHead className="text-zinc-400">Thời gian</TableHead>
                                            <TableHead className="text-zinc-400">Trúng thưởng</TableHead>
                                            <TableHead className="text-zinc-400">Loại trừ</TableHead>
                                            <TableHead className="text-zinc-400">Xóa</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {attendees.map((a) => (
                                            <TableRow key={a._id} className="border-zinc-800">
                                                <TableCell className="text-white font-mono">
                                                    {formatTicketNumber(a.ticketNumber)}
                                                </TableCell>
                                                <TableCell className="text-white">{a.fullName}</TableCell>
                                                <TableCell className="text-zinc-400">{a.department}</TableCell>
                                                <TableCell className="text-zinc-400">{a.phoneNumber || '-'}</TableCell>
                                                <TableCell className="text-zinc-400">{formatDate(a.checkedInAt)}</TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const winner = winnerByAttendeeId[a._id];
                                                        if (winner) {
                                                            const prizeLabel =
                                                                winner.prizeName ||
                                                                prizes.find((p) => p._id === winner.prizeId)?.name ||
                                                                'Đã trúng';
                                                            return (
                                                                <Badge className="bg-amber-500 gap-1">
                                                                    <Trophy size={14} />
                                                                    {prizeLabel}
                                                                </Badge>
                                                            );
                                                        }

                                                        if (a.hasWon) {
                                                            return (
                                                                <Badge className="bg-amber-500 gap-1">
                                                                    <Trophy size={14} />
                                                                    Đã trúng
                                                                </Badge>
                                                            );
                                                        }

                                                        return <span className="text-zinc-500">-</span>;
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {a.hasWon ? (
                                                        <span className="text-zinc-500 text-sm">-</span>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={patchingAttendeeId === a._id}
                                                            onClick={() => handleToggleExcluded(a._id, !!a.excludedFromRaffle)}
                                                            className={
                                                                a.excludedFromRaffle
                                                                    ? 'border-amber-600 text-amber-400 hover:bg-amber-900/20'
                                                                    : 'border-zinc-600 text-zinc-400 hover:bg-zinc-800'
                                                            }
                                                            title={a.excludedFromRaffle ? 'Bỏ loại trừ (cho tham gia quay thưởng)' : 'Loại trừ khỏi quay thưởng'}
                                                        >
                                                            {patchingAttendeeId === a._id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : a.excludedFromRaffle ? (
                                                                'Bỏ loại trừ'
                                                            ) : (
                                                                'Loại trừ'
                                                            )}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={deletingAttendeeId === a._id}
                                                        onClick={() => handleDeleteAttendee(a._id)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 disabled:opacity-50"
                                                        title="Xóa khỏi danh sách check-in"
                                                    >
                                                        {deletingAttendeeId === a._id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Prizes Tab */}
                <TabsContent value="prizes">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Giải thưởng</CardTitle>
                            <Dialog open={isPrizeDialogOpen} onOpenChange={setIsPrizeDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                                        <Plus size={18} />
                                        Thêm giải
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-900 border-zinc-800">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Thêm giải thưởng</DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            Tạo giải thưởng mới cho sự kiện
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddPrize} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Tên giải *</Label>
                                            <Input
                                                value={newPrizeName}
                                                onChange={(e) => setNewPrizeName(e.target.value)}
                                                placeholder="Ví dụ: Giải Nhất"
                                                required
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-300">Số lượng *</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={newPrizeQuantity}
                                                onChange={(e) => setNewPrizeQuantity(parseInt(e.target.value) || 1)}
                                                required
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsPrizeDialogOpen(false)} className="border-zinc-700 text-zinc-300">
                                                Hủy
                                            </Button>
                                            <Button type="submit" disabled={savingPrize} className="bg-purple-600 hover:bg-purple-700 gap-2">
                                                {savingPrize ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        Đang lưu...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={18} />
                                                        Thêm giải
                                                    </>
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {prizes.length === 0 ? (
                                <p className="text-zinc-400 text-center py-8">Chưa có giải thưởng nào</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800">
                                            <TableHead className="text-zinc-400">Tên giải</TableHead>
                                            <TableHead className="text-zinc-400">Tổng</TableHead>
                                            <TableHead className="text-zinc-400">Còn lại</TableHead>
                                            <TableHead className="text-zinc-400">Đã phát</TableHead>
                                            <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {prizes.map((p) => (
                                            <TableRow key={p._id} className="border-zinc-800">
                                                <TableCell className="text-white font-medium">{p.name}</TableCell>
                                                <TableCell className="text-zinc-400">{p.quantityTotal}</TableCell>
                                                <TableCell className="text-green-400">{p.quantityRemaining}</TableCell>
                                                <TableCell className="text-amber-400">{p.quantityTotal - p.quantityRemaining}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeletePrize(p._id)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                        aria-label="Xóa giải"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
