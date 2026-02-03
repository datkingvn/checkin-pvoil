'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, CalendarDays, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/events', label: 'Sự kiện', icon: CalendarDays },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-xl shadow-black/20">
            <div className="p-6 border-b border-zinc-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Event Check-in
                </h1>
                <p className="text-sm text-zinc-500 mt-1">Admin Panel</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-purple-500/20 text-white border-l-2 border-purple-500 -ml-[2px] pl-[18px]'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            )}
                        >
                            <Icon size={20} className="shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
                >
                    <LogOut size={20} className="shrink-0" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}
