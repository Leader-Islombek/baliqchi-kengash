"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, School as SchoolIcon, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/fields";
import type { School } from "@/types/database";

export function SchoolsGrid({ schools }: { schools: School[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.school_number).includes(q) ||
        (s.address || "").toLowerCase().includes(q)
    );
  }, [schools, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Maktab raqami yoki nomi bo‘yicha qidirish (masalan: 12)..."
            className="pl-10"
          />
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Ko‘rsatilmoqda: <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> / {schools.length} ta maktab
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((school) => (
          <Link key={school.id} href={`/maktablar/${school.slug}`} className="group">
            <Card className="flex h-full flex-col justify-between p-5 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-lg">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 font-display text-base font-bold text-white shadow-sm">
                    {school.school_number}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <SchoolIcon className="h-3 w-3 text-blue-500" />
                    Profil
                  </span>
                </div>

                <h3 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                  {school.name}
                </h3>
                {school.address && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                    {school.address}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-semibold text-blue-600 dark:text-sky-400">
                <span>Kengash va loyihalarni ko‘rish</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
