import Link from "next/link";
import { PageHeader } from "@/core/ui/shared/empty-state";
import { Button } from "@/core/ui/primitives/button";
import { SchoolsGrid } from "@/modules/schools/components/schools-grid";
import { getSchools } from "@/core/db/queries";

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
