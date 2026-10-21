"use client";

import React from "react";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { L, price as fmtPrice, type Doctor, type DocCategory, type Localized, type Lang } from "@/lib/alash/types";
import { useI18n } from "@/lib/alash/i18n";

export function SectionHead({
  kicker,
  title,
  sub,
  align = "left",
  wide = false,
}: {
  kicker?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  /** снять ограничение max-w-2xl у подзаголовка — текст на всю ширину секции */
  wide?: boolean;
}) {
  return (
    <div className={`mb-8 md:mb-10 ${align === "center" ? "text-center" : ""}`}>
      {kicker && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{kicker}</div>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">{title}</h2>
      {sub && <p className={`mt-3 ${wide ? "" : "max-w-2xl"} text-sm leading-relaxed text-muted-foreground sm:text-base ${align === "center" ? "mx-auto" : ""}`}>{sub}</p>}
    </div>
  );
}

export function RatingStars({ value, className = "h-3.5 w-3.5" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

const AVATAR_TINTS = [
  "bg-teal-50 text-teal-800",
  "bg-cyan-50 text-cyan-800",
  "bg-emerald-50 text-emerald-800",
  "bg-lime-50 text-lime-800",
];

export function DoctorAvatar({ doctor, lang, size = "md" }: { doctor: Doctor; lang: Lang; size?: "sm" | "md" | "lg" | "xl" }) {
  const initials = L(doctor.name, lang)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const idx = doctor.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TINTS.length;
  const sizes: Record<string, string> = {
    sm: "h-9 w-9 text-xs",
    md: "h-14 w-14 text-base",
    lg: "h-20 w-20 text-xl",
    xl: "h-28 w-28 text-2xl",
  };
  if (doctor.photoUrl) {
    return (
      <img
        src={doctor.photoUrl}
        alt={L(doctor.name, lang)}
        className={`shrink-0 select-none rounded-full object-cover ${sizes[size]}`}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${AVATAR_TINTS[idx]} ${sizes[size]}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function CategoryBadge({ category }: { category: DocCategory }) {
  const { t } = useI18n();
  const key = category === "highest" ? "cat.highest" : category === "first" ? "cat.first" : "cat.second";
  return (
    <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
      {t(key)}
    </span>
  );
}

export function PriceTag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-semibold text-foreground ${className}`}>{children}</span>;
}

export function Price({ value }: { value: number }) {
  return <span className="whitespace-nowrap font-semibold text-foreground">{fmtPrice(value)}</span>;
}

export function PriceFrom({ value }: { value: number }) {
  const { t } = useI18n();
  return (
    <span className="whitespace-nowrap text-sm font-semibold text-primary">
      {t("misc.from", { p: fmtPrice(value) })}
    </span>
  );
}

export function BranchChip({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <MapPin className="h-3 w-3 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-border">/</span>}
          {it.href ? (
            <Link href={it.href} className="transition-colors hover:text-primary">
              {it.label}
            </Link>
          ) : (
            <span className="text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function CTABanner({
  title,
  text,
  onBook,
  waHref,
}: {
  title: string;
  text?: string;
  onBook: () => void;
  waHref: string;
}) {
  const { t } = useI18n();
  return (
    <div className="mt-12 flex flex-col items-start gap-5 rounded-2xl bg-gradient-to-br from-teal-800 to-teal-950 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div>
        <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
        {text && <p className="mt-1 max-w-xl text-sm text-teal-100/90">{text}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">
        <button
          onClick={onBook}
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-teal-900 transition hover:bg-teal-50"
        >
          {t("cta.book")}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {t("cta.whatsapp")}
        </a>
      </div>
    </div>
  );
}

export type { Localized };
