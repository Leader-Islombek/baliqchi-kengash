import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { Perspective3DGrid } from "@/core/ui/shared/scene-3d";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#C7D4F5] dark:border-[#233566] bg-white/85 dark:bg-[#0E1733]/65 px-6 py-14 text-center shadow-xs">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F46E5]/15 to-[#22D3EE]/15 text-[#4F46E5] dark:text-[#22D3EE]">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="font-display text-lg font-bold text-[#111827] dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#5B677F] dark:text-slate-400">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-5">
          <Button variant="primary">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}

export function PageHeader({
  badge,
  title,
  description,
  children,
}: {
  badge?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bk-hero-bg relative overflow-hidden border-b border-white/10">
      <div className="bk-grid-bg absolute inset-0 opacity-35" />
      <Perspective3DGrid />
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[#22D3EE]/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {badge && (
              <span className="mb-3 inline-flex items-center rounded-full border border-[#22D3EE]/35 bg-[#22D3EE]/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-[#22D3EE]">
                {badge}
              </span>
            )}
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[42px] leading-tight">
              {title}
            </h1>
            <p className="mt-3 text-base text-slate-300 sm:text-lg leading-relaxed">
              {description}
            </p>
          </div>
          {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}
