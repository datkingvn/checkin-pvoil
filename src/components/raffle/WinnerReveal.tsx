"use client";

import { motion } from "framer-motion";
import { formatTicketNumber } from "@/lib/helpers";

interface Winner {
  fullName: string;
  department: string;
  ticketNumber: number;
  phoneNumber?: string;
}

interface WinnerRevealProps {
  winner: Winner;
  prizeName: string;
}

export default function WinnerReveal({ winner, prizeName }: WinnerRevealProps) {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Spotlight effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
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
              ease: "linear",
            }}
            className="w-full h-full bg-gradient-conic from-purple-500/20 via-pink-500/20 via-amber-500/20 via-green-500/20 to-purple-500/20 rounded-full blur-3xl opacity-50"
          />
        </div>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
        className="relative"
      >
        <div className="relative flex flex-col items-center gap-4 p-6 bg-slate-900/20 backdrop-blur-sm border border-white/10 rounded-[3rem] shadow-2xl">
          <div className="relative flex flex-col items-center gap-4">
            {/* Header: Prize Name */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-center w-full"
            >
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-300 bg-clip-text text-transparent uppercase tracking-wider [text-shadow:1px_1px_0_#fbbf24,_2px_2px_0_#f59e0b] drop-shadow-[0_0_30px_rgba(254,240,138,1)]">
                {prizeName}
              </h2>
            </motion.div>

            {/* Content: Ticket & User Info */}
            <div className="w-full grid gap-4">
              {/* Lucky Number */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center justify-center gap-3"
              >
                <div className="relative">
                  {/* Ultra bright shimmer glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/60 via-yellow-100/70 to-yellow-200/60 blur-3xl animate-pulse" />
                  <span className="relative text-6xl md:text-7xl font-black font-mono tracking-wider tabular-nums text-white [text-shadow:0_2px_0_#fbbf24,_0_4px_15px_rgba(254,240,138,1)] drop-shadow-[0_0_40px_rgba(254,240,138,1)]">
                    #{formatTicketNumber(winner.ticketNumber)}
                  </span>
                  {/* Bright reflection line */}
                  <div className="absolute top-1/2 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-yellow-100/80 to-transparent skew-x-12 blur-sm" />
                </div>

                <div className="bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent w-32 h-[2px]" />
              </motion.div>

              {/* Winner Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center space-y-3"
              >
                <div className="relative">
                  {/* Intense glow behind name */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/50 via-yellow-200/60 to-yellow-300/50 blur-2xl" />
                  <motion.h3 className="relative text-3xl md:text-5xl font-black bg-gradient-to-b from-yellow-50 via-yellow-200 to-yellow-300 bg-clip-text text-transparent [text-shadow:1px_1px_0_#fbbf24,_2px_2px_0_#f59e0b] drop-shadow-[0_0_25px_rgba(254,240,138,0.9)]">
                    {winner.fullName}
                  </motion.h3>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/30 via-yellow-200/40 to-yellow-300/30 blur-sm" />
                    <div className="relative flex flex-col gap-1 items-center bg-slate-900/80 backdrop-blur-xl px-8 py-3 rounded-2xl border border-yellow-400/40 shadow-[0_0_35px_rgba(254,240,138,0.3)] min-w-[280px]">
                      <p className="text-base text-yellow-100 font-bold uppercase tracking-[0.2em]">
                        {winner.department}
                      </p>
                      {winner.phoneNumber && (
                        <p className="text-sm text-yellow-200 font-mono font-bold tracking-widest border-t border-yellow-400/30 pt-2 mt-1 w-full text-center">
                          {winner.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
