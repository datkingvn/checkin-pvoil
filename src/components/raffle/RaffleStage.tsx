'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import RollingNameReel from './RollingNameReel';
import WinnerReveal from './WinnerReveal';
import type { PrizeData, AttendeeData, WinnerData } from '@/types';

// Âm thanh quay số & thắng giải
// File quay số được đặt trong public/sounds để tất cả client (kể cả guest) đều dùng chung.
const SPIN_AUDIO_URL = '/sounds/nhac-xo-so.mp3';
const WIN_AUDIO_URL =
  'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3';

type RaffleState = 'idle' | 'spinning' | 'revealing' | 'complete';

interface RaffleStageProps {
    eventId: string;
    eventName: string;
    prizes: PrizeData[];
    attendees: AttendeeData[];
    isAdmin: boolean;
    onRefresh: () => void;
}

export default function RaffleStage({
    eventId,
    eventName,
    prizes,
    attendees,
    isAdmin,
    onRefresh,
}: RaffleStageProps) {
    const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
    const [state, setState] = useState<RaffleState>('idle');
    const [currentWinner, setCurrentWinner] = useState<WinnerData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recentWinners, setRecentWinners] = useState<WinnerData[]>([]);
    const [lockedReelCount, setLockedReelCount] = useState(0);

    const spinAudioRef = useRef<HTMLAudioElement | null>(null);
    const winAudioRef = useRef<HTMLAudioElement | null>(null);
    const lastSeenWinnerIdRef = useRef<string | null>(null);
    const baselineEstablishedRef = useRef(false);
    const stateRef = useRef(state);
    stateRef.current = state;

    useEffect(() => {
        spinAudioRef.current = new Audio(SPIN_AUDIO_URL);
        spinAudioRef.current.loop = true;
        spinAudioRef.current.volume = 0.3;

        winAudioRef.current = new Audio(WIN_AUDIO_URL);
        winAudioRef.current.volume = 0.6;

        return () => {
            spinAudioRef.current?.pause();
            winAudioRef.current?.pause();
        };
    }, []);

    // Get eligible attendees (not won yet, not excluded from raffle)
    const eligibleAttendees = attendees.filter((a) => !a.hasWon && !a.excludedFromRaffle);

    // Get selected prize
    const selectedPrize = prizes.find((p) => p._id === selectedPrizeId);

    // Fallback: giải đang quay từ winner gần nhất (khi chưa chọn giải)
    const displayPrizeName = selectedPrize?.name ?? recentWinners[0]?.prizeName ?? null;

    // Auto-select first available prize (admin) or use server's selection
    useEffect(() => {
        if (!selectedPrizeId && prizes.length > 0) {
            const availablePrize = prizes.find((p) => p.quantityRemaining > 0);
            if (availablePrize && isAdmin) {
                setSelectedPrizeId(availablePrize._id);
                fetch(`/api/admin/events/${eventId}/draw`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prizeId: availablePrize._id }),
                }).catch((err) => console.error('Failed to persist prize selection:', err));
            }
        }
    }, [prizes, selectedPrizeId, isAdmin, eventId]);

    // Fetch recent winners + sync selected prize from server
    const fetchWinners = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}/draw`);
            const data = await res.json();
            if (data.success) {
                setRecentWinners(data.data.slice(0, 5));
                if (data.selectedPrizeId) {
                    setSelectedPrizeId(data.selectedPrizeId);
                }
            }
        } catch (err) {
            console.error('Failed to fetch winners:', err);
        }
    }, [eventId]);

    // Initial load: lấy lịch sử trúng thưởng hiện có
    useEffect(() => {
        fetchWinners();
    }, [fetchWinners]);

    // Sau mỗi lượt quay xong (state chuyển sang revealing/complete) mới cập nhật danh sách
    useEffect(() => {
        if (state !== 'revealing' && state !== 'complete') return;
        fetchWinners();
    }, [state, fetchWinners]);

    // Admin: persist selected prize when changing selection
    const handleSelectPrize = useCallback(
        async (prizeId: string) => {
            if (!isAdmin || state !== 'idle') return;
            setSelectedPrizeId(prizeId);
            try {
                await fetch(`/api/admin/events/${eventId}/draw`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prizeId }),
                });
            } catch (err) {
                console.error('Failed to persist prize selection:', err);
            }
        },
        [eventId, isAdmin, state]
    );

    // Viewer: poll for new winners and sync spinning + revealing + selected prize
    useEffect(() => {
        if (isAdmin) return;

        const poll = async () => {
            if (stateRef.current !== 'idle') return;
            try {
                const res = await fetch(`/api/admin/events/${eventId}/draw`);
                const data = await res.json();
                if (!data.success || !Array.isArray(data.data)) return;

                const list = data.data as WinnerData[];
                const newest = list[0];
                const newestId = newest?._id ?? null;

                if (!baselineEstablishedRef.current) {
                    lastSeenWinnerIdRef.current = newestId;
                    baselineEstablishedRef.current = true;
                    // Ưu tiên selectedPrizeId từ server (giải admin đang chọn)
                    if (data.selectedPrizeId) {
                        setSelectedPrizeId(data.selectedPrizeId);
                    } else if (newest?.prizeId) {
                        setSelectedPrizeId(newest.prizeId);
                    }
                    return;
                }

                // Sync selected prize từ server (giải admin đang chọn)
                if (data.selectedPrizeId) {
                    setSelectedPrizeId(data.selectedPrizeId);
                }

                if (newestId && newestId !== lastSeenWinnerIdRef.current) {
                    lastSeenWinnerIdRef.current = newestId;
                    setSelectedPrizeId(newest.prizeId);
                    setCurrentWinner(newest);
                    setLockedReelCount(0);
                    setState('spinning');
                    if (spinAudioRef.current) {
                        spinAudioRef.current.currentTime = 0;
                        spinAudioRef.current.play().catch(() => {});
                    }
                }
            } catch (err) {
                console.error('Viewer poll error:', err);
            }
        };

        const interval = setInterval(poll, 2500);
        return () => clearInterval(interval);
    }, [eventId, isAdmin]);

    const handleDraw = useCallback(async () => {
        if (!selectedPrizeId || state !== 'idle') return;

        setError(null);
        setState('spinning');
        setCurrentWinner(null);
        setLockedReelCount(0);

        try {
            const res = await fetch(`/api/admin/events/${eventId}/draw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prizeId: selectedPrizeId }),
            });

            const data = await res.json();

            if (!data.success) {
                setState('idle');
                setError(data.error || 'Đã xảy ra lỗi');
                return;
            }

            if (spinAudioRef.current) {
                spinAudioRef.current.currentTime = 0;
                spinAudioRef.current.play().catch(() => {});
            }

            setCurrentWinner(data.data.winner);
        } catch (err) {
            console.error('Draw error:', err);
            setState('idle');
            setError('Không thể kết nối đến server');
        }
    }, [selectedPrizeId, state, eventId]);

    const handleSpinComplete = useCallback(() => {
        spinAudioRef.current?.pause();
        setState('revealing');
        if (winAudioRef.current) {
            winAudioRef.current.currentTime = 0;
            winAudioRef.current.play().catch(() => {});
        }
        onRefresh();
    }, [onRefresh]);

    const handleContinue = useCallback(() => {
        setState('idle');
        setCurrentWinner(null);
        onRefresh();
    }, [onRefresh]);

    // Viewer: auto-return to idle after revealing so next draw can sync
    useEffect(() => {
        if (isAdmin || state !== 'revealing') return;
        const t = setTimeout(() => {
            setState('idle');
            setCurrentWinner(null);
            onRefresh();
        }, 10000);
        return () => clearTimeout(t);
    }, [isAdmin, state, onRefresh]);


    // Check if can draw
    const canDraw = isAdmin &&
        state === 'idle' &&
        selectedPrize &&
        selectedPrize.quantityRemaining > 0 &&
        eligibleAttendees.length > 0;

    const totalWinners = attendees.length - eligibleAttendees.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-950 via-slate-950 to-sky-900 text-white flex flex-col">
            {/* Top bar */}
            <header className="relative z-10 border-b border-sky-800 bg-gradient-to-r from-sky-950/95 via-sky-900/95 to-blue-900/95 backdrop-blur">
                <div className="max-w-7xl mx-auto flex flex-col gap-4 px-8 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-[10px] font-bold tracking-[0.18em]">
                            PVOIL
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-sky-300">PVOIL VŨNG ÁNG</p>
                            <p className="text-sm font-semibold md:text-base">{eventName}</p>
                        </div>
                    </div>

                    <p className="text-center text-xs text-sky-100/80 md:flex-1 md:px-6 md:text-sm">
                        CHƯƠNG TRÌNH QUAY SỐ TRÚNG THƯỞNG
                    </p>

                    {isAdmin && (
                    <div className="flex items-center justify-center gap-5 text-xs md:text-sm">
                        <div className="text-center">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-400">Người tham dự</p>
                            <p className="mt-1 text-lg font-semibold text-sky-100">{attendees.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-400">Đủ điều kiện</p>
                            <p className="mt-1 text-lg font-semibold text-emerald-300">{eligibleAttendees.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-sky-400">Đã trúng</p>
                            <p className="mt-1 text-lg font-semibold text-amber-300">{totalWinners}</p>
                        </div>
                    </div>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-1">
                <div className="mx-auto flex h-full max-w-7xl flex-col px-8 py-10">
                    <div className={`grid flex-1 gap-8 ${isAdmin ? 'md:min-w-[1100px] md:grid-cols-[280px_minmax(0,1fr)_280px]' : ''}`}>
                        {/* Left column: prizes - only for admin */}
                        {isAdmin && (
                        <section className="rounded-2xl border border-sky-800 bg-sky-950/60 p-4 shadow-lg">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                                Cơ cấu giải thưởng
                            </h2>
                            <div className="space-y-2">
                                {prizes.map((p) => {
                                    const isSelected = selectedPrize && selectedPrize._id === p._id;
                                    const isExhausted = p.quantityRemaining <= 0;

                                    return (
                                        <button
                                            key={p._id}
                                            type="button"
                                            onClick={() => {
                                                if (!isAdmin || state !== 'idle' || isExhausted) return;
                                                handleSelectPrize(p._id);
                                            }}
                                            disabled={isExhausted || !isAdmin}
                                            className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/40'
                                                    : 'bg-slate-950/60 text-slate-100 hover:bg-slate-900/80 disabled:opacity-40'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold">{p.name}</span>
                                                <span className="text-xs font-medium">
                                                    {p.quantityRemaining}/{p.quantityTotal}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                        )}

                        {/* Center column: draw screen */}
                        <section className="space-y-6">
                            <div 
                                className="relative overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-40"
                                style={{
                                    backgroundImage: 'url(/images/nen-quay.jpeg)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-black/20" />
                                {displayPrizeName && (
                                    <div className="absolute left-6 top-6 z-20 flex flex-col rounded-xl border border-amber-400/60 bg-black/40 px-4 py-3 text-amber-100 shadow-[0_10px_25px_rgba(15,23,42,0.35)] backdrop-blur-lg sm:left-8 sm:top-8">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                                            Giải đang quay
                                        </span>
                                        <span className="mt-1 text-lg font-bold uppercase tracking-wide">
                                            {displayPrizeName}
                                        </span>
                                    </div>
                                )}
                                <div className="relative z-10">
                                <AnimatePresence mode="wait">
                                    {(state === 'idle' || state === 'spinning') && (
                                        <motion.div
                                            key="reel"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center gap-6"
                                        >
                                            <RollingNameReel
                                                participants={eligibleAttendees}
                                                winner={currentWinner?.snapshot || null}
                                                isSpinning={state === 'spinning'}
                                                onComplete={handleSpinComplete}
                                                onReelLocked={setLockedReelCount}
                                            />
                                        </motion.div>
                                    )}

                                    {(state === 'revealing' || state === 'complete') && currentWinner && (
                                        <motion.div
                                            key="reveal"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <WinnerReveal
                                                winner={currentWinner.snapshot}
                                                prizeName={currentWinner.prizeName || selectedPrize?.name || ''}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-3 pt-2"
                            >
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm text-red-400"
                                    >
                                        ⚠️ {error}
                                    </motion.p>
                                )}

                                {isAdmin && state === 'idle' && (
                                    <Button
                                        onClick={handleDraw}
                                        disabled={!canDraw}
                                        size="lg"
                                        className="h-16 w-full max-w-md rounded-full bg-red-600 text-2xl font-semibold tracking-wide shadow-[0_0_24px_rgba(248,113,113,0.65)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        BẮT ĐẦU QUAY
                                    </Button>
                                )}

                                {state === 'spinning' && (
                                    <Button
                                        disabled
                                        size="lg"
                                        className="h-16 w-full max-w-md rounded-full bg-slate-800 text-2xl font-semibold"
                                    >
                                        <span className="mr-3 inline-block h-6 w-6 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
                                        Đang quay...
                                    </Button>
                                )}

                                {(state === 'revealing' || state === 'complete') && isAdmin && (
                                    <Button
                                        onClick={handleContinue}
                                        size="lg"
                                        className="h-14 w-full max-w-xs rounded-full bg-emerald-600 text-lg font-semibold hover:bg-emerald-500"
                                    >
                                        {selectedPrize && selectedPrize.quantityRemaining > 1
                                            ? 'Quay tiếp'
                                            : 'Hoàn thành'}
                                    </Button>
                                )}

                                {!canDraw && state === 'idle' && isAdmin && (
                                    <p className="text-center text-xs text-sky-300">
                                        {eligibleAttendees.length === 0
                                            ? 'Không còn người đủ điều kiện'
                                            : !selectedPrize
                                                ? 'Vui lòng chọn giải thưởng ở cột bên trái'
                                                : selectedPrize.quantityRemaining <= 0
                                                    ? 'Giải thưởng này đã hết'
                                                    : ''}
                                    </p>
                                )}
                            </motion.div>
                        </section>

                        {/* Right column: recent winners - only for admin */}
                        {isAdmin && (
                        <section className="flex flex-col rounded-2xl border border-sky-800 bg-sky-950/60 p-4">
                            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                                Danh sách trúng thưởng
                            </h2>
                            {state === 'spinning' ? (
                                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-sky-800/80 bg-slate-950/40 px-3 py-6 text-center text-xs text-sky-400">
                                    Đang quay số, kết quả sẽ hiển thị sau khi quay xong.
                                </div>
                            ) : recentWinners.length === 0 ? (
                                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-sky-800/80 bg-slate-950/40 px-3 py-6 text-center text-xs text-sky-400">
                                    Chưa có người trúng thưởng
                                </div>
                            ) : (
                                <div className="space-y-3 overflow-y-auto pr-1">
                                    {recentWinners.map((w, idx) => (
                                        <motion.div
                                            key={w._id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * idx }}
                                            className="rounded-xl bg-slate-950/70 px-3 py-2"
                                        >
                                            <p className="text-sm font-medium text-sky-50">
                                                {w.snapshot.fullName}
                                            </p>
                                            <p className="text-xs text-sky-300">{w.prizeName}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </section>
                        )}
                    </div>

                    {/* Recent winners section below - only for guest */}
                    {!isAdmin && (
                    <section className="mt-8 flex flex-col rounded-2xl border border-sky-800 bg-sky-950/60 p-4">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                            Danh sách trúng thưởng
                        </h2>
                        {state === 'spinning' ? (
                            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-sky-800/80 bg-slate-950/40 px-3 py-6 text-center text-xs text-sky-400">
                                Đang quay số, kết quả sẽ hiển thị sau khi quay xong.
                            </div>
                        ) : recentWinners.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-sky-800/80 bg-slate-950/40 px-3 py-6 text-center text-xs text-sky-400">
                                Chưa có người trúng thưởng
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {recentWinners.map((w, idx) => (
                                    <motion.div
                                        key={w._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        className="rounded-xl bg-slate-950/70 px-3 py-2"
                                    >
                                        <p className="text-sm font-medium text-sky-50">
                                            {w.snapshot.fullName}
                                        </p>
                                        <p className="text-xs text-sky-300">{w.prizeName}</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </section>
                    )}
                </div>
            </main>
        </div>
    );
}
