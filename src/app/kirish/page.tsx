import { PageHeader } from "@/components/shared/empty-state";
import { LoginForm } from "@/components/features/auth/auth-forms";

export const metadata = {
  title: "Tizimga kirish",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div>
      <PageHeader
        badge="Baliqchi tumani O‘quvchilar Kengashi"
        title="Shaxsiy kabinetga kirish"
        description="Ovoz berish, guruhlarda muloqot qilish va loyihalarni boshqarish uchun hisobingizga kiring."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <LoginForm redirectTo={sp.redirect} />
      </div>
    </div>
  );
}
