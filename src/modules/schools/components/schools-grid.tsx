"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, School as SchoolIcon, Search } from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";
import { Input, Select } from "@/core/ui/primitives/fields";
import type { School } from "@/core/types/database";

const PAGE_SIZE = 18;

export function SchoolsGrid({ schools }: { schools: School[] }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"asc" | "desc" | "name">("asc");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? schools.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            String(s.school_number).includes(q) ||
            (s.address || "").toLowerCase().includes(q)
        )
      : schools;

    return [...list].sort((a, b) => {
      if (sortBy === "desc") return b.school_number - a.school_number;
      if (sortBy === "name") return a.name.localeCompare(b.name, "uz");
      return a.school_number - b.school_number;
    });
  }, [schools, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleSchools = showAll
    ? filtered
    : filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Maktab raqami yoki nomi bo‘yicha qidirish (masalan: 12)..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "asc" | "desc" | "name");
              setPage(1);
            }}
            className="w-48 h-10 text-xs"
            aria-label="Maktablarni saralash"
          >
            <option value="asc">Raqam bo‘yicha (1 → 61)</option>
            <option value="desc">Raqam bo‘yicha (61 → 1)</option>
            <option value="name">Nom bo‘yicha (A–Z)</option>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Sahifalab ko‘rsatish" : `Barchasi (${filtered.length})`}
          </Button>
        </div>
      </div>

      <div className="text-xs font-medium text-[#64748B]">
        Ko‘rsatilmoqda:{" "}
        <strong className="text-[#172033] dark:text-white">{visibleSchools.length}</strong> /{" "}
        {filtered.length} ta maktab
      </div>

      {visibleSchools.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSchools.map((school) => (
            <Link key={school.id} href={`/maktablar/${school.slug}`} className="group">
              <Card className="flex h-full flex-col justify-between rounded-3xl p-5 hover:-translate-y-1 hover:border-[#3B82F6]/50 hover:shadow-xl hover:shadow-[#2563EB]/10">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#10B981] font-display text-base font-extrabold text-white shadow-md shadow-[#2563EB]/20">
                      {school.school_number}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F8FF] dark:bg-[#172544] px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] dark:text-[#38BDF8]">
                      <SchoolIcon className="h-3 w-3" />
                      Profil
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-base font-bold text-[#172033] dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors">
                    {school.name}
                  </h3>
                  {school.address && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                      {school.address}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EEF3FF] dark:border-[#22345A] pt-3.5 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8]">
                  <span>Kengash va loyihalarni ko‘rish</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center text-sm text-[#64748B]">
          “{query}” bo‘yicha maktab topilmadi.
        </Card>
      )}

      {/* Pagination Controls */}
      {!showAll && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Oldingi
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={p === safePage ? "primary" : "outline"}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Keyingi <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
