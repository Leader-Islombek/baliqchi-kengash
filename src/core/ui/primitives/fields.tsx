"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/core/utils";

const fieldBase =
  "w-full rounded-xl border border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#0B1224]/70 px-3.5 py-2.5 text-sm text-[#172033] dark:text-slate-100 placeholder:text-[#64748B]/80 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/35 focus:border-[#2563EB] transition-colors disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />
));
Input.displayName = "Input";

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(fieldBase, "h-11 pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Parolni yashirish" : "Parolni ko‘rsatish"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-[96px] resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-semibold text-[#172033] dark:text-slate-200 mb-1.5",
        className
      )}
      {...props}
    />
  );
}

export function ProgressBar({
  value,
  className,
  showLabel = false,
  darkTrack = false,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
  darkTrack?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value || 0)));
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className={darkTrack ? "text-slate-300" : "text-[#64748B] dark:text-slate-400"}>
            Bajarilish darajasi
          </span>
          <span className={darkTrack ? "text-[#38BDF8]" : "text-[#2563EB] dark:text-[#38BDF8]"}>
            {clamped}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "h-2.5 w-full overflow-hidden rounded-full",
          darkTrack ? "bg-white/15" : "bg-[#E2E8F0] dark:bg-[#1B2B4B]"
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${clamped}%` }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#10B981]"
        />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[#E2E8F0]/80 dark:bg-[#1B2B4B]/80",
        className
      )}
    />
  );
}
