"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, ExternalLink, MapPin, Navigation, Phone } from "lucide-react";
import { useI18n } from "@/lib/alash/i18n";
import { useBooking } from "../BookingDialog";
import { L } from "@/lib/alash/types";
import { useContent, useClinic } from "../ContentProvider";
import { branchByIdFrom, doctorsByBranchFrom } from "@/lib/alash/derive";
import { Breadcrumbs, CTABanner } from "../ui-bits";
import { DoctorCard } from "../DoctorCard";

export function BranchPage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { openBooking } = useBooking();
  const { branches, doctors } = useContent();
  const { waLink } = useClinic();
  const branch = branchByIdFrom(branches, id);

  if (!branch) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">404</h1>
        <button onClick={() => router.push("/branches")} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          {t("nav.branches")}
        </button>
      </div>
    );
  }

  const docs = doctorsByBranchFrom(doctors, branch.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: t("bc.home"), href: "/" },
          { label: t("bc.branches"), href: "/branches" },
          { label: L(branch.name, lang) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="rounded-2xl bg-gradient-to-br from-teal-800 to-teal-950 p-7 text-white sm:p-9">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{L(branch.name, lang)}</h1>
            <p className="mt-2 text-sm leading-relaxed text-teal-100/90 sm:text-base">{L(branch.desc, lang)}</p>
          </div>

          {/* Info grid */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                {t("br.address")}
              </h2>
              <p className="mt-2 text-base font-semibold">{L(branch.address, lang)}</p>
              <p className="text-sm text-muted-foreground">{L(branch.district, lang)}</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <Clock3 className="h-4 w-4 text-primary" aria-hidden />
                {t("br.hours")}
              </h2>
              <ul className="mt-2 space-y-1">
                {branch.hours.map((h, i) => (
                  <li key={i} className="text-sm font-medium">{L(h, lang)}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" aria-hidden />
                {t("br.phone")}
              </h2>
              <a href={`tel:${branch.phone.replace(/[^+\d]/g, "")}`} className="mt-2 block text-base font-semibold text-primary transition hover:underline">
                {branch.phone}
              </a>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                <Navigation className="h-4 w-4 text-primary" aria-hidden />
                {t("br.has")}
              </h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {branch.highlights.map((h, i) => (
                  <li key={i} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                    {L(h, lang)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Landmark + map */}
          <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed bg-muted/30 p-5 sm:flex-row sm:items-center">
            <p className="text-sm leading-relaxed text-muted-foreground">
              <b className="text-foreground">{t("br.landmark")}: </b>
              {L(branch.landmark, lang)}
            </p>
            <a
              href={branch.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
            >
              {t("br.onMap")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>

        {/* Other branches */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t("br.total", { n: branches.length })}</h2>
            <ul className="mt-3 space-y-2">
              {branches.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/branches/${b.id}`}
                    className={`block rounded-xl border p-3.5 transition hover:border-primary/40 ${
                      b.id === branch.id ? "border-primary/50 bg-primary/5" : "bg-muted/30"
                    }`}
                  >
                    <span className="block text-sm font-bold">{L(b.name, lang)}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{L(b.address, lang)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Doctors */}
      <section className="mt-12" aria-labelledby="br-docs">
        <h2 id="br-docs" className="text-xl font-extrabold tracking-tight sm:text-2xl">
          {t("br.doctors")} <span className="text-muted-foreground">({docs.length})</span>
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      </section>

      <CTABanner
        title={t("cta.book")}
        text={L(branch.name, lang)}
        onBook={() => openBooking({ branchId: branch.id })}
        waHref={waLink()}
      />
    </div>
  );
}
