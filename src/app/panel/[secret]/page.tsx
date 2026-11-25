import { notFound } from "next/navigation";
import { PageHeader } from "@/core/ui/shared/empty-state";
import { AdminConsole } from "@/modules/administration/components/admin-console";
import { getAdminOverviewData, getCurrentUserContext } from "@/core/db/queries";
import { getTelegramBotAdminData } from "@/modules/telegram-admin/queries";
import { isValidAdminSecretSlug } from "@/core/config/admin-path";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Boshqaruv Markazi",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SecretAdminPanelPage({
  params,
}: {
  params: Promise<{ secret: string }>;
}) {
  const { secret } = await params;

  // 1) Maxfiy URL kalitini timing-safe tekshirish — noto'g'ri bo'lsa 404!
  if (!isValidAdminSecretSlug(secret)) {
    notFound();
  }

  // 2) Faqat tasdiqlangan Super Administrator kira oladi — aks holda 404 (URL borligi sezilmasin!)
  const userCtx = await getCurrentUserContext();
  if (!userCtx || !userCtx.isSuperAdmin) {
    notFound();
  }

  const [data, telegramData] = await Promise.all([
    getAdminOverviewData(),
    getTelegramBotAdminData(),
  ]);

  return (
    <div>
      <PageHeader
        badge="Yopiq boshqaruv markazi • Audit bilan himoyalangan"
        title="Super Administrator Boshqaruv Markazi"
        description="Foydalanuvchilar, rollar, 61 ta maktab, yo‘nalishlar, loyihalar moderatsiyasi, haftalik ovoz berish sikli, Telegram Bot boshqaruvi, reyting formulasi va audit logini to‘liq boshqaring."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <AdminConsole
          pendingRoles={data.pendingRoles}
          activeCoordinators={data.activeCoordinators}
          users={data.users}
          projects={data.projects}
          votingWeeks={data.votingWeeks}
          schools={data.schools}
          directions={data.directions}
          rankingSettings={data.rankingSettings}
          logs={data.logs}
          telegramData={telegramData}
        />
      </div>
    </div>
  );
}
