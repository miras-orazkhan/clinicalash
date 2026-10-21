"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { useI18n } from "@/lib/alash/i18n";
import { useBooking } from "../BookingDialog";
import { L, price as fmtPrice } from "@/lib/alash/types";
import { useContent, useClinic } from "../ContentProvider";
import { doctorsBySpecialtyFrom, specialtyBySlugFrom } from "@/lib/alash/derive";
import { SpecialtyIcon } from "../icons";
import { Breadcrumbs, CTABanner } from "../ui-bits";
import { DoctorsRail } from "../DoctorsRail";

export function SpecialtyPage({ slug }: { slug: string }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { openBooking } = useBooking();
  const { doctors, specialties } = useContent();
  const { waLink, phoneMain, phoneMainHref } = useClinic();
  const spec = specialtyBySlugFrom(specialties, slug);

  if (!spec) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">404</h1>
        <button onClick={() => router.push("/specializations")} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          {t("nav.specialties")}
        </button>
      </div>
    );
  }

  const docs = doctorsBySpecialtyFrom(doctors, slug);
  const waText =
    lang === "kz"
      ? `Сәлеметсіз бе! ${L(spec.name, "kz")} бойынша сұрақ бар.`
      : `Здравствуйте! Интересует направление «${L(spec.name, "ru")}».`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: t("bc.home"), href: "/" },
          { label: t("bc.specialties"), href: "/specializations" },
          { label: L(spec.name, lang) },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-20 sm:w-20">
          <SpecialtyIcon name={spec.icon} className="h-8 w-8 sm:h-10 sm:w-10" />
        </span>
        <div className="max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{L(spec.name, lang)}</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">{L(spec.short, lang)}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">{L(spec.desc, lang)}</p>
        </div>
      </div>

      {/* Services */}
      <section className="mt-10" aria-labelledby="svc-title">
        <h2 id="svc-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("sp.services")}</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
          <ul className="divide-y">
            {spec.services.map((svc, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                <span className="text-sm leading-relaxed sm:text-base">{L(svc.name, lang)}</span>
                <span className="shrink-0 text-right">
                  <b className="whitespace-nowrap sm:text-base">{svc.price === 0 ? L(svc.note!, lang) : fmtPrice(svc.price)}</b>
                  {svc.price !== 0 && svc.note && (
                    <span className="block text-xs text-muted-foreground">{L(svc.note, lang)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {lang === "kz" ? "Бағалар 2026 жылғы қазан айының жағдайы бойынша." : "Цены актуальны на октябрь 2026 года."}
        </p>
      </section>

      {/* Doctors */}
      <div className="mt-12">
        {docs.length === 0 ? (
          <section aria-labelledby="docs-title">
            <h2 id="docs-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("sp.doctors")}</h2>
            <div className="mt-4 rounded-2xl border border-dashed bg-muted/30 p-6 sm:p-8">
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("sp.noDoctors", { phone: phoneMain })}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={phoneMainHref}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  {phoneMain}
                </a>
                <a
                  href={waLink(waText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-[#1FA855]/40 px-5 py-2.5 text-sm font-semibold text-[#178043] transition hover:border-[#1FA855]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t("sp.askWa")}
                </a>
              </div>
            </div>
          </section>
        ) : (
          <DoctorsRail titleId="docs-title" title={t("sp.doctors")} doctors={docs} />
        )}
      </div>

      <CTABanner
        title={t("cta.book")}
        text={L(spec.short, lang)}
        onBook={() => openBooking({ specialtySlug: spec.slug })}
        waHref={waLink(waText)}
      />
    </div>
  );
}
