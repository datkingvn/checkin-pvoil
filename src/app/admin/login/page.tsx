'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Email hoặc mật khẩu không đúng');
            } else {
                router.push('/admin');
                router.refresh();
            }
        } catch {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-md border border-zinc-800 shadow-2xl shadow-black/40 bg-zinc-900/95 backdrop-blur-xl">
                    <CardHeader className="space-y-1 pb-6">
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                            <Lock className="h-6 w-6 text-purple-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center text-white">
                            Admin Login
                        </CardTitle>
                        <CardDescription className="text-center text-zinc-400">
                            Đăng nhập để quản lý sự kiện
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300">Mật khẩu</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 text-lg font-semibold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        Đăng nhập
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
