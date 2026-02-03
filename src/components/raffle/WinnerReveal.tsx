'use client';

import { motion } from 'framer-motion';
import { formatTicketNumber } from '@/lib/helpers';

interface Winner {
    fullName: string;
    department: string;
    ticketNumber: number;
}

interface WinnerRevealProps {
    winner: Winner;
    prizeName: string;
}

export default function WinnerReveal({ winner, prizeName }: WinnerRevealProps) {
    return (
        <div className="relative">
            {/* Spotlight effect */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 -z-10"
            >
                <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
                    <motion.div
                        animate={{
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                        className="w-full h-full bg-gradient-conic from-purple-500/20 via-pink-500/20 via-amber-500/20 via-green-500/20 to-purple-500/20 rounded-full blur-3xl"
                    />
                </div>
            </motion.div>

            {/* Winner card */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.6,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                }}
                className="relative mt-[200px]"
            >
                {/* Winner details */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
                    className="relative"
                >
                    <div className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-xl rounded-3xl p-8 border border-zinc-700/50 shadow-2xl">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-3xl opacity-20 blur-xl -z-10" />

                        {/* Congratulations text */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mb-4"
                        >
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                CHÚC MỪNG!
                            </h2>
                        </motion.div>

                        {/* Prize name */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-center mb-6"
                        >
                            <span className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold text-lg">
                                {prizeName}
                            </span>
                        </motion.div>

                        {/* Ticket number */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                            className="text-center mb-6"
                        >
                            <p className="text-zinc-400 text-sm mb-1">Số may mắn</p>
                            <div className="inline-block px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-2xl">
                                <span className="text-5xl font-bold text-white font-mono tracking-wider">
                                    #{formatTicketNumber(winner.ticketNumber)}
                                </span>
                            </div>
                        </motion.div>

                        {/* Name */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="text-center"
                        >
                            <motion.h3
                                animate={{
                                    textShadow: [
                                        '0 0 20px rgba(168, 85, 247, 0.5)',
                                        '0 0 40px rgba(236, 72, 153, 0.5)',
                                        '0 0 20px rgba(168, 85, 247, 0.5)',
                                    ],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-5xl font-bold text-white mb-3"
                            >
                                {winner.fullName}
                            </motion.h3>
                            <p className="text-xl text-zinc-400">{winner.department}</p>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
