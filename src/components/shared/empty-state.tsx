import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 bg-white/60 dark:bg-[#0c172c]/50 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
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
      <div className="bk-grid-bg absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {badge && (
              <span className="mb-3 inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-sky-300">
                {badge}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
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
