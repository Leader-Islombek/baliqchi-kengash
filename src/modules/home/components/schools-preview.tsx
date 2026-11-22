"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { Card } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/fields";
import { Button } from "@/core/ui/primitives/button";
import type { School } from "@/core/types/database";

export function SchoolsPreview({ schools }: { schools: School[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? schools.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            String(s.school_number).includes(q)
        )
      : schools;
    return list.slice(0, 9);
  }, [schools, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Maktab raqamini yozing (1–61)..."
            className="pl-10"
            aria-label="Maktab qidirish"
          />
        </div>
        <Link href="/maktablar">
          <Button variant="outline" size="sm">
            Barcha {schools.length} ta maktabni ko‘rish →
          </Button>
        </Link>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <Link key={s.id} href={`/maktablar/${s.slug}`} className="group">
              <Card className="flex items-center justify-between gap-3 p-4 hover:-translate-y-0.5 hover:border-[#3B82F6]/50 hover:shadow-md">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] font-display text-sm font-extrabold text-white shadow-sm">
                    {s.school_number}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-[#172033] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors">
                      {s.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-[#64748B] dark:text-slate-400">
                      <MapPin className="h-3 w-3 text-[#10B981] shrink-0" />
                      <span className="truncate">{s.address || "Baliqchi tumani"}</span>
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#64748B] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-[#64748B]">
          “{query}” bo‘yicha maktab topilmadi. 1 dan 61 gacha raqam kiriting.
        </Card>
      )}
    </div>
  );
}
