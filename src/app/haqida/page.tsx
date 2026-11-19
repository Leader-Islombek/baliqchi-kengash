import Link from "next/link";
import { Award, Building2, CheckCircle2, Compass, Layers, Shield, Users, Vote } from "lucide-react";
import { PageHeader } from "@/components/shared/empty-state";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OFFICIAL_CLUBS_LIST, OFFICIAL_DIRECTIONS, PLATFORM_INFO } from "@/lib/constants/official-data";

export const metadata = {
  title: "Platforma haqida",
};

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        badge="Baliqchi tumani • Andijon viloyati"
        title="Platforma haqida"
        description="Baliqchi tumani O‘quvchilar Kengashi — 61 ta maktab, Kelajak Liderlari, 7 ta yo‘nalish koordinatorlari va minglab o‘quvchilarni yagona tashabbus maydonida birlashtiruvchi raqamli ekotizim."
      >
        <Link href="/nizom">
          <Button variant="teal">Rasmiy Nizomni o‘qish</Button>
        </Link>
        <Link href="/royxatdan-otish">
          <Button variant="primary">Platformaga qo‘shilish</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-14">
        {/* Missiya va Huquqiy asos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <div className="mb-3 inline-flex rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-sky-400">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold">Huquqiy asos</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Platforma {PLATFORM_INFO.decreeRef} — “Umumiy o‘rta ta’lim muassasalarida O‘quvchilar
              Kengashi faoliyatini tashkil etish to‘g‘risidagi Nizom” asosida ishlaydi.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-3 inline-flex rounded-xl bg-teal-500/10 p-3 text-teal-600 dark:text-teal-400">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold">“Tengdosh-tengdoshga” tamoyili</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan maktab ijobiy tajribasi hamda
              “Milliy qadriyatlar asosida global fikrlaydigan lider shaxsni shakllantirish” mafkurasiga tayanadi.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-3 inline-flex rounded-xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
              <Vote className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold">Adolatli natijalar</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Har bir o‘quvchi haftasiga barcha 7 yo‘nalish bo‘yicha 1 ta ovoz beradi. Haftalik
              g‘olib loyiha tuman darajasida ko‘rib chiqilib, amaliyotga joriy etiladi.
            </p>
          </Card>
        </div>

        {/* Ikki darajali tashkiliy tuzilma */}
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Ikki darajali tashkiliy tuzilma
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            61 ta maktab mustaqil raqamli profillarga ega bo‘lib, tuman darajasidagi boshqaruv tizimida birlashadi.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-blue-500/30">
              <CardContent className="p-6">
                <Badge className="mb-3 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-sky-400">
                  <Award className="h-3.5 w-3.5" />
                  Tuman darajasi
                </Badge>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Baliqchi tumani O‘quvchilar Kengashi
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <span><strong>1 nafar Tuman Kelajak Lideri</strong> — 61 maktab lideri va tuman tashabbuslari boshqaruvi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <span><strong>7 nafar Tuman yo‘nalish koordinatori</strong> — har biri o‘z yo‘nalishidagi 61 maktab koordinatori guruhini boshqaradi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <span><strong>8 ta boshqaruv guruhi</strong> — 7 ta yo‘nalish guruhi + alohida Kelajak Liderlari guruhi.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-teal-500/30">
              <CardContent className="p-6">
                <Badge className="mb-3 border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  <Building2 className="h-3.5 w-3.5" />
                  Maktab darajasi (61 ta maktab)
                </Badge>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Har bir maktabning mustaqil Kengashi
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                    <span><strong>1 nafar Maktab maslahatchisi</strong> — Kengash faoliyatini muvofiqlashtiradi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                    <span><strong>1 nafar Maktab Kelajak Lideri</strong> va <strong>7 nafar yo‘nalish koordinatori</strong> (kamida 8 nafar a’zo).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                    <span><strong>5–11-sinf vakillari (class representatives)</strong> hamda <strong>7 ta rasmiy klub</strong> va to‘garaklar.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 7 yo'nalish va 7 klub */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-5 w-5 text-blue-600 dark:text-sky-400" />
              <h3 className="font-display text-lg font-bold">7 ta rasmiy yo‘nalish</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OFFICIAL_DIRECTIONS.map((d, i) => (
                <Link
                  key={d.slug}
                  href={`/yonalishlar/${d.slug}`}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-medium hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
                >
                  {i + 1}. {d.name}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-display text-lg font-bold">Nizomdagi 7 ta rasmiy klub</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OFFICIAL_CLUBS_LIST.map((club, i) => (
                <div
                  key={club}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {i + 1}. {club}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
