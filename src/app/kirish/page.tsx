import { PageHeader } from "@/core/ui/shared/empty-state";
import { LoginForm } from "@/modules/accounts/components/auth-forms";

export const metadata = {
  title: "Tizimga kirish",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || null;
  return (
    <div>
      <PageHeader
        badge="Baliqchi tumani O‘quvchilar Kengashi"
        title="Shaxsiy kabinetga kirish"
        description="Ovoz berish, guruhlarda muloqot qilish va loyihalarni boshqarish uchun hisobingizga kiring."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <LoginForm redirectTo={sp.redirect} telegramBotUsername={telegramBotUsername} />
      </div>
    </div>
  );
}
