"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n, reviewWord } from "@/lib/alash/i18n";
import { L, price as fmtPrice } from "@/lib/alash/types";
import { useContent } from "../ContentProvider";
import { doctorsBySpecialtyFrom, minPriceOfFrom } from "@/lib/alash/derive";
import { SpecialtyIcon } from "../icons";
import { Breadcrumbs } from "../ui-bits";

export function SpecializationsPage() {
  const { t, lang } = useI18n();
  const { doctors, specialties } = useContent();
  const procedures = specialties.filter((s) => s.kind === "procedure");
  const specList = specialties.filter((s) => s.kind === "specialty");

  const SpecCard = ({ slug, icon, name, short }: { slug: string; icon: string; name: string; short: string }) => {
    const docs = doctorsBySpecialtyFrom(doctors, slug);
    const minP = minPriceOfFrom(specialties.find((s) => s.slug === slug));
    return (
      <Link
        href={`/specializations/${slug}`}
        className="group flex flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(15,118,110,0.08)]"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
            <SpecialtyIcon name={icon} className="h-5 w-5" />
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
        </div>
        <h3 className="mt-3.5 text-base font-bold leading-snug">{name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{short}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {minP && <span className="font-semibold text-primary">{t("misc.from", { p: fmtPrice(minP) })}</span>}
          {docs.length > 0 && (
            <span>
              {docs.length} · {t("sp.doctors").toLowerCase().split(" ")[0]}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: t("bc.home"), href: "/" }, { label: t("bc.specialties") }]} />

      <h1 className="max-w-3xl text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t("sp.title")}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t("sp.sub")}</p>

      {/* Procedures */}
      <section className="mt-12" aria-labelledby="proc-title">
        <div className="mb-6 flex items-center gap-3">
          <h2 id="proc-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("sp.procedures")}</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{procedures.length}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {procedures.map((s) => (
            <SpecCard key={s.slug} slug={s.slug} icon={s.icon} name={L(s.name, lang)} short={L(s.short, lang)} />
          ))}
        </div>
      </section>

      {/* By specialty */}
      <section className="mt-14" aria-labelledby="spec-title">
        <div className="mb-6 flex items-center gap-3">
          <h2 id="spec-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("sp.bySpec")}</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">{specList.length}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specList.map((s) => (
            <SpecCard key={s.slug} slug={s.slug} icon={s.icon} name={L(s.name, lang)} short={L(s.short, lang)} />
          ))}
        </div>
      </section>
    </div>
  );
}
