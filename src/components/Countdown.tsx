"use client";

import { useEffect, useState } from "react";

const TARGET_DATE = new Date("2025-10-26T00:00:00Z").getTime();

interface CountdownProps {
  dict: {
    countdown_title: string;
    countdown_days: string;
    countdown_hours: string;
    countdown_minutes: string;
    countdown_seconds: string;
  };
}

export default function Countdown({ dict }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = TARGET_DATE - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#030303]/90 border-b border-neon-pink/10 px-4 py-2 relative z-50 overflow-hidden">
      {/* Subtle neon indicator line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-pink to-transparent opacity-75" />

      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-neon-pink animate-pulse" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-text-secondary">
            {dict.countdown_title}
          </span>
        </div>

        {/* Counter Display */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-neon-pink neon-text">
              {timeLeft.days.toString().padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-text-muted">
              {dict.countdown_days}
            </span>
          </div>

          <div className="text-[10px] font-bold text-neon-pink/30">:</div>

          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-text-primary">
              {timeLeft.hours.toString().padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-text-muted">
              {dict.countdown_hours}
            </span>
          </div>

          <div className="text-[10px] font-bold text-neon-pink/30">:</div>

          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-text-primary">
              {timeLeft.minutes.toString().padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-text-muted">
              {dict.countdown_minutes}
            </span>
          </div>

          <div className="text-[10px] font-bold text-neon-pink/30">:</div>

          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-neon-cyan neon-text-cyan">
              {timeLeft.seconds.toString().padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-text-muted">
              {dict.countdown_seconds}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
