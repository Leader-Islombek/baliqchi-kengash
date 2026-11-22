"use client";

import { useState } from "react";
import { DirectionIcon, getDirectionStyle } from "@/core/ui/shared/direction-icon";

export function SafeProjectCover({
  src,
  alt,
  iconName,
  accentColor,
  className = "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105",
}: {
  src?: string | null;
  alt: string;
  iconName?: string | null;
  accentColor?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dirStyle = getDirectionStyle(accentColor);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  return (
    <div className="bk-grid-bg flex h-full w-full items-center justify-center">
      <div
        className={`rounded-2xl p-4 ${dirStyle.bg} ${dirStyle.text} transition-transform duration-300 group-hover:scale-110`}
      >
        <DirectionIcon name={iconName} className="h-8 w-8" />
      </div>
    </div>
  );
}
