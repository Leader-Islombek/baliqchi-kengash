import Link from "next/link";
import { BookOpen, Building2, CheckCircle2, Network, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/core/ui/shared/empty-state";
import { Badge, Card, CardContent } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { NizomAccordion } from "@/modules/nizom/components/nizom-accordion";
import {
  OFFICIAL_CHARTER_CHAPTERS,
  OFFICIAL_CLUBS_LIST,
  OFFICIAL_DIRECTIONS,
  PLATFORM_INFO,
} from "@/core/config/official-data";

export const metadata = {
  title: "O‘quvchilar Kengashi Nizomi",
};

export default function CharterPage() {
  return (
    <div>
      <PageHeader
        badge="2026-yil 25-sentabrdagi 365-son buyrug‘iga 2-ILOVA"
        title="Umumiy o‘rta ta’lim muassasalarida O‘quvchilar Kengashi faoliyatini tashkil etish to‘g‘risidagi NIZOM"
        description={PLATFORM_INFO.decreeRef}
      >
        <Link href="/yonalishlar">
          <Button variant="teal">7 ta yo‘nalish</Button>
        </Link>
        <Link href="/maktablar">
          <Button variant="primary">61 ta maktab</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card className="p-5 rounded-3xl">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033] dark:text-white mb-3">
                  <BookOpen className="h-4 w-4 text-[#2563EB] dark:text-[#38BDF8]" />
                  Nizom mundarijasi (10 bob)
                </div>
                <nav className="space-y-1">
                  {OFFICIAL_CHARTER_CHAPTERS.map((ch, idx) => (
                    <a
                      key={ch.number}
                      href={`#bob-${idx + 1}`}
                      className="block rounded-xl px-3 py-2 text-xs font-medium text-[#64748B] dark:text-slate-300 hover:bg-[#2563EB]/10 hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors"
                    >
                      <span className="font-bold">{ch.number}.</span> {ch.title}
                    </a>
                  ))}
                  <a
                    href="#tashkiliy-tuzilmalar"
                    className="block rounded-xl px-3 py-2 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/10"
                  >
                    Ilova: Tashkiliy tuzilmalar (Maktab • Tuman • Hudud • Respublika)
                  </a>
                </nav>
              </Card>

              <Card className="rounded-3xl border-[#2563EB]/25 bg-[#2563EB]/5 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#2563EB] dark:text-[#38BDF8]">
                  <ShieldCheck className="h-4 w-4" />
                  Saylov va a’zolik qoidasi
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#64748B] dark:text-slate-300">
                  Nizomning 4-bobiga muvofiq, Kengash tarkibi har yili <strong>1–30-oktabr</strong> kunlari
                  saylov yo‘li bilan <strong>5–11-sinf</strong> o‘quvchilari orasidan shakllantiriladi.
                </p>
              </Card>
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-8">
            <NizomAccordion chapters={OFFICIAL_CHARTER_CHAPTERS} />

            {/* Rasmiy Tashkiliy Tuzilmalar */}
            <Card id="tashkiliy-tuzilmalar" className="scroll-mt-24 rounded-3xl border-[#10B981]/30">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5">
                  <Network className="h-5 w-5 text-[#10B981]" />
                  <h2 className="font-display text-xl font-bold text-[#172033] dark:text-white">
                    “Kelajak” markazi O‘quvchilar Kengashi tashkiliy tuzilmalari
                  </h2>
                </div>

                <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224]/70 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#2563EB] dark:text-[#38BDF8]">
                    <Building2 className="h-4 w-4" />
                    1. Umumiy o‘rta ta’lim muassasasi (Maktab) tuzilmasi
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 py-2.5 text-center text-sm font-semibold text-white">
                      Maktab maslahatchisi (1 nafar) → O‘quvchilar Kengashi (kamida 8 nafar)
                    </div>
                    <div className="rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/10 px-4 py-2 text-center text-sm font-bold text-[#2563EB] dark:text-[#38BDF8]">
                      Maktab Kelajak lideri (1 nafar)
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {OFFICIAL_DIRECTIONS.map((d) => (
                        <div
                          key={d.slug}
                          className="rounded-xl border border-[#DCE5F5] dark:border-[#22345A] bg-white dark:bg-[#111C35] px-3 py-2 text-xs font-semibold text-center"
                        >
                          {d.name} koordinatori (1 nafar)
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-[#64748B] mb-2">
                        Qoshidagi klublar, 5–11-sinf vakillari va “Kelajak” markazi tarmoq to‘garaklari:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {OFFICIAL_CLUBS_LIST.map((club) => (
                          <Badge
                            key={club}
                            className="border-[#10B981]/25 bg-[#10B981]/10 text-[#059669] dark:text-[#34D399]"
                          >
                            {club}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "Tuman (shahar) darajasi",
                      leader: "Tuman Kelajak lideri (1 nafar)",
                      coords: "7 nafar Tuman yo‘nalish koordinatori",
                      note: "Tuman “Kelajak” markazining maktab maslahatchilari faoliyatini muvofiqlashtirish bo‘limi tomonidan tashkil etiladi.",
                    },
                    {
                      title: "Hududiy (Viloyat) daraja",
                      leader: "Hududiy Kelajak lideri (1 nafar)",
                      coords: "7 nafar Hududiy yo‘nalish koordinatori",
                      note: "Hududiy “Kelajak” markazining O‘quvchilar Kengashi tizimini tashkil etish bo‘limi tomonidan muvofiqlashtiriladi.",
                    },
                    {
                      title: "Respublika darajasi",
                      leader: "Respublika Kelajak lideri (1 nafar)",
                      coords: "7 nafar Respublika yo‘nalish koordinatori",
                      note: "Respublika “Kelajak” markazining O‘quvchilar Kengashi tizimini muvofiqlashtirish bo‘limi tomonidan amalga oshiriladi.",
                    },
                  ].map((lvl) => (
                    <div
                      key={lvl.title}
                      className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] p-4 space-y-2"
                    >
                      <div className="font-display text-sm font-bold text-[#172033] dark:text-white">
                        {lvl.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {lvl.leader}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                        {lvl.coords}
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#64748B] dark:text-slate-400 pt-1">
                        {lvl.note}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
