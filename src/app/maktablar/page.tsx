import Link from "next/link";
import { PageHeader } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { SchoolsGrid } from "@/components/features/schools/schools-grid";
import { getSchools } from "@/lib/data/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "61 ta maktab",
};

export default async function SchoolsPage() {
  const schools = await getSchools();

  return (
    <div>
      <PageHeader
        badge="Baliqchi tumani • 61 ta umumiy o‘rta ta’lim maktabi"
        title="61 ta maktabning mustaqil raqamli profillari"
        description="Har bir maktab o‘zining Kelajak Lideri, 7 nafar yo‘nalish koordinatori, sinf vakillari, klublari, loyihalari va statistikasi bilan alohida sahifaga ega."
      >
        <Link href="/reyting">
          <Button variant="teal">Faol maktablar reytingi</Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SchoolsGrid schools={schools} />
      </div>
    </div>
  );
}
