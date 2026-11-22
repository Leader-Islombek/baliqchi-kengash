import { ShieldAlert } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { AdminConsole } from "@/modules/administration/components/admin-console";
import { getAdminOverviewData, getCurrentUserContext } from "@/core/db/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Super Administrator Paneli",
};

export default async function AdminPage() {
  const userCtx = await getCurrentUserContext();

  if (!userCtx || !userCtx.isSuperAdmin) {
    return (
      <div>
        <PageHeader
          badge="Yopiq boshqaruv bo‘limi"
          title="Super Administrator Paneli"
          description="Ushbu bo‘limga faqat tasdiqlangan Super Administrator kirishi mumkin."
        />
        <div className="mx-auto max-w-3xl px-4 py-12">
          <EmptyState
            icon={<ShieldAlert className="h-7 w-7" />}
            title="Kirish taqiqlangan"
            description="Sizda Super Administrator vakolati mavjud emas. Tizimni boshqarish uchun Super Admin hisobi bilan kiring."
            actionHref="/kabinet"
            actionLabel="Shaxsiy kabinetga qaytish"
          />
        </div>
      </div>
    );
  }

  const data = await getAdminOverviewData();

  return (
    <div>
      <PageHeader
        badge="Cheksiz tizim nazorati • Audit bilan himoyalangan"
        title="Super Administrator Boshqaruv Markazi"
        description="Foydalanuvchilar, rollar, 61 ta maktab, yo‘nalishlar, loyihalar moderatsiyasi, haftalik ovoz berish sikli, reyting formulasi va audit logini to‘liq boshqaring."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AdminConsole
          pendingRoles={data.pendingRoles}
          users={data.users}
          projects={data.projects}
          votingWeeks={data.votingWeeks}
          schools={data.schools}
          directions={data.directions}
          rankingSettings={data.rankingSettings}
          logs={data.logs}
        />
      </div>
    </div>
  );
}
