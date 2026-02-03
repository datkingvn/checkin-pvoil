'use client';

import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
    trigger: boolean;
}

export default function Confetti({ trigger }: ConfettiProps) {
    const fireConfetti = useCallback(() => {
        const duration = 4000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Create confetti from both sides
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#a855f7', '#ec4899', '#f97316', '#eab308', '#22c55e'],
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#a855f7', '#ec4899', '#f97316', '#eab308', '#22c55e'],
            });
        }, 250);

        // Big burst in the center
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { x: 0.5, y: 0.5 },
                colors: ['#ffd700', '#ffea00', '#fff'],
                scalar: 1.5,
            });
        }, 100);
    }, []);

    useEffect(() => {
        if (trigger) {
            fireConfetti();
        }
    }, [trigger, fireConfetti]);

    return null;
}
