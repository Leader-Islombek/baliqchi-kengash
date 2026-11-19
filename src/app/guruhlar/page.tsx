import Link from "next/link";
import { Award, Lock, MessageSquare, Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shared/empty-state";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OFFICIAL_DIRECTIONS } from "@/lib/constants/official-data";
import { getCurrentUserContext, getUserGroups } from "@/lib/data/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "8 ta boshqaruv guruhi",
};

export default async function GroupsPage() {
  const userCtx = await getCurrentUserContext();
  const groups = userCtx ? await getUserGroups() : [];

  const leadersGroup = groups.find((g) => g.group_type === "future_leaders");
  const directionGroups = groups.filter((g) => g.group_type === "direction");

  return (
    <div>
      <PageHeader
        badge="7 ta yo‘nalish guruhi + 1 ta Kelajak Liderlari guruhi"
        title="Boshqaruv guruhlari va ichki muloqot"
        description="Har bir yo‘nalish bo‘yicha 61 ta maktab koordinatorlari hamda alohida Kelajak Liderlari jamoasining yopiq boshqaruv, topshiriqlar va hisobotlar maydoni."
      >
        <Link href="/kabinet">
          <Button variant="primary">Shaxsiy kabinet</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {!userCtx ? (
          <EmptyState
            icon={<Lock className="h-7 w-7" />}
            title="Guruhlar faqat tasdiqlangan koordinatorlar va Kelajak Liderlari uchun"
            description="O‘z guruhingizga kirish uchun tizimga kiring."
            actionHref="/kirish"
            actionLabel="Tizimga kirish"
          />
        ) : groups.length > 0 ? (
          <>
            {/* 8-GURUH: KELAJAK LIDERLARI (Alohida ajratilgan) */}
            {leadersGroup && (
              <Link href={`/guruhlar/${leadersGroup.slug}`} className="block group">
                <Card className="border-blue-500/40 bg-gradient-to-br from-[#0a162d] to-[#132c57] text-white hover:shadow-xl">
                  <CardContent className="p-6 sm:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <Badge className="border-sky-400/40 bg-sky-400/15 text-sky-300">
                        <Award className="h-3.5 w-3.5" />
                        8-guruh • Mustaqil boshqaruv interfeysi
                      </Badge>
                      <h2 className="font-display text-2xl font-bold group-hover:text-sky-300 transition-colors">
                        {leadersGroup.name}
                      </h2>
                      <p className="max-w-2xl text-sm text-slate-300">
                        {leadersGroup.description}
                      </p>
                    </div>
                    <Button variant="teal" className="shrink-0">
                      Guruh dashboardini ochish →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* 7 TA YO'NALISH GURUHI */}
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-5">
                Yo‘nalish koordinatorlari guruhlari ({directionGroups.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {directionGroups.map((g) => (
                  <Link key={g.id} href={`/guruhlar/${g.slug}`} className="group">
                    <Card className="h-full p-5 hover:border-blue-500/40 hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <Badge className="border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-sky-400">
                          {g.direction?.name || "Yo‘nalish"}
                        </Badge>
                        <MessageSquare className="h-4 w-4 text-slate-400" />
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400">
                        {g.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {g.description}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="Siz hali birorta boshqaruv guruhiga biriktirilmagansiz"
              description="7 ta yo‘nalish guruhi va Kelajak Liderlari guruhi faqat tasdiqlangan koordinatorlar, Kelajak Liderlari va Super Administrator uchun ochiq."
              actionHref="/kabinet"
              actionLabel="Shaxsiy kabinetga qaytish"
            />
            <Card className="p-6">
              <h3 className="font-display text-base font-bold mb-3">
                Platformadagi 8 ta rasmiy boshqaruv guruhi tuzilmasi
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                {OFFICIAL_DIRECTIONS.map((d, i) => (
                  <div
                    key={d.slug}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 font-medium"
                  >
                    {i + 1}. {d.name} koordinatori guruhi
                  </div>
                ))}
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 font-bold text-blue-700 dark:text-sky-300">
                  8. Kelajak Liderlari guruhi (1+61)
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
