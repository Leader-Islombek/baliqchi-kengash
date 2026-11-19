import Link from "next/link";
import { ArrowUpRight, Heart, School as SchoolIcon, User } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/fields";
import { DirectionIcon, getDirectionStyle } from "@/components/shared/direction-icon";
import { PROJECT_STATUS_META } from "@/lib/constants/official-data";
import { formatUzDate } from "@/lib/utils";
import type { Project } from "@/types/database";

export function ProjectCard({ project }: { project: Project }) {
  const statusMeta = PROJECT_STATUS_META[project.status];
  const dirStyle = getDirectionStyle(project.direction?.accent_color);
  const showProgress = ["approved", "in_progress", "completed"].includes(project.status);

  return (
    <Card className="group flex h-full flex-col overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-950/5 dark:hover:shadow-blue-950/40">
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#0b172e] via-[#12264a] to-[#0f3554]">
        {project.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="bk-grid-bg flex h-full w-full items-center justify-center">
            <div className={`rounded-2xl p-4 ${dirStyle.bg} ${dirStyle.text}`}>
              <DirectionIcon name={project.direction?.icon_name} className="h-8 w-8" />
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className={`${statusMeta.colorClass} backdrop-blur-md bg-white/90 dark:bg-slate-950/80`}>
            {statusMeta.label}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Heart className="h-3.5 w-3.5 text-sky-400" />
            {project.votes_count}
          </span>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${dirStyle.bg} ${dirStyle.text}`}>
            <DirectionIcon name={project.direction?.icon_name} className="h-3.5 w-3.5" />
            {project.direction?.name || "Yo‘nalish"}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 dark:text-slate-400">
            {formatUzDate(project.created_at)}
          </span>
        </div>

        <Link
          href={`/loyihalar/${project.slug}`}
          className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2"
        >
          {project.title}
        </Link>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">
          {project.goal}
        </p>

        {showProgress && (
          <div className="mt-4">
            <ProgressBar value={project.progress_percent} showLabel />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 truncate">
              <SchoolIcon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              <span className="truncate">
                {project.school
                  ? `${project.school.school_number}-maktab`
                  : "Baliqchi tumani"}
              </span>
            </span>
            {project.author && (
              <span className="inline-flex items-center gap-1.5 truncate">
                <User className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                <span className="truncate">
                  {project.author.first_name} {project.author.last_name}
                </span>
              </span>
            )}
          </div>
          <Link
            href={`/loyihalar/${project.slug}`}
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-blue-600 dark:text-sky-400 hover:underline"
          >
            Batafsil
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
