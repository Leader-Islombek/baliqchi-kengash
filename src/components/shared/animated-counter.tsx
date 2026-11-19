"use client";

import { useEffect, useState } from "react";

export function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const duration = 700;
    const stepTime = 16;
    const steps = Math.max(1, Math.floor(duration / stepTime));
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString("uz-UZ")}
      {suffix}
    </span>
  );
}
