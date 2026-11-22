import Link from "next/link";
import { ArrowUpRight, Heart, School as SchoolIcon, User } from "lucide-react";
import { Badge, Card, CardContent } from "@/core/ui/primitives/card";
import { ProgressBar } from "@/core/ui/primitives/fields";
import { DirectionIcon, getDirectionStyle } from "@/core/ui/shared/direction-icon";
import { SafeProjectCover } from "@/core/ui/shared/safe-cover-image";
import { Tilt3DCard } from "@/core/ui/shared/scene-3d";
import { PROJECT_STATUS_META } from "@/core/config/official-data";
import { formatUzDate } from "@/core/utils";
import type { Project } from "@/core/types/database";

export function ProjectCard({ project }: { project: Project }) {
  const statusMeta = PROJECT_STATUS_META[project.status];
  const dirStyle = getDirectionStyle(project.direction?.accent_color);
  const showProgress = ["approved", "in_progress", "completed"].includes(project.status);

  return (
    <Tilt3DCard glowColor="rgba(79, 70, 229, 0.16)" maxTilt={5}>
      <Card className="group flex h-full flex-col overflow-hidden rounded-3xl hover:border-[#4F46E5]/50 hover:shadow-xl hover:shadow-[#4F46E5]/15">
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#060B19] via-[#101B3B] to-[#1E1B4B]">
          <SafeProjectCover
            src={project.cover_image_url}
            alt={project.title}
            iconName={project.direction?.icon_name}
            accentColor={project.direction?.accent_color}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#060B19]/75 to-transparent" />
          <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5">
            <Badge className={`${statusMeta.colorClass} backdrop-blur-md bg-white/95 dark:bg-[#060B19]/85`}>
              {statusMeta.label}
            </Badge>
          </div>
          <div className="absolute right-3.5 top-3.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#060B19]/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/15">
              <Heart className="h-3.5 w-3.5 text-[#22D3EE]" />
              {project.votes_count}
            </span>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col p-5">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-medium">
            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 font-semibold ${dirStyle.bg} ${dirStyle.text}`}>
              <DirectionIcon name={project.direction?.icon_name} className="h-3.5 w-3.5" />
              {project.direction?.name || "Yo‘nalish"}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[#5B677F] dark:text-slate-400">
              {formatUzDate(project.created_at)}
            </span>
          </div>

          <Link
            href={`/loyihalar/${project.slug}`}
            className="font-display text-lg font-bold leading-snug text-[#111827] dark:text-white group-hover:text-[#4F46E5] dark:group-hover:text-[#22D3EE] transition-colors line-clamp-2"
          >
            {project.title}
          </Link>

          <p className="mt-2 text-sm text-[#5B677F] dark:text-slate-400 line-clamp-2 flex-1 leading-relaxed">
            {project.goal}
          </p>

          {showProgress && (
            <div className="mt-4">
              <ProgressBar value={project.progress_percent} showLabel />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-[#EEF2FF] dark:border-[#233566] pt-3.5 text-xs text-[#5B677F] dark:text-slate-400">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 truncate font-medium text-[#111827] dark:text-slate-200">
                <SchoolIcon className="h-3.5 w-3.5 shrink-0 text-[#4F46E5] dark:text-[#818CF8]" />
                <span className="truncate">
                  {project.school
                    ? `${project.school.school_number}-maktab`
                    : "Baliqchi tumani"}
                </span>
              </span>
              {project.author && (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <User className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                  <span className="truncate">
                    {project.author.first_name} {project.author.last_name}
                  </span>
                </span>
              )}
            </div>
            <Link
              href={`/loyihalar/${project.slug}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#EEF2FF] dark:bg-[#16234A] px-3 py-1.5 font-semibold text-[#4F46E5] dark:text-[#22D3EE] hover:bg-gradient-to-r hover:from-[#4F46E5] hover:to-[#2563EB] hover:text-white transition-all"
            >
              Batafsil
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </Tilt3DCard>
  );
}
