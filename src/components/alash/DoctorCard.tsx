"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import {
  L,
  doctorCardName,
  consultPrice,
  experienceText,
  type Doctor,
} from "@/lib/alash/types";
import { useI18n, reviewWord } from "@/lib/alash/i18n";
import { useContent } from "./ContentProvider";
import { useBooking } from "./BookingDialog";
import { DoctorAvatar } from "./ui-bits";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { branches } = useContent();
  const { openBooking } = useBooking();
  const name = doctorCardName(doctor, lang);
  const branchNames = doctor.branches
    .map((b) => branches.find((x) => x.id === b))
    .filter(Boolean)
    .map((b) => L(b!.name, lang).replace(/^Филиал\s+|«|»/g, ""));

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/doctors/${doctor.id}`)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/doctors/${doctor.id}`);
        }
      }}
      className="group flex cursor-pointer flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(15,118,110,0.08)] focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="flex items-center gap-4">
        <DoctorAvatar doctor={doctor} lang={lang} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-foreground sm:text-lg">{name}</h3>
          <p className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-primary">{L(doctor.title, lang)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              <b className="text-foreground">{doctor.rating.toFixed(1)}</b>
              <span>· {doctor.reviewsCount} {reviewWord(doctor.reviewsCount, lang)}</span>
            </span>
            <span className="inline-flex items-center gap-1">{experienceText(doctor.experience, lang)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-[22px] flex-1 flex-wrap content-start gap-1.5">
        {branchNames.map((bn) => (
          <span key={bn} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {bn}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <div className="text-sm">
          <span className="text-muted-foreground">{t("doctor.consult")} — </span>
          <b className="whitespace-nowrap">{consultPrice(doctor.price, lang)}</b>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openBooking({ doctorId: doctor.id });
          }}
          className="inline-flex shrink-0 items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:text-sm"
        >
          {t("cta.bookShort")}
        </button>
      </div>
    </article>
  );
}
