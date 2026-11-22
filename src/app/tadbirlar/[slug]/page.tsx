import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { PageHeader } from "@/core/ui/shared/empty-state";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";
import { getEventBySlug } from "@/core/db/queries";
import { formatUzDate } from "@/core/utils";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();

  return (
    <div>
      <PageHeader
        badge={ev.school ? `${ev.school.school_number}-maktab tadbiri` : "Tuman tadbiri"}
        title={ev.title}
        description={ev.location}
      >
        <Link href="/tadbirlar">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
            Barcha tadbirlar
          </Button>
        </Link>
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-blue-500" />
              {formatUzDate(ev.starts_at, true)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-teal-500" />
              {ev.location}
            </span>
          </div>
          {ev.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ev.cover_image_url}
              alt={ev.title}
              className="w-full max-h-[420px] rounded-xl object-cover"
            />
          )}
          <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {ev.description}
          </div>
        </Card>
      </div>
    </div>
  );
}
