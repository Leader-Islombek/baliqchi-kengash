"use client";

import { useMemo, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { Input } from "@/core/ui/primitives/fields";
import { MotionAccordionItem } from "@/core/ui/shared/motion-primitives";
import type { CharterChapter } from "@/core/config/official-data";

export function NizomAccordion({ chapters }: { chapters: CharterChapter[] }) {
  const [query, setQuery] = useState("");
  const [openIndices, setOpenIndices] = useState<number[]>([0, 1, 2]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters.map((ch, idx) => ({ ch, idx }));
    return chapters
      .map((ch, idx) => ({ ch, idx }))
      .filter(
        ({ ch }) =>
          ch.title.toLowerCase().includes(q) ||
          ch.number.toLowerCase().includes(q) ||
          ch.clauses.some((c) => c.toLowerCase().includes(q))
      );
  }, [chapters, query]);

  const allOpen = openIndices.length === chapters.length;

  function toggleIndex(idx: number) {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  function toggleAll() {
    setOpenIndices(allOpen ? [0] : chapters.map((_, i) => i));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nizom bandlari bo‘yicha qidirish (masalan: saylov, klub, sinf)..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll} className="shrink-0">
          {allOpen ? (
            <>
              <ChevronsDownUp className="h-4 w-4" /> Barchasini yig‘ish
            </>
          ) : (
            <>
              <ChevronsUpDown className="h-4 w-4" /> Barchasini ochish
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map(({ ch, idx }) => (
          <MotionAccordionItem
            key={ch.number}
            id={`bob-${idx + 1}`}
            badge={ch.number}
            title={ch.title}
            isOpen={Boolean(query.trim()) || openIndices.includes(idx)}
            onToggle={() => toggleIndex(idx)}
          >
            <div className="space-y-3 text-sm leading-relaxed text-[#172033] dark:text-slate-300">
              {ch.clauses.map((clause, cIdx) => (
                <p
                  key={cIdx}
                  className="rounded-xl bg-[#F5F8FF] dark:bg-[#0B1224]/70 p-3.5 border border-[#DCE5F5]/70 dark:border-[#22345A]"
                >
                  {clause}
                </p>
              ))}
            </div>
          </MotionAccordionItem>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#111C35] p-8 text-center text-sm text-[#64748B]">
            “{query}” bo‘yicha Nizom bandi topilmadi.
          </div>
        )}
      </div>
    </div>
  );
}
