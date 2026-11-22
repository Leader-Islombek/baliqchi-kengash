"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Heart, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/core/ui/primitives/button";
import { MotionModal } from "@/core/ui/shared/motion-primitives";
import { castWeeklyVoteAction } from "@/modules/voting/actions";

export function VoteButton({
  projectId,
  projectTitle,
  directionName,
  schoolName,
  initialVotes,
  userVotedProjectId,
  isAuthenticated,
  disabledReason,
  onVotedSuccess,
}: {
  projectId: string;
  projectTitle?: string;
  directionName?: string | null;
  schoolName?: string | null;
  initialVotes: number;
  userVotedProjectId?: string | null;
  isAuthenticated: boolean;
  disabledReason?: string;
  onVotedSuccess?: (projectId: string, newVotes: number) => void;
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [votedId, setVotedId] = useState<string | null>(userVotedProjectId || null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const submittedRef = useRef(false);

  const effectiveVotedId = userVotedProjectId || votedId;
  const votedForThis = effectiveVotedId === projectId;
  const votedForAnother = Boolean(effectiveVotedId && effectiveVotedId !== projectId);

  function openConfirm() {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setConfirmOpen(true);
  }

  function handleConfirmVote() {
    if (submittedRef.current || isPending) return;
    submittedRef.current = true;

    startTransition(async () => {
      try {
        const res = await castWeeklyVoteAction(projectId);
        if (res.ok) {
          const nextVotes = typeof res.votesCount === "number" ? res.votesCount : votes + 1;
          setVotedId(projectId);
          setVotes(nextVotes);
          setConfirmOpen(false);
          onVotedSuccess?.(projectId, nextVotes);
          toast.success(res.message);
        } else {
          submittedRef.current = false;
          toast.error(res.message);
        }
      } catch {
        submittedRef.current = false;
        toast.error("Tarmoq xatoligi yuz berdi. Qayta urinib ko‘ring.");
      }
    });
  }

  if (votedForThis) {
    return (
      <Button variant="teal" disabled className="w-full sm:w-auto">
        <CheckCircle2 className="h-4 w-4" />
        Ovoz berdingiz ({votes})
      </Button>
    );
  }

  if (votedForAnother) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full sm:w-auto"
        title="Haftasiga barcha 7 yo‘nalish bo‘yicha faqat 1 ta ovoz"
      >
        <Lock className="h-4 w-4" />
        Haftalik ovoz ishlatilgan ({votes})
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="primary"
        onClick={openConfirm}
        disabled={isPending || Boolean(disabledReason)}
        title={disabledReason}
        className="w-full sm:w-auto"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        Ovoz berish ({votes})
      </Button>

      {/* Ovoz berishni tasdiqlash modali */}
      <MotionModal
        open={confirmOpen}
        onClose={() => !isPending && setConfirmOpen(false)}
        title="Ovozingizni tasdiqlang"
        description="Quyidagi loyihaga o‘z haftalik yagona ovozingizni bermoqchisiz:"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#DCE5F5] dark:border-[#22345A] bg-[#F5F8FF] dark:bg-[#0B1224] p-4 space-y-1.5">
            <div className="text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8]">
              {directionName || "Yo‘nalish"} {schoolName ? `• ${schoolName}` : ""}
            </div>
            <div className="font-display text-base font-bold text-[#172033] dark:text-white">
              {projectTitle || "Tanlangan loyiha"}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Muhim qoida:</strong> Har bir o‘quvchi haftasiga barcha 7 ta yo‘nalish bo‘yicha{" "}
              <strong>jami 1 ta ovoz</strong> bera oladi. Tasdiqlangandan so‘ng ovozni o‘zgartirib bo‘lmaydi.
            </span>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Bekor qilish
            </Button>
            <Button
              variant="teal"
              onClick={handleConfirmVote}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Ha, ovoz beraman
            </Button>
          </div>
        </div>
      </MotionModal>

      {/* Kirish talab qilinishi modali */}
      <MotionModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Ovoz berish uchun tizimga kiring"
        description="Faqat ro‘yxatdan o‘tgan va tasdiqlangan o‘quvchilar haftasiga 1 marta adolatli ovoz bera oladi."
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          <Link href="/kirish?redirect=/ovoz-berish" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Tizimga kirish
            </Button>
          </Link>
          <Link href="/royxatdan-otish" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              Ro‘yxatdan o‘tish
            </Button>
          </Link>
        </div>
      </MotionModal>
    </>
  );
}
