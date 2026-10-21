import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSiteContent, getDbTexts } from "@/lib/alash/content";
import { I18nProvider } from "@/lib/alash/i18n";
import { ContentProvider } from "@/components/alash/ContentProvider";
import { BookingProvider } from "@/components/alash/BookingDialog";
import { SiteFrame } from "@/components/alash/SiteFrame";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Круглосуточный медицинский центр «Алаш» — Алматы",
  description:
    "Круглосуточный медцентр «Алаш» в Алматы: два филиала — Серкебаева, 81 и Пограничная, 1/1. 58 врачей, МРТ 3 Тесла, КТ 128 срезов, приём по времени. Запись онлайн и по телефону.",
  keywords: [
    "круглосуточная клиника Алматы",
    "медцентр Алаш",
    "клиника Алматы",
    "врачи Алматы",
    "МРТ Алматы",
    "КТ Алматы",
    "Серкебаева 81",
    "Пограничная 1/1",
  ],
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "Круглосуточный медицинский центр «Алаш»",
    description: "Два филиала — оба круглосуточно. 58 врачей, МРТ 3 Тесла, КТ 128 срезов. Алматы.",
    type: "website",
    locale: "ru_KZ",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [content, texts] = await Promise.all([getSiteContent(), getDbTexts()]);

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <I18nProvider dicts={texts}>
          <ContentProvider content={content}>
            <BookingProvider>
              <SiteFrame>{children}</SiteFrame>
            </BookingProvider>
          </ContentProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
