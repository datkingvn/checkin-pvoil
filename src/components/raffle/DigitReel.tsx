'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

const REEL_HEIGHT = 112;

interface DigitReelProps {
  id: number;
  targetDigit: number;
  isSpinning: boolean;
  stopTime: number;
  onLocked: () => void;
}

const TICK_AUDIO_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
const LOCK_AUDIO_URL = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';

export default function DigitReel({
  id,
  targetDigit,
  isSpinning,
  stopTime,
  onLocked,
}: DigitReelProps) {
  const [offset, setOffset] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lockedEmittedRef = useRef(false);
  const offsetRef = useRef(0);

  const lockAudioRef = useRef<HTMLAudioElement | null>(null);
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTickDigitRef = useRef<number>(-1);

  useEffect(() => {
    lockAudioRef.current = new Audio(LOCK_AUDIO_URL);
    lockAudioRef.current.volume = 0.5;

    tickAudioRef.current = new Audio(TICK_AUDIO_URL);
    tickAudioRef.current.volume = 0.15;

    return () => {
      lockAudioRef.current?.pause();
      tickAudioRef.current?.pause();
    };
  }, []);

  const digits = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 10; j++) arr.push(j);
    }
    return arr;
  }, []);

  const loopHeight = 10 * REEL_HEIGHT;

  useEffect(() => {
    if (!isSpinning) {
      if (!isLocked) {
        setOffset(0);
        offsetRef.current = 0;
        lastTickDigitRef.current = -1;
      }
      return;
    }

    setIsLocked(false);
    lockedEmittedRef.current = false;
    startTimeRef.current = null;

    const animate = (time: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = time;
        lastTimeRef.current = time;
      }

      const elapsed = time - (startTimeRef.current ?? 0);
      const deltaTime = time - lastTimeRef.current;

      const slowdownWindow = 1500;
      const slowdownStartTime = stopTime - slowdownWindow;

      let nextOffset = offsetRef.current;

      if (elapsed < slowdownStartTime) {
        const speed = 7;
        nextOffset = (nextOffset + speed * deltaTime) % loopHeight;
      } else if (elapsed < stopTime) {
        const progress = (elapsed - slowdownStartTime) / slowdownWindow;
        const currentSpeed = 7 * Math.pow(1 - progress, 2);
        nextOffset = (nextOffset + currentSpeed * deltaTime) % loopHeight;
      } else {
        const finalOffset = targetDigit * REEL_HEIGHT;
        setOffset(finalOffset);
        offsetRef.current = finalOffset;
        setIsLocked(true);
        if (!lockedEmittedRef.current) {
          lockedEmittedRef.current = true;
          if (lockAudioRef.current) {
            lockAudioRef.current.currentTime = 0;
            lockAudioRef.current.play().catch(() => {});
          }
          onLocked();
        }
        return;
      }

      const currentDigitIdx =
        Math.floor((nextOffset + REEL_HEIGHT / 2) / REEL_HEIGHT) % 10;
      if (currentDigitIdx !== lastTickDigitRef.current) {
        lastTickDigitRef.current = currentDigitIdx;
        const tick = tickAudioRef.current?.cloneNode() as HTMLAudioElement | undefined;
        if (tick) {
          tick.volume = 0.12;
          tick.play().catch(() => {});
        }
      }

      offsetRef.current = nextOffset;
      setOffset(nextOffset);
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSpinning, stopTime, targetDigit, loopHeight, onLocked]);

  return (
    <div
      className={`relative w-14 sm:w-16 md:w-20 lg:w-24 h-[112px] overflow-hidden rounded-xl transition-all duration-500 reel-container shrink-0 ${isLocked ? 'reel-active scale-110 z-10' : 'border-transparent'}`}
    >
      <div
        className={`absolute w-full ${isLocked ? '' : 'mask-vignette'}`}
        style={{
          transform: `translateY(-${isLocked ? targetDigit * REEL_HEIGHT : offset % loopHeight}px)`,
          filter:
            isSpinning && !isLocked
              ? `blur(${Math.min(5, 5 * (1 - ((offset % 5) / 5)))}px)`
              : 'none',
          transition: isLocked
            ? 'transform 0.7s cubic-bezier(0.17, 0.89, 0.32, 1.28)'
            : 'none',
        }}
      >
        {digits.map((digit, idx) => (
          <div
            key={idx}
            className={`h-[112px] flex items-center justify-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-digital select-none transition-all duration-300 ${
              isLocked ? 'reel-digit-locked glow-text-cyan' : 'text-white'
            }`}
          >
            {digit}
          </div>
        ))}
      </div>

      {isSpinning && !isLocked && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent" />
      )}
    </div>
  );
}
