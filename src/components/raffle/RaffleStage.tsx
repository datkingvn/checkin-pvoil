'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import RollingNameReel from './RollingNameReel';
import WinnerReveal from './WinnerReveal';
import type { PrizeData, AttendeeData, WinnerData } from '@/types';

const SPIN_AUDIO_URL = '/sounds/nhac-xo-so.mp3';
const WIN_AUDIO_URL = '/sounds/2020-preview.mp3';

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
    const stateRef = useRef(state);
    
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        spinAudioRef.current = new Audio(SPIN_AUDIO_URL);
        spinAudioRef.current.loop = true;
        spinAudioRef.current.preload = 'auto'; // Optimize: Preload spin audio
        spinAudioRef.current.volume = 0.3;
        spinAudioRef.current.load(); // Force load

        winAudioRef.current = new Audio(WIN_AUDIO_URL);
        winAudioRef.current.preload = 'auto'; // Optimize: Preload win audio
        winAudioRef.current.volume = 0.6;
        winAudioRef.current.load(); // Force load

        return () => {
            spinAudioRef.current?.pause();
            winAudioRef.current?.pause();
        };
    }, []);

    // Get eligible attendees (not won yet, not excluded from raffle)
    const eligibleAttendees = attendees.filter((a) => !a.hasWon && !a.excludedFromRaffle);

    // Get selected prize
    const selectedPrize = prizes.find((p) => p._id === selectedPrizeId);


    // Auto-select first available prize or use server's selection
    useEffect(() => {
        if (!selectedPrizeId && prizes.length > 0) {
            const availablePrize = prizes.find((p) => p.quantityRemaining > 0);
            if (availablePrize) {
                // eslint-disable-next-line
                setSelectedPrizeId(availablePrize._id);
            }
        }
    }, [prizes, selectedPrizeId]);

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
        // eslint-disable-next-line
        fetchWinners();
    }, [fetchWinners]);

    // Sau mỗi lượt quay xong (state chuyển sang revealing/complete) mới cập nhật danh sách
    useEffect(() => {
        if (state !== 'revealing' && state !== 'complete') return;
        // eslint-disable-next-line
        fetchWinners();
    }, [state, fetchWinners]);

    // Persist selected prize when changing selection
    const handleSelectPrize = useCallback(
        async (prizeId: string) => {
            if (state !== 'idle') return;
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
        [eventId, state]
    );

    // Viewer: poll for new winners and sync spinning + revealing + selected prize

    const handleDraw = useCallback(async () => {
        if (!selectedPrizeId || state !== 'idle') return;

        setError(null);
        setState('spinning'); // UI updates immediately
        setCurrentWinner(null);
        setLockedReelCount(0);
        
        // Audio plays immediately, not waiting for server
        if (spinAudioRef.current) {
            spinAudioRef.current.currentTime = 0;
            spinAudioRef.current.play().catch(() => {});
        }

        try {
            const res = await fetch(`/api/admin/events/${eventId}/draw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prizeId: selectedPrizeId }),
            });

            const data = await res.json();

            if (!data.success) {
                // Stop audio if error occurs
                spinAudioRef.current?.pause();
                setState('idle');
                setError(data.error || 'Đã xảy ra lỗi');
                return;
            }
            
            // Note: Don't pause or replay audio here, just update winner
            setCurrentWinner(data.data.winner);
        } catch (err) {
            console.error('Draw error:', err);
            // Stop audio if network error occurs
            spinAudioRef.current?.pause();
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

    // Auto-return to idle after revealing (optional logic, kept simple)
    useEffect(() => {
        if (state !== 'revealing') return;
        const t = setTimeout(() => {
            // Chỉ tự động reset nếu user không tương tác gì? 
            // Ở đây giữ logic guest cũ: tự động reset sau 10s.
            // Nhưng vì giờ ai cũng là admin, có nút "Tiếp tục/Kết thúc", nên có thể bỏ hoặc giữ auto-reset như backup.
            // Để trải nghiệm tốt nhất cho người điều khiển, nên để họ tự bấm.
            // Tuy nhiên, logic cũ là sync state. Nếu polling phát hiện state khác thì sao?
            // Tạm thời bỏ auto-reset để người chủ trì quyết định flow.
        }, 10000);
        return () => clearTimeout(t);
    }, [state, onRefresh]);


    // Check if can draw
    const canDraw = state === 'idle' &&
        selectedPrize &&
        selectedPrize.quantityRemaining > 0 &&
        eligibleAttendees.length > 0;

    const totalWinners = attendees.length - eligibleAttendees.length;

    return (
        <div
            className="overflow-hidden text-white h-screen w-full"
            style={{
                backgroundImage: "url(/images/nen-quay.jpeg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Top bar */}
            {
                isAdmin && (
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
                )
            }
           

            {/* Main content */}
            <main className="relative z-10 h-full overflow-hidden">
                <section className="w-full h-full relative">
                    <div className="relative w-full h-full bg-transparent">
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <AnimatePresence mode="wait">
                                    {(state === 'idle' || state === 'spinning') && (
                                        <motion.div
                                            key="reel"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="w-full"
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
                                            className="w-full flex justify-center"
                                        >
                                            <WinnerReveal
                                                winner={currentWinner.snapshot}
                                                prizeName={currentWinner.prizeName || selectedPrize?.name || ''}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                                    <div className="absolute left-[5%] bottom-[10%] z-20 flex flex-col rounded-xl border border-amber-400/60 bg-black/40 px-6 py-4 text-amber-100 shadow-xl backdrop-blur-lg">
                                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80 mb-2">
                                            Giải đang quay
                                        </span>
                                        <div onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    value={selectedPrizeId}
                                                    onValueChange={(val) => {
                                                        if (state === 'idle') handleSelectPrize(val);
                                                    }}
                                                    disabled={state !== 'idle'}
                                                >
                                                    <SelectTrigger className="w-[320px] bg-sky-950/50 border-sky-700/50 text-amber-300 text-xl font-bold h-12 pr-4">
                                                        <SelectValue placeholder="Chọn giải thưởng" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-sky-950 border-sky-800 text-sky-100">
                                                        {prizes.map(p => (
                                                            <SelectItem 
                                                                key={p._id} 
                                                                value={p._id}
                                                                disabled={p.quantityRemaining <= 0}
                                                                className="text-base py-3 focus:bg-sky-900 focus:text-sky-50"
                                                            >
                                                                <div className="flex items-center justify-between w-full gap-4 min-w-[240px]">
                                                                    <span className="font-semibold">{p.name}</span>
                                                                    <span className={`text-sm ${p.quantityRemaining <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                                        ({p.quantityRemaining}/{p.quantityTotal})
                                                                    </span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                        </div>
                                    </div>

                            <div className="absolute right-[5%] bottom-[10%] z-20 flex flex-col rounded-xl border border-sky-800/60 bg-black/40 px-4 py-4 text-sky-100 shadow-xl backdrop-blur-lg w-[320px] max-h-[80%] overflow-hidden">
                                <h2 className="shrink-0 mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300 text-center">
                                    Danh sách trúng thưởng
                                </h2>
                                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                                    {state === 'spinning' ? (
                                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-sky-800/80 bg-slate-950/40 px-3 py-6 text-center text-xs text-sky-400">
                                            Đang quay số...
                                        </div>
                                    ) : recentWinners.length === 0 ? (
                                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-sky-800/80 bg-slate-950/40 px-3 py-6 text-center text-xs text-sky-400">
                                            Chưa có người trúng thưởng
                                        </div>
                                    ) : (
                                        recentWinners.map((w, idx) => (
                                            <motion.div
                                                key={w._id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 * idx }}
                                                className="rounded-lg bg-slate-950/70 px-3 py-2 border border-sky-900/30"
                                            >
                                                <p className="text-sm font-medium text-sky-50">
                                                    {w.snapshot.fullName}
                                                </p>
                                                <p className="text-xs text-sky-300 truncate">{w.prizeName}</p>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                    </div>

                    {/* Controls Overlay - Positioned absolute at bottom center of the SECTION */}
                    <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 z-30 w-full flex justify-center pointer-events-none">
                        <div className="pointer-events-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-2"
                            >
                                {error && (
                                    <p className="text-sm text-red-400 bg-black/80 px-4 py-2 rounded-lg border border-red-500/50 backdrop-blur-md mb-2">
                                        ⚠️ {error}
                                    </p>
                                )}

                                {state === 'idle' && (
                                    <Button
                                        onClick={handleDraw}
                                        disabled={!canDraw}
                                        size="lg"
                                        className="h-14 w-60 rounded-full bg-red-600 text-xl font-bold tracking-wider shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:bg-red-500 hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        QUAY SỐ
                                    </Button>
                                )}

                                {state === 'spinning' && (
                                    <Button disabled size="lg" className="h-14 w-60 rounded-full bg-slate-800/90 text-xl backdrop-blur-md border border-slate-700">
                                        <span className="mr-3 inline-block h-5 w-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
                                        ĐANG QUAY...
                                    </Button>
                                )}

                                {(state === 'revealing' || state === 'complete') && (
                                    <div className="flex gap-4">
                                        {selectedPrize && selectedPrize.quantityRemaining > 1 && (
                                            <Button
                                                onClick={handleContinue}
                                                size="lg"
                                                className="h-14 w-48 rounded-full bg-emerald-600 text-lg font-bold shadow-[0_0_30px_rgba(5,150,105,0.6)] hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(5,150,105,0.8)] hover:scale-105 transition-all"
                                            >
                                                QUAY TIẾP
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => {
                                                setState('idle');
                                                setCurrentWinner(null);
                                                onRefresh();
                                            }}
                                            size="lg"
                                            variant="outline"
                                            className="h-14 w-auto px-6 rounded-full border-sky-500/50 bg-sky-950/50 text-sky-200 hover:bg-sky-900/80"
                                        >
                                            KẾT THÚC
                                        </Button>
                                    </div>
                                )}

                                {!canDraw && state === 'idle' && (
                                    <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
                                        <p className="text-center text-xs text-sky-300 font-medium">
                                            {eligibleAttendees.length === 0
                                                ? 'HẾT NGƯỜI ĐỦ ĐIỀU KIỆN'
                                                : !selectedPrize
                                                    ? 'VUI LÒNG CHỌN GIẢI'
                                                    : selectedPrize.quantityRemaining <= 0
                                                        ? 'GIẢI NÀY ĐÃ HẾT'
                                                        : ''}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
