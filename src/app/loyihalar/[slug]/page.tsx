import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock, School, User } from "lucide-react";
import { PageHeader } from "@/components/shared/empty-state";
import { Badge, Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/fields";
import { VoteButton } from "@/components/shared/vote-button";
import {
  ProjectCommentsSection,
  ProjectUpdateForm,
} from "@/components/features/projects/project-interactions";
import { PROJECT_STATUS_META } from "@/lib/constants/official-data";
import {
  getActiveVotingData,
  getCurrentUserContext,
  getProjectBySlug,
} from "@/lib/data/queries";
import { hasPermission } from "@/lib/auth/permissions";
import { formatUzDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userCtx = await getCurrentUserContext();
  const [{ project, updates, comments }, votingData] = await Promise.all([
    getProjectBySlug(slug),
    getActiveVotingData(userCtx?.user.id),
  ]);

  if (!project) notFound();

  const statusMeta = PROJECT_STATUS_META[project.status];
  const canUpdateProgress =
    hasPermission(userCtx, "project:update_progress") &&
    ["approved", "in_progress"].includes(project.status);

  const isInActiveVoting =
    project.status === "voting" &&
    votingData.activeWeek?.id === project.voting_week_id;

  const sections = [
    { label: "Muammo va dolzarblik", value: project.problem_statement },
    { label: "Loyihaning maqsadi", value: project.goal },
    { label: "Taklif qilinayotgan yechim", value: project.proposed_solution },
    { label: "Amalga oshirish rejasi", value: project.implementation_plan },
    { label: "Kutilayotgan natija", value: project.expected_result },
    { label: "Kerakli resurslar", value: project.required_resources },
  ];

  return (
    <div>
      <PageHeader
        badge={`${project.direction?.name || "Yo‘nalish"} • ${statusMeta.label}`}
        title={project.title}
        description={project.goal}
      >
        <Link href="/loyihalar">
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
            Barcha loyihalar
          </Button>
        </Link>
        {isInActiveVoting && (
          <VoteButton
            projectId={project.id}
            initialVotes={project.votes_count}
            userVotedProjectId={votingData.userVotedProjectId}
            isAuthenticated={Boolean(userCtx)}
          />
        )}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Chap asosiy ustun */}
          <div className="lg:col-span-8 space-y-6">
            {project.cover_image_url && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.cover_image_url}
                  alt={project.title}
                  className="max-h-[420px] w-full object-cover"
                />
              </div>
            )}

            {/* 12 ta band tafsiloti */}
            <Card>
              <CardContent className="p-6 sm:p-8 space-y-6">
                {sections.map((sec) => (
                  <div key={sec.label}>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {sec.label}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {sec.value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Amalga oshirish jarayoni va haftalik yangilanishlar */}
            <Card className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Amalga oshirish jarayoni va monitoring
                </h2>
                <Badge className={statusMeta.colorClass}>{statusMeta.label}</Badge>
              </div>
              <ProgressBar value={project.progress_percent} showLabel />

              {updates.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {updates.map((upd) => (
                    <div
                      key={upd.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          {upd.progress_percent}% bajarildi
                        </span>
                        <span>{formatUzDate(upd.created_at, true)}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                        {upd.title}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {upd.content}
                      </p>
                      {upd.results_achieved && (
                        <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                          <strong>Natija:</strong> {upd.results_achieved}
                        </div>
                      )}
                      {upd.challenges && (
                        <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                          <strong>Muammolar:</strong> {upd.challenges}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Loyiha amaliyotga o‘tkazilgach haftalik yangilanishlar shu yerda qayd etiladi.
                </p>
              )}
            </Card>

            {canUpdateProgress && (
              <ProjectUpdateForm
                projectId={project.id}
                currentProgress={project.progress_percent}
              />
            )}

            <ProjectCommentsSection
              projectId={project.id}
              comments={comments}
              isAuthenticated={Boolean(userCtx)}
            />
          </div>

          {/* O'ng yon panel */}
          <aside className="lg:col-span-4 space-y-5">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Loyiha pasporti
                </span>
                <Badge className={statusMeta.colorClass}>{statusMeta.label}</Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="flex items-center gap-2 text-slate-500">
                    <School className="h-4 w-4 text-blue-500" />
                    Maktab
                  </span>
                  <Link
                    href={project.school ? `/maktablar/${project.school.slug}` : "/maktablar"}
                    className="font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                  >
                    {project.school ? `${project.school.school_number}-maktab` : "Tuman"}
                  </Link>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="flex items-center gap-2 text-slate-500">
                    <User className="h-4 w-4 text-teal-500" />
                    Muallif
                  </span>
                  <span className="font-semibold">
                    {project.author
                      ? `${project.author.first_name} ${project.author.last_name}`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock className="h-4 w-4 text-sky-500" />
                    Muddat
                  </span>
                  <span className="font-semibold">{project.duration_text}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Oxirgi yangilanish
                  </span>
                  <span className="font-semibold">{formatUzDate(project.updated_at)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Ovozlar soni
                  </span>
                  <span className="font-display text-lg font-bold text-blue-600 dark:text-sky-400">
                    {project.votes_count}
                  </span>
                </div>
              </div>

              {isInActiveVoting && (
                <div className="pt-2">
                  <VoteButton
                    projectId={project.id}
                    initialVotes={project.votes_count}
                    userVotedProjectId={votingData.userVotedProjectId}
                    isAuthenticated={Boolean(userCtx)}
                  />
                </div>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
