import { PageHeader, EmptyState } from "@/components/shared/empty-state";
import { NotificationsList } from "@/components/features/notifications/notifications-list";
import { getCurrentUserContext, getUserNotifications } from "@/lib/data/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bildirishnomalar",
};

export default async function NotificationsPage() {
  const userCtx = await getCurrentUserContext();

  return (
    <div>
      <PageHeader
        badge="Shaxsiy xabarnomalar"
        title="Bildirishnomalar"
        description="Rol tasdiqlanishi, loyiha holati o‘zgarishlari, ovoz berish natijalari va guruh e’lonlari."
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {!userCtx ? (
          <EmptyState
            title="Bildirishnomalarni ko‘rish uchun kiring"
            description="Tizimga kirganingizdan so‘ng barcha shaxsiy xabarnomalaringiz shu yerda ko‘rinadi."
            actionHref="/kirish"
            actionLabel="Tizimga kirish"
          />
        ) : (
          <NotificationsList items={await getUserNotifications(userCtx.user.id)} />
        )}
      </div>
    </div>
  );
}
