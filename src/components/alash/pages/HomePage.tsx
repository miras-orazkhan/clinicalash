"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, MessageCircle, Users } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n, reviewWord } from "@/lib/alash/i18n";
import { useBooking } from "../BookingDialog";
import { useContent, useClinic } from "../ContentProvider";
import { DoctorCard } from "../DoctorCard";
import { SectionHead, RatingStars, CTABanner } from "../ui-bits";
import { SpecialtyIcon } from "../icons";
import { L, price as fmtPrice, type Lang } from "@/lib/alash/types";

export function HomePage() {
  const { t, lang } = useI18n();
  const { openBooking } = useBooking();
  const { doctors, specialties, reviews, faq, images } = useContent();
  const { waLink } = useClinic();
  const waDefault = (lang: Lang) =>
    lang === "kz" ? "Сәлеметсіз бе! Қабылдауға жазғым келеді." : "Здравствуйте! Хочу записаться на приём.";

  const featuredSpecialties = specialties.filter((s) => s.featured);
  const minPriceOf = (slug: string) => {
    const sp = specialties.find((s) => s.slug === slug);
    const prices = sp?.services.map((x) => x.price).filter((p) => p > 0) ?? [];
    return prices.length ? Math.min(...prices) : undefined;
  };
  const heroImg = images["hero.doctor"];
  const teamImg = images["team.group"];

  const topDoctors = [...doctors].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 6);
  const homeReviews = reviews.slice(0, 3);

  const advantages = [1, 2, 3, 4, 5, 6].map((i) => ({
    n: String(i).padStart(2, "0"),
    title: t(`adv.${i}.title` as never),
    text: t(`adv.${i}.text` as never),
  }));

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-teal-50/80 via-white to-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl md:text-[52px] md:leading-[1.08]">
              {t("hero.title1")}
              <span className="block text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.sub")}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => openBooking()}
                className="inline-flex h-13 min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_rgba(15,118,110,0.25)] transition hover:bg-primary/90 sm:text-base"
              >
                <CalendarClock className="h-4.5 w-4.5" aria-hidden />
                {t("cta.book")}
              </button>
              <a
                href={waLink(waDefault(lang))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#1FA855]/50 bg-white px-7 py-3.5 text-sm font-semibold text-[#178043] transition hover:border-[#1FA855] hover:bg-[#1FA855]/5 sm:text-base"
              >
                <MessageCircle className="h-4.5 w-4.5 text-[#1FA855]" aria-hidden />
                {t("cta.whatsapp")}
              </a>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative mx-auto flex w-full max-w-md items-end justify-center lg:max-w-none">
            <img
              src={heroImg?.url ?? "/hero-doctor.png"}
              alt={(lang === "kz" ? heroImg?.altKz : heroImg?.altRu) || t("hero.photoAlt")}
              className="w-full max-w-xs object-contain [filter:drop-shadow(0_24px_40px_rgba(15,118,110,0.20))] sm:max-w-sm lg:max-w-md"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ============ СПЕЦИАЛИЗАЦИИ ============ */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20" aria-labelledby="specs-title">
        <SectionHead kicker={t("specs.kicker")} title={t("specs.title")} sub={t("specs.sub")} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {featuredSpecialties.map((s) => {
            const minP = minPriceOf(s.slug);
            return (
              <a
                key={s.slug}
                href={`/specializations/${s.slug}`}
                className="group flex flex-col rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(15,118,110,0.08)] sm:p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <SpecialtyIcon name={s.icon} className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-3.5 text-sm font-bold leading-snug sm:text-base">{L(s.name, lang)}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{L(s.short, lang)}</p>
                {minP && <p className="mt-3 text-xs font-semibold text-primary sm:text-sm">{t("misc.from", { p: fmtPrice(minP) })}</p>}
              </a>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/specializations"
            className="inline-flex items-center gap-1.5 rounded-full border px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
          >
            {t("specs.all")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ============ ВРАЧИ ============ */}
      <section className="border-y bg-muted/40 py-14 md:py-20" aria-labelledby="doctors-title">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead kicker={t("home.doctors.kicker")} title={t("home.doctors.title")} sub={t("home.doctors.sub", { n: doctors.length })} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topDoctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1.5 rounded-full border px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
            >
              {t("home.doctors.all")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ ПРЕИМУЩЕСТВА ============ */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20" aria-labelledby="adv-title">
        <SectionHead kicker={t("adv.kicker")} title={t("adv.title")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((a) => (
            <article key={a.n} className="rounded-2xl border bg-card p-6">
              <h3 className="text-base font-bold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ КОМАНДА ============ */}
      <section className="border-y bg-muted/40 py-14 md:py-20" aria-labelledby="team-title">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHead title={t("team.title")} sub={t("team.sub")} wide />
          <figure className="overflow-hidden rounded-2xl border bg-card">
            <img
              src={teamImg?.url ?? "/team/group.jpg"}
              alt={(lang === "kz" ? teamImg?.altKz : teamImg?.altRu) || t("team.title")}
              loading="lazy"
              className="w-full"
            />
          </figure>
          <div className="mt-6 text-center">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-1.5 rounded-full border px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
            >
              <Users className="h-4 w-4" aria-hidden />
              {t("team.all")}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ ОТЗЫВЫ (превью) ============ */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20" aria-labelledby="rev-title">
        <SectionHead kicker={t("nav.reviews")} title={t("home.reviews.title")} />
        <div className="grid gap-4 md:grid-cols-3">
          {homeReviews.map((r) => (
            <article key={r.id} className="flex flex-col rounded-2xl border bg-card p-6">
              <RatingStars value={r.rating} className="h-4 w-4" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">{r.text}</p>
              <footer className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                <b className="text-foreground">{r.author}</b>
                {" · "}
                {r.date.split("-")[2]} {t(`month.${Number(r.date.split("-")[1]) - 1}` as never)} {r.date.split("-")[0]}
              </footer>
            </article>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-1.5 rounded-full border px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
          >
            {t("home.reviews.all")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="border-t bg-muted/40 py-14 md:py-20" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4">
          <SectionHead title={t("faq.title")} sub={t("faq.sub")} align="center" />
          <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
            {faq.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0">
                <AccordionTrigger className="py-4 text-left text-sm font-semibold hover:no-underline sm:text-base">
                  {L(f.q, lang)}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {L(f.a, lang)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-5 text-center">
            <Link href="/faq" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              {t("footer.faqAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-2 md:pb-20">
        <CTABanner
          title={t("cta.book")}
          text={t("bk.sub")}
          onBook={() => openBooking()}
          waHref={waLink(waDefault(lang))}
        />
      </section>
    </>
  );
}
