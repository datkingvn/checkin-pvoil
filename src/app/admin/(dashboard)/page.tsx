import dbConnect from '@/lib/db';
import { Event, Attendee, Prize, Winner } from '@/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Calendar,
    CircleDot,
    Users,
    Trophy,
    PlusCircle,
    Gift,
    QrCode,
    Dices,
    AlertTriangle,
    Lightbulb,
} from 'lucide-react';

async function getStats() {
    await dbConnect();

    const [totalEvents, totalAttendees, totalPrizes, totalWinners] = await Promise.all([
        Event.countDocuments(),
        Attendee.countDocuments(),
        Prize.countDocuments(),
        Winner.countDocuments(),
    ]);

    const liveEvents = await Event.countDocuments({ status: 'live' });

    return { totalEvents, liveEvents, totalAttendees, totalPrizes, totalWinners };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    const statCards = [
        {
            title: 'Tổng sự kiện',
            value: stats.totalEvents,
            icon: Calendar,
            color: 'from-purple-500 to-pink-500',
            iconBg: 'bg-purple-500/20 text-purple-400',
        },
        {
            title: 'Sự kiện đang mở',
            value: stats.liveEvents,
            icon: CircleDot,
            color: 'from-green-500 to-emerald-500',
            iconBg: 'bg-green-500/20 text-green-400',
        },
        {
            title: 'Người check-in',
            value: stats.totalAttendees,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            iconBg: 'bg-blue-500/20 text-blue-400',
        },
        {
            title: 'Người thắng giải',
            value: stats.totalWinners,
            icon: Trophy,
            color: 'from-amber-500 to-orange-500',
            iconBg: 'bg-amber-500/20 text-amber-400',
        },
    ];

    const quickGuide = [
        { icon: PlusCircle, title: 'Tạo sự kiện mới', desc: 'Vào menu Sự kiện → Tạo mới → Đặt tên và lưu' },
        { icon: Gift, title: 'Thêm giải thưởng', desc: 'Vào chi tiết sự kiện → Tab Giải thưởng → Thêm giải' },
        { icon: QrCode, title: 'Mở check-in', desc: 'Đổi trạng thái sự kiện sang Live → Chia sẻ QR Code' },
        { icon: Dices, title: 'Quay thưởng', desc: 'Mở màn hình quay thưởng → Chọn giải → Bấm QUAY' },
    ];

    const notes = [
        { icon: AlertTriangle, text: 'Mỗi người chỉ có thể trúng thưởng 1 lần trong 1 sự kiện' },
        { icon: AlertTriangle, text: 'Không thể quay vượt quá số lượng giải đã cấu hình' },
        { icon: Lightbulb, text: 'Sử dụng màn hình /raffle/[eventCode] để chiếu lên màn hình lớn' },
        { icon: Lightbulb, text: 'Có thể export danh sách người thắng ra CSV' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-zinc-400 mt-1">Tổng quan hệ thống check-in và quay thưởng</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">
                                    {stat.title}
                                </CardTitle>
                                <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                                    <Icon size={20} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                    {stat.value.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Hướng dẫn nhanh</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-zinc-400">
                        {quickGuide.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="flex gap-3">
                                    <div className="rounded-lg bg-purple-500/20 p-2 h-fit shrink-0">
                                        <Icon size={20} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{item.title}</p>
                                        <p className="text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Lưu ý quan trọng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-zinc-400">
                        {notes.map((item, idx) => {
                            const Icon = item.icon;
                            const isAlert = Icon === AlertTriangle;
                            return (
                                <p key={idx} className="flex items-start gap-2">
                                    <Icon
                                        size={18}
                                        className={`shrink-0 mt-0.5 ${isAlert ? 'text-amber-400' : 'text-purple-400'}`}
                                    />
                                    <span>{item.text}</span>
                                </p>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
