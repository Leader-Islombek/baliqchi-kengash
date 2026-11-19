import Link from "next/link";
import { BookOpen, Building2, CheckCircle2, FileText, Network, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/empty-state";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  OFFICIAL_CHARTER_CHAPTERS,
  OFFICIAL_CLUBS_LIST,
  OFFICIAL_DIRECTIONS,
  PLATFORM_INFO,
} from "@/lib/constants/official-data";

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
          {/* Chap tomondagi boblar mundarijasi */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white mb-3">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                  Nizom mundarijasi (10 bob)
                </div>
                <nav className="space-y-1">
                  {OFFICIAL_CHARTER_CHAPTERS.map((ch, idx) => (
                    <a
                      key={ch.number}
                      href={`#bob-${idx + 1}`}
                      className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
                    >
                      <span className="font-semibold">{ch.number}.</span> {ch.title}
                    </a>
                  ))}
                  <a
                    href="#tashkiliy-tuzilmalar"
                    className="block rounded-lg px-3 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                  >
                    Ilova: Tashkiliy tuzilmalar (Maktab • Tuman • Hudud • Respublika)
                  </a>
                </nav>
              </Card>

              <Card className="border-blue-500/25 bg-blue-500/5 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-sky-300">
                  <ShieldCheck className="h-4 w-4" />
                  Saylov va a’zolik qoidasi
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Nizomning 4-bobiga muvofiq, Kengash tarkibi har yili <strong>1–30-oktabr</strong> kunlari
                  saylov yo‘li bilan <strong>5–11-sinf</strong> o‘quvchilari orasidan shakllantiriladi.
                </p>
              </Card>
            </div>
          </aside>

          {/* Asosiy 10 bob matni */}
          <div className="lg:col-span-8 space-y-6">
            {OFFICIAL_CHARTER_CHAPTERS.map((chapter, idx) => (
              <Card key={chapter.number} id={`bob-${idx + 1}`} className="scroll-mt-24">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-sky-300">
                      <FileText className="h-3 w-3" />
                      {chapter.number}
                    </Badge>
                    <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      {chapter.title}
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {chapter.clauses.map((clause, cIdx) => (
                      <p key={cIdx} className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3.5 border border-slate-100 dark:border-slate-800/80">
                        {clause}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Rasmiy Tashkiliy Tuzilmalar (PDF 7–10-sahifalar asosida) */}
            <Card id="tashkiliy-tuzilmalar" className="scroll-mt-24 border-teal-500/30">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5">
                  <Network className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    “Kelajak” markazi O‘quvchilar Kengashi tashkiliy tuzilmalari
                  </h2>
                </div>

                {/* Maktab darajasi sxemasi */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-sky-300">
                    <Building2 className="h-4 w-4" />
                    1. Umumiy o‘rta ta’lim muassasasi (Maktab) tuzilmasi
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
                      Maktab maslahatchisi (1 nafar) → O‘quvchilar Kengashi (kamida 8 nafar)
                    </div>
                    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-center text-sm font-bold text-blue-700 dark:text-sky-300">
                      Maktab Kelajak lideri (1 nafar)
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {OFFICIAL_DIRECTIONS.map((d) => (
                        <div
                          key={d.slug}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-center"
                        >
                          {d.name} koordinatori (1 nafar)
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-slate-500 mb-2">
                        Qoshidagi klublar, 5–11-sinf vakillari va “Kelajak” markazi tarmoq to‘garaklari:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {OFFICIAL_CLUBS_LIST.map((club) => (
                          <Badge
                            key={club}
                            className="border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                          >
                            {club}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tuman, Hududiy, Respublika ierarxiyasi */}
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
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                    >
                      <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                        {lvl.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-sky-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {lvl.leader}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                        {lvl.coords}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 pt-1">
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
