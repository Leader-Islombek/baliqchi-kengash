import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAnnouncementBySlug } from "@/lib/data/queries";
import { formatUzDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getAnnouncementBySlug(slug);
  if (!item) notFound();

  return (
    <div>
      <PageHeader
        badge={item.school ? `${item.school.school_number}-maktab` : "Tuman yangiligi"}
        title={item.title}
        description={item.excerpt || ""}
      >
        <Link href="/yangiliklar">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
            Barcha yangiliklar
          </Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>{formatUzDate(item.published_at, true)}</span>
          </div>
          {item.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="w-full max-h-[420px] rounded-xl object-cover"
            />
          )}
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {item.content}
          </div>
        </Card>
      </div>
    </div>
  );
}
