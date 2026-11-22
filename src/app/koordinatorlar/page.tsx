import Link from "next/link";
import { Compass, ShieldCheck } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { OFFICIAL_DIRECTIONS } from "@/core/config/official-data";
import { getCoordinators } from "@/core/db/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Koordinatorlar",
};

export default async function CoordinatorsPage() {
  const coordinators = await getCoordinators(["district_coordinator", "school_coordinator"]);
  const districtCoords = coordinators.filter((c) => c.role === "district_coordinator");
  const schoolCoords = coordinators.filter((c) => c.role === "school_coordinator");

  return (
    <div>
      <PageHeader
        badge="7 ta yo‘nalish boshqaruvi"
        title="Tuman va maktab koordinatorlari"
        description="Baliqchi tumanidagi 7 nafar tuman yo‘nalish koordinatori va 61 ta maktabdagi yo‘nalish koordinatorlari tarkibi."
      >
        <Link href="/kelajak-liderlari">
          <Button variant="teal">Kelajak Liderlari</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-6">
            7 nafar Tuman yo‘nalish koordinatori
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFICIAL_DIRECTIONS.map((dir) => {
              const found = districtCoords.find((c) => c.direction?.slug === dir.slug);
              return (
                <Card key={dir.slug} className="p-5">
                  <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                    {dir.name}
                  </Badge>
                  <div className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">
                    {found?.user
                      ? `${found.user.first_name} ${found.user.last_name}`
                      : "Tayinlanishi kutilmoqda"}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {dir.name} koordinatori guruhi boshqaruvchisi
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              61 ta maktab yo‘nalish koordinatorlari ({schoolCoords.length})
            </h2>
            <Link href="/royxatdan-otish">
              <Button variant="outline" size="sm">
                Koordinatorlikka ariza berish
              </Button>
            </Link>
          </div>

          {schoolCoords.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schoolCoords.map((sc) => (
                <Card key={sc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-display text-sm font-bold">
                      {sc.user?.first_name} {sc.user?.last_name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {sc.direction?.name} • {sc.school ? `${sc.school.school_number}-maktab` : ""}
                    </div>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Compass className="h-7 w-7" />}
              title="Tasdiqlangan maktab koordinatorlari kutilmoqda"
              description="Koordinatorlar ro‘yxatdan o‘tib Super Administrator tomonidan tasdiqlangach avtomatik ushbu katalogga qo‘shiladi."
              actionHref="/royxatdan-otish"
              actionLabel="Ariza topshirish"
            />
          )}
        </section>
      </div>
    </div>
  );
}
