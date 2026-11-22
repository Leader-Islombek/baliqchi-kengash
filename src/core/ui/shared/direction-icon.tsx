import {
  Cpu,
  GraduationCap,
  HeartHandshake,
  Leaf,
  Palette,
  Radio,
  Sparkles,
  Trophy,
} from "lucide-react";

const ICONS = {
  GraduationCap,
  Palette,
  Cpu,
  Trophy,
  Leaf,
  Radio,
  HeartHandshake,
  Sparkles,
} as const;

export const DIRECTION_ACCENT_STYLES: Record<
  string,
  { bg: string; text: string; border: string; gradient: string }
> = {
  blue: {
    bg: "bg-blue-500/12 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/25",
    gradient: "from-blue-600 to-indigo-600",
  },
  violet: {
    bg: "bg-violet-500/12 dark:bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/25",
    gradient: "from-violet-600 to-purple-600",
  },
  cyan: {
    bg: "bg-cyan-500/12 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/25",
    gradient: "from-cyan-500 to-blue-600",
  },
  emerald: {
    bg: "bg-emerald-500/12 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
    gradient: "from-emerald-500 to-teal-600",
  },
  teal: {
    bg: "bg-teal-500/12 dark:bg-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/25",
    gradient: "from-teal-500 to-emerald-600",
  },
  sky: {
    bg: "bg-sky-500/12 dark:bg-sky-500/20",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/25",
    gradient: "from-sky-500 to-blue-600",
  },
  amber: {
    bg: "bg-amber-500/12 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/25",
    gradient: "from-amber-500 to-orange-500",
  },
};

export function DirectionIcon({
  name,
  className = "h-5 w-5",
}: {
  name?: string | null;
  className?: string;
}) {
  const IconComp =
    (name && ICONS[name as keyof typeof ICONS]) || Sparkles;
  return <IconComp className={className} />;
}

export function getDirectionStyle(accent?: string | null) {
  return DIRECTION_ACCENT_STYLES[accent || "blue"] || DIRECTION_ACCENT_STYLES.blue;
}
