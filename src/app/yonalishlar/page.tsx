import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/core/ui/shared/empty-state";
import { Card, CardContent } from "@/core/ui/primitives/card";
import { DirectionIcon, getDirectionStyle } from "@/core/ui/shared/direction-icon";
import { getDirections } from "@/core/db/queries";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "7 ta rasmiy yo‘nalish",
};

export default async function DirectionsPage() {
  const directions = await getDirections();

  return (
    <div>
      <PageHeader
        badge="O‘quvchilar Kengashi yo‘nalishlari"
        title="7 ta rasmiy yo‘nalish"
        description="Har bir yo‘nalish bo‘yicha 1 nafar Tuman yo‘nalish koordinatori va 61 ta maktabda 61 nafar Maktab koordinatori faoliyat yuritadi."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {directions.map((dir, index) => {
            const st = getDirectionStyle(dir.accent_color);
            return (
              <Link key={dir.id} href={`/yonalishlar/${dir.slug}`} className="group">
                <Card className="flex h-full flex-col overflow-hidden hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl">
                  <div className={`h-2 w-full bg-gradient-to-r ${st.gradient}`} />
                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex rounded-2xl p-3 ${st.bg} ${st.text}`}>
                        <DirectionIcon name={dir.icon_name} className="h-6 w-6" />
                      </div>
                      <span className="font-display text-xs font-bold text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                      {dir.name}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 flex-1">
                      {dir.description}
                    </p>
                    {dir.duties_summary && (
                      <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        {dir.duties_summary}
                      </div>
                    )}
                    <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-sky-400">
                      Yo‘nalish loyihalarini ko‘rish
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
