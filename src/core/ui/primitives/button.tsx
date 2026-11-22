import * as React from "react";
import { cn } from "@/core/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "teal";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#4F46E5] via-[#2563EB] to-[#0EA5E9] text-white hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[#4F46E5]/30",
  secondary:
    "bg-[#060B19] text-white hover:bg-[#0E1733] active:scale-[0.98] dark:bg-white dark:text-[#060B19] dark:hover:bg-slate-100",
  outline:
    "border border-[#DBE4F8] dark:border-[#233566] bg-white dark:bg-[#0E1733]/85 text-[#111827] dark:text-slate-100 hover:border-[#4F46E5]/50 hover:bg-[#EEF2FF] dark:hover:bg-[#16234A] active:scale-[0.98]",
  ghost:
    "text-[#111827] dark:text-slate-200 hover:bg-[#EEF2FF] dark:hover:bg-[#16234A] active:scale-[0.98]",
  danger:
    "bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:brightness-110 active:scale-[0.98] shadow-md shadow-rose-600/25",
  teal:
    "bg-gradient-to-r from-[#10B981] via-[#06B6D4] to-[#2563EB] text-white hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[#06B6D4]/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs rounded-xl gap-1.5",
  md: "h-10 px-4.5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-sm sm:text-base rounded-2xl gap-2.5",
  icon: "h-10 w-10 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#060B19] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
