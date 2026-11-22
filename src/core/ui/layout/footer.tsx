import Link from "next/link";
import { MapPin, Shield, Sparkles } from "lucide-react";
import { PLATFORM_INFO } from "@/core/config/official-data";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#060B19] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-4 space-y-2.5 sm:space-y-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#2563EB] to-[#22D3EE] text-white shadow-md shadow-[#4F46E5]/25 shrink-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <div className="font-display text-sm sm:text-base font-extrabold text-white leading-tight">
                  {PLATFORM_INFO.name}
                </div>
                <div className="text-[11px] sm:text-xs text-[#22D3EE]">
                  61 ta maktab raqamli ekotizimi
                </div>
              </div>
            </Link>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-400">
              {PLATFORM_INFO.decreeRef} asosida Baliqchi tumani o‘quvchilarining yagona tashabbus va
              ovoz berish platformasi.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
              <span>{PLATFORM_INFO.region}</span>
            </div>
          </div>

          {/* Mobile'da ixcham 2 ustunli, planshet/desktop'da 3 ustunli havolalar */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3 lg:col-span-8">
            <div>
              <h4 className="font-display text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
                Kengash
              </h4>
              <ul className="mt-2.5 sm:mt-3.5 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="/haqida" className="hover:text-[#22D3EE] transition-colors">Platforma haqida</Link></li>
                <li><Link href="/nizom" className="hover:text-[#22D3EE] transition-colors">Rasmiy Nizom</Link></li>
                <li><Link href="/yonalishlar" className="hover:text-[#22D3EE] transition-colors">7 ta yo‘nalish</Link></li>
                <li><Link href="/maktablar" className="hover:text-[#22D3EE] transition-colors">61 ta maktab</Link></li>
                <li><Link href="/kelajak-liderlari" className="hover:text-[#22D3EE] transition-colors">Kelajak Liderlari</Link></li>
                <li><Link href="/koordinatorlar" className="hover:text-[#22D3EE] transition-colors">Koordinatorlar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
                Loyihalar
              </h4>
              <ul className="mt-2.5 sm:mt-3.5 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href="/loyihalar" className="hover:text-[#22D3EE] transition-colors">Loyihalar katalogi</Link></li>
                <li><Link href="/ovoz-berish" className="hover:text-[#22D3EE] transition-colors">Haftalik ovoz berish</Link></li>
                <li><Link href="/goliblar" className="hover:text-[#22D3EE] transition-colors">Haftalik g‘oliblar</Link></li>
                <li><Link href="/amalga-oshirilayotgan" className="hover:text-[#22D3EE] transition-colors">Monitoring</Link></li>
                <li><Link href="/reyting" className="hover:text-[#22D3EE] transition-colors">Maktablar reytingi</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1 border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
              <h4 className="font-display text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
                Axborot va Kabinet
              </h4>
              <ul className="mt-2.5 sm:mt-3.5 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-1 sm:space-y-2 sm:gap-y-0 text-xs sm:text-sm">
                <li><Link href="/yangiliklar" className="hover:text-[#22D3EE] transition-colors">Yangiliklar</Link></li>
                <li><Link href="/tadbirlar" className="hover:text-[#22D3EE] transition-colors">Tadbirlar</Link></li>
                <li><Link href="/guruhlar" className="hover:text-[#22D3EE] transition-colors">8 ta guruh</Link></li>
                <li><Link href="/kabinet" className="hover:text-[#22D3EE] transition-colors">Shaxsiy kabinet</Link></li>
                <li><Link href="/bildirishnomalar" className="hover:text-[#22D3EE] transition-colors">Bildirishnomalar</Link></li>
                <li><Link href="/royxatdan-otish" className="hover:text-[#22D3EE] transition-colors">Ro‘yxatdan o‘tish</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-7 sm:mt-10 flex flex-col items-center justify-between gap-2.5 border-t border-white/10 pt-4 sm:pt-5 text-[11px] sm:text-xs text-slate-400 sm:flex-row text-center sm:text-left">
          <p>© {new Date().getFullYear()} {PLATFORM_INFO.name}.</p>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
            <span>O‘quvchilar ma’lumotlari qat’iy himoyalangan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
