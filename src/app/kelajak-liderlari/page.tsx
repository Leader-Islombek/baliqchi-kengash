import Link from "next/link";
import { Award, School, Sparkles } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { getCoordinators } from "@/core/db/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Kelajak Liderlari",
};

export default async function FutureLeadersPage() {
  const leaders = await getCoordinators(["district_leader", "school_leader"]);
  const districtLeader = leaders.find((l) => l.role === "district_leader");
  const schoolLeaders = leaders.filter((l) => l.role === "school_leader");

  return (
    <div>
      <PageHeader
        badge="1 Tuman Kelajak Lideri + 61 Maktab Kelajak Lideri"
        title="Kelajak Liderlari"
        description="Baliqchi tumani O‘quvchilar Kengashining boshqaruv yadrosini tashkil etuvchi Tuman va 61 ta maktab Kelajak Liderlari."
      >
        <Link href="/guruhlar">
          <Button variant="teal">Kelajak Liderlari guruhi</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Tuman Kelajak Lideri */}
        <Card className="border-blue-500/30 bg-gradient-to-br from-[#0a162d] to-[#122b57] p-8 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="border-sky-400/40 bg-sky-400/15 text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                Tuman Kelajak Lideri
              </Badge>
              <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
                {districtLeader?.user
                  ? `${districtLeader.user.first_name} ${districtLeader.user.last_name}`
                  : "Tuman Kelajak Lideri tayinlanishi kutilmoqda"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                61 nafar Maktab Kelajak Lideri, 7 nafar Tuman yo‘nalish koordinatori va tuman miqyosidagi
                tashabbuslarning asosiy muvofiqlashtiruvchisi.
              </p>
            </div>
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-sky-300">
              <Award className="h-10 w-10" />
            </div>
          </div>
        </Card>

        {/* 61 Maktab Kelajak Lideri */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Maktab Kelajak Liderlari ({schoolLeaders.length} / 61)
            </h2>
            <Link href="/maktablar">
              <Button variant="outline" size="sm">
                61 ta maktab
              </Button>
            </Link>
          </div>

          {schoolLeaders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schoolLeaders.map((leader) => (
                <Link
                  key={leader.id}
                  href={leader.school ? `/maktablar/${leader.school.slug}` : "/maktablar"}
                >
                  <Card className="p-5 hover:border-blue-500/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-sky-400 font-display font-bold">
                        {leader.school?.school_number || "M"}
                      </div>
                      <div>
                        <div className="font-display text-base font-bold text-slate-900 dark:text-white">
                          {leader.user?.first_name} {leader.user?.last_name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <School className="h-3 w-3" />
                          {leader.school?.name || "Maktab"}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Award className="h-7 w-7" />}
              title="Maktab Kelajak Liderlari arizalari tasdiqlanmoqda"
              description="61 ta maktab Kelajak Liderlari ro‘yxatdan o‘tib Super Administrator tomonidan tasdiqlangach bu sahifada ko‘rinadi."
              actionHref="/royxatdan-otish"
              actionLabel="Lider sifatida ro‘yxatdan o‘tish"
            />
          )}
        </section>
      </div>
    </div>
  );
}
