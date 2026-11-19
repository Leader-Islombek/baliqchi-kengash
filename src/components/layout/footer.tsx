import Link from "next/link";
import { MapPin, Shield, Sparkles } from "lucide-react";
import { PLATFORM_INFO } from "@/lib/constants/official-data";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-[#071226] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-500 to-teal-500 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-base font-bold text-white">
                  {PLATFORM_INFO.name}
                </div>
                <div className="text-xs text-sky-300/80">61 ta maktab raqamli ekotizimi</div>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              {PLATFORM_INFO.decreeRef} asosida faoliyat yurituvchi Baliqchi tumani o‘quvchilarining
              yagona tashabbus, ovoz berish va hamkorlik platformasi.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="h-4 w-4 text-teal-400 shrink-0" />
              <span>{PLATFORM_INFO.region}</span>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Kengash tuzilmasi
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/haqida" className="hover:text-sky-400 transition-colors">Platforma haqida</Link></li>
              <li><Link href="/nizom" className="hover:text-sky-400 transition-colors">O‘quvchilar Kengashi Nizomi</Link></li>
              <li><Link href="/yonalishlar" className="hover:text-sky-400 transition-colors">7 ta rasmiy yo‘nalish</Link></li>
              <li><Link href="/maktablar" className="hover:text-sky-400 transition-colors">61 ta maktab profili</Link></li>
              <li><Link href="/kelajak-liderlari" className="hover:text-sky-400 transition-colors">Kelajak Liderlari</Link></li>
              <li><Link href="/koordinatorlar" className="hover:text-sky-400 transition-colors">Koordinatorlar</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Loyihalar va Ovoz berish
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/loyihalar" className="hover:text-sky-400 transition-colors">Loyihalar katalogi</Link></li>
              <li><Link href="/ovoz-berish" className="hover:text-sky-400 transition-colors">Haftalik ovoz berish</Link></li>
              <li><Link href="/goliblar" className="hover:text-sky-400 transition-colors">Haftalik g‘oliblar arxivi</Link></li>
              <li><Link href="/amalga-oshirilayotgan" className="hover:text-sky-400 transition-colors">Amalga oshirilayotgan loyihalar</Link></li>
              <li><Link href="/reyting" className="hover:text-sky-400 transition-colors">Faol maktablar reytingi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Axborot va Kabinet
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/yangiliklar" className="hover:text-sky-400 transition-colors">Yangiliklar</Link></li>
              <li><Link href="/tadbirlar" className="hover:text-sky-400 transition-colors">Tadbirlar</Link></li>
              <li><Link href="/guruhlar" className="hover:text-sky-400 transition-colors">8 ta boshqaruv guruhi</Link></li>
              <li><Link href="/kabinet" className="hover:text-sky-400 transition-colors">Shaxsiy kabinet</Link></li>
              <li><Link href="/bildirishnomalar" className="hover:text-sky-400 transition-colors">Bildirishnomalar</Link></li>
              <li><Link href="/royxatdan-otish" className="hover:text-sky-400 transition-colors">Ro‘yxatdan o‘tish</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {PLATFORM_INFO.name}. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-teal-400" />
            <span>O‘quvchilar shaxsiy ma’lumotlari qat’iy himoyalangan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
