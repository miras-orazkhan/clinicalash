"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Каркас публичного сайта (шапка + подвал). На /admin/* не отображается —
 * у админки свой каркас.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" id="main">
        {children}
      </main>
      <Footer />
      <Link
        href="/admin"
        className="fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border bg-white/90 text-muted-foreground shadow-sm transition hover:text-primary"
        aria-label="Админ-панель"
        title="Админ-панель"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </Link>
    </div>
  );
}
