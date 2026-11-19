"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Heart, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { castWeeklyVoteAction } from "@/actions/voting";

export function VoteButton({
  projectId,
  initialVotes,
  userVotedProjectId,
  isAuthenticated,
  disabledReason,
}: {
  projectId: string;
  initialVotes: number;
  userVotedProjectId?: string | null;
  isAuthenticated: boolean;
  disabledReason?: string;
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [votedId, setVotedId] = useState<string | null>(userVotedProjectId || null);
  const [isPending, startTransition] = useTransition();

  const votedForThis = votedId === projectId;
  const votedForAnother = Boolean(votedId && votedId !== projectId);

  function handleVote() {
    if (!isAuthenticated) {
      toast.info("Ovoz berish uchun avval tizimga kiring yoki ro‘yxatdan o‘ting.");
      return;
    }
    startTransition(async () => {
      const res = await castWeeklyVoteAction(projectId);
      if (res.ok) {
        setVotedId(projectId);
        if (typeof res.votesCount === "number") {
          setVotes(res.votesCount);
        } else {
          setVotes((v) => v + 1);
        }
        toast.success(res.message);
      } else {
        toast.error(res.message);
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
      <Button variant="outline" disabled className="w-full sm:w-auto" title="Haftasiga faqat 1 ta ovoz">
        <Lock className="h-4 w-4" />
        Haftalik ovoz ishlatilgan ({votes})
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      onClick={handleVote}
      disabled={isPending || Boolean(disabledReason)}
      title={disabledReason}
      className="w-full sm:w-auto"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className="h-4 w-4" />
      )}
      Ovoz berish ({votes})
    </Button>
  );
}
