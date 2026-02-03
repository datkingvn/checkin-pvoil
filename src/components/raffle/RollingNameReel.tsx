'use client';

import { useEffect, useRef, useCallback } from 'react';
import DigitReel from './DigitReel';

interface Participant {
  fullName: string;
  department: string;
  ticketNumber: number;
}

interface RollingNameReelProps {
  participants: Participant[];
  winner: Participant | null;
  isSpinning: boolean;
  duration?: number;
  onComplete: () => void;
  onReelLocked?: (lockedCount: number) => void;
}

const DIGIT_COUNT = 5;
// Thời gian quay tổng cộng (~10s) trước khi tất cả 5 số dừng cùng lúc
const TOTAL_SPIN_DURATION = 10000;

const getDigitsFromTicket = (
  ticketNumber: number | undefined | null
): number[] => {
  const padded = String(ticketNumber ?? 0).padStart(DIGIT_COUNT, '0');
  return padded.split('').map(Number);
};

// Tất cả các reel dùng cùng một thời điểm dừng để hiện 5 số đồng thời
const getStopTime = () => TOTAL_SPIN_DURATION;

export default function RollingNameReel({
  winner,
  isSpinning,
  onComplete,
  onReelLocked,
}: RollingNameReelProps) {
  const lockedCountRef = useRef(0);

  const handleReelLocked = useCallback(() => {
    lockedCountRef.current += 1;
    onReelLocked?.(lockedCountRef.current);

    if (lockedCountRef.current === DIGIT_COUNT) {
      // Đợi 5 giây sau khi số thứ 5 dừng rồi mới sang màn chúc mừng
      setTimeout(() => {
        onComplete();
      }, 5000);
    }
  }, [onComplete, onReelLocked]);

  useEffect(() => {
    if (!isSpinning) {
      lockedCountRef.current = 0;
    }
  }, [isSpinning]);

  const targetDigits = winner ? getDigitsFromTicket(winner.ticketNumber) : null;
  const showPlaceholder = !isSpinning && !winner;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-sky-300">
        {/* {showPlaceholder ? 'MÃ SỐ TRÚNG THƯỞNG' : 'ĐANG QUAY SỐ...'} */}
      </p>

      <div className="relative mt-8 sm:mt-10 md:mt-12 lg:mt-16 flex items-center justify-center gap-3 sm:gap-4 md:gap-5 p-4 md:p-6 min-w-0">
        {/* 5 digit reels */}
        {targetDigits
          ? targetDigits.map((digit, idx) => (
              <DigitReel
                key={idx}
                id={idx}
                targetDigit={digit}
                isSpinning={isSpinning}
                stopTime={getStopTime()}
                onLocked={handleReelLocked}
              />
            ))
          : Array.from({ length: DIGIT_COUNT }).map((_, idx) => (
              <div
                key={idx}
                className="relative w-14 sm:w-16 md:w-20 lg:w-24 h-[112px] overflow-hidden rounded-xl reel-container flex items-center justify-center shrink-0"
              >
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-digital text-white">
                  -
                </span>
              </div>
            ))}
      </div>

      {showPlaceholder && (
        <p className="text-xs text-sky-300/80">
          Bấm BẮT ĐẦU QUAY để hiển thị kết quả
        </p>
      )}
    </div>
  );
}
