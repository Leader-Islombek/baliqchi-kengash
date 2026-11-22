import Link from "next/link";
import { Megaphone, Pin } from "lucide-react";
import { PageHeader, EmptyState } from "@/core/ui/shared/empty-state";
import { Badge, Card, CardContent } from "@/core/ui/primitives/card";
import { getAnnouncements } from "@/core/db/queries";
import { formatUzDate } from "@/core/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Yangiliklar va e’lonlar",
};

export default async function NewsPage() {
  const items = await getAnnouncements(30);

  return (
    <div>
      <PageHeader
        badge="Baliqchi tumani matbuot xizmati"
        title="Yangiliklar va rasmiy e’lonlar"
        description="Tuman O‘quvchilar Kengashi va 61 ta maktab hayotidagi eng muhim yangiliklar, e’lonlar va natijalar."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link key={item.id} href={`/yangiliklar/${item.slug}`} className="group">
                <Card className="h-full overflow-hidden hover:border-blue-500/40 hover:shadow-lg">
                  {item.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover_image_url}
                      alt={item.title}
                      className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{formatUzDate(item.published_at)}</span>
                      {item.is_pinned && (
                        <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-sky-400">
                          <Pin className="h-3 w-3" /> Muhim
                        </Badge>
                      )}
                    </div>
                    <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400">
                      {item.title}
                    </h2>
                    {item.excerpt && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                        {item.excerpt}
                      </p>
                    )}
                    <div className="text-xs font-medium text-teal-600 dark:text-teal-400">
                      {item.school ? `${item.school.school_number}-maktab` : "Tuman miqyosida"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Megaphone className="h-7 w-7" />}
            title="Hozircha yangiliklar e’lon qilinmagan"
            description="Tuman Kelajak Lideri, Maktab Kelajak Liderlari yoki Super Administrator yangilik joylashi bilan bu yerda ko‘rinadi."
            actionHref="/kabinet"
            actionLabel="Shaxsiy kabinetga o‘tish"
          />
        )}
      </div>
    </div>
  );
}
