"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/alash/i18n";
import { L } from "@/lib/alash/types";
import { useContent } from "../ContentProvider";
import { doctorsByBranchFrom } from "@/lib/alash/derive";
import { Breadcrumbs } from "../ui-bits";

export function BranchesPage() {
  const { t, lang } = useI18n();
  const { branches, doctors } = useContent();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: t("bc.home"), href: "/" }, { label: t("bc.branches") }]} />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t("br.title")}</h1>
        </div>
        <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
          {t("br.total", { n: branches.length })}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {branches.map((b) => {
          const docs = doctorsByBranchFrom(doctors, b.id);
          return (
            <article key={b.id} className="flex flex-col rounded-2xl border bg-card transition-shadow hover:shadow-[0_8px_30px_rgba(15,118,110,0.08)]">
              <div className="rounded-t-2xl bg-gradient-to-br from-teal-800 to-teal-950 p-6 text-white">
                <h2 className="text-lg font-extrabold">{L(b.name, lang)}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-teal-100/90">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {L(b.address, lang)}
                </p>
                <p className="mt-0.5 text-xs text-teal-200/70">{L(b.district, lang)}</p>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm leading-relaxed text-foreground/90">{L(b.desc, lang)}</p>

                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {L(b.hours[0], lang)}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`} className="transition hover:text-primary">
                      {b.phone}
                    </a>
                  </li>
                </ul>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {b.highlights.slice(0, 3).map((h, i) => (
                    <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                      {L(h, lang)}
                    </span>
                  ))}
                  <span className="rounded-full bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    +{b.highlights.length - 3}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">
                    {docs.length} · {t("sp.doctors").toLowerCase().split(" ")[0]}
                  </span>
                  <Link
                    href={`/branches/${b.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary transition hover:gap-2"
                  >
                    {t("cta.more")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
