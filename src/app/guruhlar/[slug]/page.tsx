import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, Shield, Users } from "lucide-react";
import { PageHeader } from "@/core/ui/shared/empty-state";
import { Badge, Card } from "@/core/ui/primitives/card";
import { Button } from "@/core/ui/primitives/button";
import { GroupWorkspace } from "@/modules/groups/components/group-chat";
import { getCurrentUserContext, getGroupDetails } from "@/core/db/queries";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [userCtx, details] = await Promise.all([
    getCurrentUserContext(),
    getGroupDetails(slug),
  ]);

  if (!userCtx || !details.group) {
    notFound();
  }

  const { group, messages, members } = details;
  const isLeadersGroup = group.group_type === "future_leaders";
  const canManageGroup =
    userCtx.isSuperAdmin ||
    group.manager_id === userCtx.user.id ||
    (isLeadersGroup && userCtx.isDistrictLeader);

  return (
    <div>
      <PageHeader
        badge={
          isLeadersGroup
            ? "8-guruh • Kelajak Liderlari Mustaqil Boshqaruv Dashboardi"
            : `${group.direction?.name || "Yo‘nalish"} boshqaruv guruhi`
        }
        title={group.name}
        description={group.description || "Ichki muloqot, topshiriqlar, e’lonlar va hisobotlar."}
      >
        <Link href="/guruhlar">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
            Barcha guruhlar
          </Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Kelajak Liderlari maxsus ko'rsatkichlari */}
        {isLeadersGroup && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5 border-blue-500/30 bg-blue-500/5">
              <div className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                Guruh boshqaruvchisi
              </div>
              <div className="mt-1 font-display text-lg font-bold">
                {group.manager
                  ? `${group.manager.first_name} ${group.manager.last_name}`
                  : "Tuman Kelajak Lideri"}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs font-semibold text-slate-500">Faol a’zolar</div>
              <div className="mt-1 font-display text-lg font-bold">
                {members.length} / 62 nafar (1 + 61)
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs font-semibold text-slate-500">Topshiriq va e’lonlar</div>
              <div className="mt-1 font-display text-lg font-bold">
                {messages.filter((m) => m.message_type !== "message").length} ta
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <GroupWorkspace
              groupId={group.id}
              messages={messages}
              currentUserId={userCtx.user.id}
              canManageGroup={canManageGroup}
            />
          </div>

          {/* A'zolar ro'yxati */}
          <aside className="lg:col-span-4 space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-display text-base font-bold">
                  <Users className="h-4 w-4 text-blue-500" />
                  Guruh a’zolari ({members.length})
                </div>
                {isLeadersGroup && <Award className="h-4 w-4 text-amber-500" />}
              </div>

              {members.length > 0 ? (
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {m.user?.first_name} {m.user?.last_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {m.user?.school ? `${m.user.school.school_number}-maktab` : "Tuman darajasi"}
                        </div>
                      </div>
                      {m.member_role === "manager" && (
                        <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-sky-400 shrink-0">
                          <Shield className="h-3 w-3" /> Rahbar
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Tasdiqlangan koordinator va liderlar avtomatik ushbu ro‘yxatga qo‘shiladi.
                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
