"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Каркас публичного сайта (шапка + подвал). Админка Payload (/cms) живёт в отдельном
 * route group и никогда сюда не попадает.
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" id="main">
        {children}
      </main>
      <Footer />
    </div>
  );
}
