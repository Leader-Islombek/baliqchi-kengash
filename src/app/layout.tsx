import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/core/ui/shared/providers";
import { Navbar } from "@/core/ui/layout/navbar";
import { Footer } from "@/core/ui/layout/footer";
import { getCurrentUserContext } from "@/core/db/queries";
import { PLATFORM_INFO } from "@/core/config/official-data";
import { getAdminPanelPath } from "@/core/config/admin-path";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${PLATFORM_INFO.name} — 61 maktab raqamli ekotizimi`,
    template: `%s | ${PLATFORM_INFO.shortName}`,
  },
  description:
    "61 ta maktab, minglab yoshlar va yagona maqsad — Baliqchi tumani kelajagini birgalikda yaratish.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userCtx = await getCurrentUserContext();
  const adminPath = userCtx?.isSuperAdmin ? getAdminPanelPath() : null;

  return (
    <html lang="uz" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#F5F8FF] text-[#172033] dark:bg-[#0B1224] dark:text-slate-100 antialiased">
        <Providers>
          <Navbar userCtx={userCtx} adminPath={adminPath} />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
