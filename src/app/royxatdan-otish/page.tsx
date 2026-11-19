import { PageHeader } from "@/components/shared/empty-state";
import { RegisterForm } from "@/components/features/auth/auth-forms";
import { getDirections, getSchools } from "@/lib/data/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Ro‘yxatdan o‘tish",
};

export default async function RegisterPage() {
  const [schools, directions] = await Promise.all([getSchools(), getDirections()]);

  return (
    <div>
      <PageHeader
        badge="61 ta maktab o‘quvchilari uchun"
        title="Platformaga qo‘shilish"
        description="O‘z maktabingiz va sinfingizni tanlab ro‘yxatdan o‘ting, haftalik ovoz berishda qatnashing va g‘oyalaringizni ilgari suring."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <RegisterForm schools={schools} directions={directions} />
      </div>
    </div>
  );
}
