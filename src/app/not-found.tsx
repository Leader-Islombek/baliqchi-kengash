import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-sky-400">
        <Compass className="h-8 w-8" />
      </div>
      <span className="font-display text-sm font-bold text-blue-600 dark:text-sky-400">404</span>
      <h1 className="mt-1 font-display text-3xl font-bold text-slate-900 dark:text-white">
        Sahifa topilmadi
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Siz qidirayotgan sahifa ko‘chirilgan yoki mavjud emas.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button variant="primary">Bosh sahifa</Button>
        </Link>
        <Link href="/loyihalar">
          <Button variant="outline">Loyihalar katalogi</Button>
        </Link>
      </div>
    </div>
  );
}
