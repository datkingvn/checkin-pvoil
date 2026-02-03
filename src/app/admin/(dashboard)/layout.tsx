import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect('/admin/login');
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900">
            <AdminSidebar />
            <main className="flex-1 p-8 ml-64 overflow-auto">
                {children}
            </main>
        </div>
    );
}
