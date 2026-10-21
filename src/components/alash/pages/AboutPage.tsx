"use client";

import React from "react";
import { useI18n } from "@/lib/alash/i18n";
import { Breadcrumbs, CTABanner } from "../ui-bits";
import { useBooking } from "../BookingDialog";
import { waLink, WA_DEFAULT } from "@/lib/alash/clinic";
import { L } from "@/lib/alash/types";

export function AboutPage() {
  const { t, lang } = useI18n();
  const { openBooking } = useBooking();
  const since = 2012;
  const yearsNow = 2026 - since;

  const stats = [
    { n: String(yearsNow), label: t("about.stat1") },
    { n: "58", label: t("about.stat2") },
    { n: "47", label: t("about.stat3") },
    { n: "180 000+", label: t("about.stat4") },
    { n: "4.8", label: t("about.stat5") },
    { n: "78%", label: t("about.stat6") },
  ];

  const principles = [
    { title: t("about.pr1.title"), text: t("about.pr1.text") },
    { title: t("about.pr2.title"), text: t("about.pr2.text") },
    { title: t("about.pr3.title"), text: t("about.pr3.text") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: t("bc.home"), href: "/" }, { label: t("about.kicker") }]} />

      <div className="max-w-3xl">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("about.kicker")}</div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t("about.title")}</h1>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
          <p>{t("about.p4")}</p>
          <p>{t("about.p5")}</p>
          <p>{t("about.p6")}</p>
        </div>

        {/* Миссия */}
        <div className="mt-8 rounded-2xl border-l-4 border-primary bg-primary/5 p-6 sm:p-7">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("about.missionTitle")}</h2>
          <p className="mt-2 text-lg font-semibold leading-snug sm:text-xl">{t("about.missionText")}</p>
        </div>
      </div>

      {/* Stats */}
      <section className="mt-12" aria-labelledby="stats-title">
        <h2 id="stats-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("about.statsTitle")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-4 sm:p-5">
              <p className="text-xl font-extrabold text-primary sm:text-2xl">{s.n}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Equipment */}
      <section className="mt-12" aria-labelledby="equip-title">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 id="equip-title" className="text-lg font-bold sm:text-xl">{t("about.equipTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{t("about.equipText")}</p>
        </div>
      </section>

      {/* Principles */}
      <section className="mt-12" aria-labelledby="principles-title">
        <h2 id="principles-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("about.principlesTitle")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {principles.map((p, i) => (
            <article key={p.title} className="rounded-2xl border bg-card p-6">
              <span className="text-2xl font-extrabold text-primary/30">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-base font-bold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-10 max-w-2xl text-sm text-muted-foreground">{t("about.photosNote")}</p>

      <CTABanner
        title={t("cta.book")}
        text={t("bk.sub")}
        onBook={() => openBooking()}
        waHref={waLink(L(WA_DEFAULT, lang))}
      />
    </div>
  );
}
