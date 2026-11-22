"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calcTimeLeft(targetIso: string): TimeLeft {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(calcTimeLeft(endsAt));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (timeLeft?.expired) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300">
        <Clock className="h-4 w-4" />
        Ovoz berish muddati yakunlandi
      </div>
    );
  }

  const units = [
    { label: "Kun", value: timeLeft ? String(timeLeft.days).padStart(2, "0") : "--" },
    { label: "Soat", value: timeLeft ? String(timeLeft.hours).padStart(2, "0") : "--" },
    { label: "Daqiqa", value: timeLeft ? String(timeLeft.minutes).padStart(2, "0") : "--" },
    { label: "Soniya", value: timeLeft ? String(timeLeft.seconds).padStart(2, "0") : "--" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex min-w-[64px] flex-col items-center rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md"
        >
          <span className="font-display text-xl font-bold tabular-nums text-white">
            {u.value}
          </span>
          <span className="text-[11px] font-medium text-sky-200/80">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
