import { PageHeader } from "@/core/ui/shared/empty-state";
import { RegisterForm } from "@/modules/accounts/components/auth-forms";
import { getDirections, getSchools } from "@/core/db/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ro‘yxatdan o‘tish",
};

export default async function RegisterPage() {
  const [schools, directions] = await Promise.all([getSchools(), getDirections()]);
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || null;

  return (
    <div>
      <PageHeader
        badge="61 ta maktab o‘quvchilari uchun"
        title="Platformaga qo‘shilish"
        description="O‘z maktabingiz va sinfingizni tanlab ro‘yxatdan o‘ting, haftalik ovoz berishda qatnashing va g‘oyalaringizni ilgari suring."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <RegisterForm
          schools={schools}
          directions={directions}
          telegramBotUsername={telegramBotUsername}
        />
      </div>
    </div>
  );
}
