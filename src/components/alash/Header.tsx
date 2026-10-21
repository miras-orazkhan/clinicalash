"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, Phone, Search, X } from "lucide-react";
import { useI18n, reviewWord } from "@/lib/alash/i18n";
import { L, consultPrice, price as fmtPrice, experienceText, type Doctor, type Specialty } from "@/lib/alash/types";
import { useContent, useClinic } from "./ContentProvider";
import { SpecialtyIcon } from "./icons";
import { DoctorAvatar } from "./ui-bits";
import { useBooking } from "./BookingDialog";

interface SearchHit {
  type: "doctor" | "specialty";
  doctor?: Doctor;
  specialty?: Specialty;
}

function searchAll(q: string, doctors: Doctor[], specialties: Specialty[]): { hits: SearchHit[]; total: number } {
  const s = q.trim().toLowerCase();
  if (s.length < 2) return { hits: [], total: 0 };
  const norm = (x: string) => x.toLowerCase().replace(/ё/g, "е");

  const docHits: SearchHit[] = doctors.filter((d) => {
    const name = norm(L(d.name, "ru")) + " " + norm(L(d.name, "kz"));
    const title = norm(L(d.title, "ru")) + " " + norm(L(d.title, "kz"));
    const specs = d.specialties
      .map((sl) => specialties.find((sp) => sp.slug === sl))
      .filter(Boolean)
      .map((sp) => norm(L(sp!.name, "ru")) + " " + norm(L(sp!.name, "kz")))
      .join(" ");
    return name.includes(s) || title.includes(s) || specs.includes(s);
  }).map((doctor) => ({ type: "doctor" as const, doctor }));

  const specHits: SearchHit[] = specialties.filter((sp) => {
    const n = norm(L(sp.name, "ru")) + " " + norm(L(sp.name, "kz"));
    const sh = norm(L(sp.short, "ru")) + " " + norm(L(sp.short, "kz"));
    return n.includes(s) || sh.includes(s);
  }).map((specialty) => ({ type: "specialty" as const, specialty }));

  const total = docHits.length + specHits.length;
  return { hits: [...docHits.slice(0, 4), ...specHits.slice(0, 4)], total };
}

function SearchResults({ q, onPick }: { q: string; onPick?: () => void }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { doctors, specialties } = useContent();
  const { hits, total } = useMemo(() => searchAll(q, doctors, specialties), [q, doctors, specialties]);

  if (q.trim().length < 2) return null;

  const go = (to: string) => {
    onPick?.();
    router.push(to);
  };

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-lg">
      {hits.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">{t("dp.empty")}</div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto p-1.5">
          {hits.map((h, i) =>
            h.type === "doctor" && h.doctor ? (
              <button
                key={`d-${h.doctor.id}-${i}`}
                onClick={() => go(`/doctors/${h.doctor!.id}`)}
                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-accent"
              >
                <DoctorAvatar doctor={h.doctor} lang={lang} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{L(h.doctor.name, lang)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {L(h.doctor.title, lang)} · {experienceText(h.doctor.experience, lang)} · {consultPrice(h.doctor.price, lang)}
                  </span>
                </span>
              </button>
            ) : h.specialty ? (
              <button
                key={`s-${h.specialty.slug}-${i}`}
                onClick={() => go(`/specializations/${h.specialty!.slug}`)}
                className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-accent"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <SpecialtyIcon name={h.specialty.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{L(h.specialty.name, lang)}</span>
                  <span className="block truncate text-xs text-muted-foreground">{L(h.specialty.short, lang)}</span>
                </span>
              </button>
            ) : null
          )}
          <button
            onClick={() => go(`/doctors?q=${encodeURIComponent(q.trim())}`)}
            className="mt-1 w-full rounded-lg bg-muted/60 px-3 py-2.5 text-left text-sm font-semibold text-primary transition hover:bg-muted"
          >
            {t("dp.resultsFor", { q: q.trim() })} · {total}
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { openBooking } = useBooking();
  const { phoneMain, phoneMainHref, waLink } = useClinic();
  const [q, setQ] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setQ("");
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const nav = [
    { key: "nav.home", to: "/" },
    { key: "nav.doctors", to: "/doctors" },
    { key: "nav.specialties", to: "/specializations" },
    { key: "nav.about", to: "/about" },
    { key: "nav.branches", to: "/branches" },
    { key: "nav.reviews", to: "/reviews" },
  ];

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(to + "/");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Main row */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 md:h-[72px]">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t("nav.home")}>
          <img src="/logo-alash.svg" alt="Медцентр «Алаш»" className="h-7 w-auto md:h-8" />
        </Link>

        <nav className="ml-2 hidden items-center gap-0.5 xl:flex" aria-label="Основная навигация">
          {nav.map((n) => (
            <Link
              key={n.to}
              href={n.to}
              className={`whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors ${
                isActive(n.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t(n.key as never)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Desktop search */}
          <div ref={boxRef} className="relative hidden md:block md:w-44 lg:w-64 xl:w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {}}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQ("");
                if (e.key === "Enter" && q.trim().length >= 2) router.push(`/doctors?q=${encodeURIComponent(q.trim())}`);
              }}
              placeholder={t("dp.searchShort")}
              className="h-10 w-full rounded-full border bg-muted/50 pl-9 pr-8 text-sm outline-none transition focus:border-primary/50 focus:bg-white"
              aria-label={t("dp.search")}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Очистить"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <SearchResults q={q} onPick={() => setQ("")} />
          </div>

          {/* Mobile search toggle */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted md:hidden"
            onClick={() => setMobileSearch((v) => !v)}
            aria-label={t("dp.searchShort")}
            aria-expanded={mobileSearch}
          >
            {mobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* Language switcher */}
          <div className="flex overflow-hidden rounded-full border" role="group" aria-label={t("misc.langLabel")}>
            {(["ru", "kz"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                  lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
                aria-pressed={lang === l}
              >
                {l === "ru" ? "RU" : "ҚАЗ"}
              </button>
            ))}
          </div>

          <button
            onClick={() => openBooking()}
            className="hidden h-10 whitespace-nowrap items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:inline-flex"
          >
            {t("cta.bookShort")}
          </button>

          {/* Burger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-muted xl:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Меню"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile search panel */}
      {mobileSearch && (
        <div className="border-t bg-white px-4 pb-3 pt-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("dp.search")}
              className="h-11 w-full rounded-full border bg-muted/50 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:bg-white"
            />
            <SearchResults q={q} onPick={() => { setQ(""); setMobileSearch(false); }} />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <img src="/logo-alash.svg" alt="Медцентр «Алаш»" className="h-6 w-auto" />
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label="Мобильная навигация">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  href={n.to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-base font-medium ${
                    isActive(n.to) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                  }`}
                >
                  {t(n.key as never)}
                </Link>
              ))}
              <Link href="/faq" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-muted">
                {t("nav.faq")}
              </Link>
            </nav>
            <div className="mt-auto flex flex-col gap-2.5 border-t pt-5">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  openBooking();
                }}
                className="h-12 rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              >
                {t("cta.book")}
              </button>
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#1FA855]/40 text-sm font-semibold text-[#178043]"
              >
                {t("cta.whatsapp")}
              </a>
              <a href={phoneMainHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border text-sm font-semibold">
                <Phone className="h-4 w-4" aria-hidden />
                {phoneMain}
              </a>
            </div>
          </div>
        </div>,
          document.body
        )}
    </header>
  );
}
