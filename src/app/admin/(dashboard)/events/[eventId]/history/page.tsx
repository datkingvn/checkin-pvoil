'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLoader from '@/components/admin/AdminLoader';
import { formatDate, formatTicketNumber } from '@/lib/helpers';
import type { PrizeData, WinnerData } from '@/types';

export default function HistoryPage() {
    const params = useParams();
    const eventId = params.eventId as string;

    const [winners, setWinners] = useState<WinnerData[]>([]);
    const [prizes, setPrizes] = useState<PrizeData[]>([]);
    const [selectedPrize, setSelectedPrize] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [winnersRes, prizesRes] = await Promise.all([
                    fetch(`/api/admin/events/${eventId}/draw`),
                    fetch(`/api/admin/events/${eventId}/prizes`),
                ]);

                const [winnersData, prizesData] = await Promise.all([
                    winnersRes.json(),
                    prizesRes.json(),
                ]);

                if (winnersData.success) setWinners(winnersData.data);
                if (prizesData.success) setPrizes(prizesData.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    const filteredWinners = selectedPrize === 'all'
        ? winners
        : winners.filter((w) => w.prizeId === selectedPrize);

    const handleExportCSV = () => {
        const headers = ['STT', 'Giải thưởng', 'Mã số', 'Họ tên', 'Phòng ban', 'Thời gian'];
        const rows = filteredWinners.map((w, idx) => [
            idx + 1,
            w.prizeName,
            formatTicketNumber(w.snapshot.ticketNumber),
            w.snapshot.fullName,
            w.snapshot.department,
            formatDate(w.wonAt),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `winners-${eventId}-${Date.now()}.csv`;
        link.click();
    };

    if (loading) {
        return <AdminLoader />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
                        <Link href="/admin/events" className="hover:text-zinc-300 transition-colors">
                            Sự kiện
                        </Link>
                        <ChevronRight size={16} className="shrink-0" />
                        <Link href={`/admin/events/${eventId}`} className="hover:text-zinc-300 transition-colors">
                            Chi tiết
                        </Link>
                        <ChevronRight size={16} className="shrink-0" />
                        <span className="text-zinc-400">Lịch sử quay thưởng</span>
                    </nav>
                    <h1 className="text-3xl font-bold">Lịch sử quay thưởng</h1>
                    <p className="text-zinc-400 mt-1">Danh sách người thắng giải</p>
                </div>
                <div className="flex gap-4">
                    <Select value={selectedPrize} onValueChange={setSelectedPrize}>
                        <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Lọc theo giải" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="all" className="text-white">Tất cả giải</SelectItem>
                            {prizes.map((p) => (
                                <SelectItem key={p._id} value={p._id} className="text-white">
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleExportCSV}
                        disabled={filteredWinners.length === 0}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                        <Download size={18} />
                        Export CSV
                    </Button>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">
                        Người thắng ({filteredWinners.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredWinners.length === 0 ? (
                        <div className="text-center py-16">
                            <Trophy className="mx-auto h-16 w-16 text-zinc-600 mb-4 opacity-50" />
                            <p className="text-zinc-400 font-medium">Chưa có ai trúng thưởng</p>
                            <p className="text-zinc-500 text-sm mt-1">Thực hiện quay thưởng để xem danh sách</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800">
                                    <TableHead className="text-zinc-400">STT</TableHead>
                                    <TableHead className="text-zinc-400">Giải thưởng</TableHead>
                                    <TableHead className="text-zinc-400">Mã số</TableHead>
                                    <TableHead className="text-zinc-400">Họ tên</TableHead>
                                    <TableHead className="text-zinc-400">Phòng ban</TableHead>
                                    <TableHead className="text-zinc-400">Thời gian</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredWinners.map((w, idx) => (
                                    <TableRow key={w._id} className="border-zinc-800">
                                        <TableCell className="text-zinc-400">{idx + 1}</TableCell>
                                        <TableCell className="text-purple-400 font-medium">{w.prizeName}</TableCell>
                                        <TableCell className="text-amber-400 font-mono">
                                            #{formatTicketNumber(w.snapshot.ticketNumber)}
                                        </TableCell>
                                        <TableCell className="text-white font-medium">{w.snapshot.fullName}</TableCell>
                                        <TableCell className="text-zinc-400">{w.snapshot.department}</TableCell>
                                        <TableCell className="text-zinc-400">{formatDate(w.wonAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
