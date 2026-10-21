"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, MapPin, MessageCircle, Star } from "lucide-react";
import { useI18n, reviewsWord, reviewWord } from "@/lib/alash/i18n";
import { useBooking } from "../BookingDialog";
import { L, doctorFullName, consultPrice, price as fmtPrice, experienceText } from "@/lib/alash/types";
import { useContent, useClinic } from "../ContentProvider";
import { doctorByIdFrom, branchByIdFrom, specialtyBySlugFrom } from "@/lib/alash/derive";
import { Breadcrumbs, CategoryBadge, CTABanner, DoctorAvatar, RatingStars } from "../ui-bits";
import { DoctorsRail } from "../DoctorsRail";

export function DoctorPage({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { openBooking } = useBooking();
  const { doctors, branches, specialties, reviews: allReviews } = useContent();
  const { waLink } = useClinic();
  const doctor = doctorByIdFrom(doctors, id);

  if (!doctor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">404</h1>
        <button onClick={() => router.push("/doctors")} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          {t("nav.doctors")}
        </button>
      </div>
    );
  }

  const docReviews = allReviews.filter((r) => r.doctorId === doctor.id);
  const sameSpec = doctors
    .filter((d) => d.id !== doctor.id && d.specialties.some((s) => doctor.specialties.includes(s)))
    .slice(0, 3);
  const waText =
    lang === "kz"
      ? `Сәлеметсіз бе! ${L(doctor.name, "kz")} дәрігерге жазғым келеді.`
      : `Здравствуйте! Хочу записаться к врачу ${L(doctor.name, "ru")}.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumbs
        items={[
          { label: t("bc.home"), href: "/" },
          { label: t("bc.doctors"), href: "/doctors" },
          { label: L(doctor.name, lang) },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: profile */}
        <div>
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <DoctorAvatar doctor={doctor} lang={lang} size="xl" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{doctorFullName(doctor, lang)}</h1>
                <p className="mt-1 text-base font-medium text-primary sm:text-lg">{L(doctor.title, lang)}</p>
                <div className="mt-3">
                  <CategoryBadge category={doctor.category} />
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">{t("doctor.exp")}</dt>
                    <dd className="mt-1 text-lg font-extrabold">{experienceText(doctor.experience, lang)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{t("doctor.rating")}</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-lg font-extrabold">
                      <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" aria-hidden />
                      {doctor.rating.toFixed(1)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{t("doctor.reviewsCount")}</dt>
                    <dd className="mt-1 text-lg font-extrabold">{doctor.reviewsCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{t("doctor.consult")}</dt>
                    <dd className="mt-1 whitespace-nowrap text-lg font-extrabold">{consultPrice(doctor.price, lang)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
              {doctor.branches.map((b) => {
                const br = branchByIdFrom(branches, b);
                if (!br) return null;
                return (
                  <Link
                    key={b}
                    href={`/branches/${b}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {L(br.name, lang)}
                  </Link>
                );
              })}
              {doctor.specialties.map((sl) => {
                const sp = specialtyBySlugFrom(specialties, sl);
                if (!sp) return null;
                return (
                  <Link
                    key={sl}
                    href={`/specializations/${sl}`}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                  >
                    {L(sp.name, lang)}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* About */}
          <section className="mt-6 rounded-2xl border bg-card p-6 sm:p-8" aria-labelledby="doc-about">
            <h2 id="doc-about" className="text-lg font-bold sm:text-xl">{t("doctor.about")}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90 sm:text-base">{L(doctor.bio, lang)}</p>
            <div className="mt-5 flex gap-3 rounded-xl bg-muted/50 p-4">
              <GraduationCap className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("doctor.education")}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{L(doctor.education, lang)}</p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className="mt-6 rounded-2xl border bg-card p-6 sm:p-8" aria-labelledby="doc-reviews">
            <div className="flex items-center justify-between gap-3">
              <h2 id="doc-reviews" className="text-lg font-bold sm:text-xl">
                {t("doctor.reviews")} <span className="text-muted-foreground">({docReviews.length})</span>
              </h2>
              <Link href="/reviews" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                {t("nav.reviews")}
              </Link>
            </div>
            {docReviews.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">{t("doctor.noReviews")}</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {docReviews.map((r) => (
                  <li key={r.id} className="rounded-xl bg-muted/40 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm">{r.author}</b>
                      <RatingStars value={r.rating} />
                      <span className="text-xs text-muted-foreground">
                        {r.date.split("-")[2]} {t(`month.${Number(r.date.split("-")[1]) - 1}` as never)} {r.date.split("-")[0]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Similar doctors */}
          {sameSpec.length > 0 && (
            <div className="mt-6">
              <DoctorsRail titleId="doc-similar" title={t("sp.doctors")} doctors={sameSpec} />
            </div>
          )}
        </div>

        {/* Right: sticky booking card */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border bg-card p-6 shadow-[0_8px_30px_rgba(15,118,110,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("doctor.consult")}</p>
            <p className="mt-1 text-2xl font-extrabold">{consultPrice(doctor.price, lang)}</p>
            <button
              onClick={() => openBooking({ doctorId: doctor.id })}
              className="mt-4 h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {t("doctor.book")}
            </button>
            <a
              href={waLink(waText)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#1FA855]/40 text-sm font-semibold text-[#178043] transition hover:border-[#1FA855] hover:bg-[#1FA855]/5"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t("cta.whatsapp")}
            </a>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">{t("bk.sub")}</p>
          </div>
        </aside>
      </div>

      <CTABanner
        title={t("doctor.book")}
        text={t("adv.1.text")}
        onBook={() => openBooking({ doctorId: doctor.id })}
        waHref={waLink(waText)}
      />
    </div>
  );
}
