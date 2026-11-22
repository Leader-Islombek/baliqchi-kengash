import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getCurrentUserContext } from "@/lib/data/queries";
import { PLATFORM_INFO } from "@/lib/constants/official-data";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: `${PLATFORM_INFO.name} — 61 maktab raqamli ekotizimi`,
    template: `%s | ${PLATFORM_INFO.shortName}`,
  },
  description: PLATFORM_INFO.subtitle,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userCtx = await getCurrentUserContext();

  return (
    <html lang="uz" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar userCtx={userCtx} />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
