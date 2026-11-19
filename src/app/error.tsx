"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
        Kutilmagan xatolik yuz berdi
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {error.message || "Sahifani yuklashda muammo yuz berdi. Iltimos qayta urinib ko‘ring."}
      </p>
      <Button variant="primary" onClick={reset} className="mt-6">
        <RotateCcw className="h-4 w-4" />
        Qayta yuklash
      </Button>
    </div>
  );
}
