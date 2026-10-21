"use client";

import React from "react";
import Link from "next/link";
import { Instagram, Mail, MessageCircle, Phone, Send, Youtube, MapPin } from "lucide-react";
import { useI18n } from "@/lib/alash/i18n";
import { L } from "@/lib/alash/types";
import { useContent, useClinic } from "./ContentProvider";

export function Footer() {
  const { t, lang } = useI18n();
  const { branches, specialties } = useContent();
  const { phoneMain, phoneMainHref, email, waLink, socials, license } = useClinic();
  const featuredSpecialties = specialties.filter((s) => s.featured);

  const nav = [
    { label: t("nav.home"), to: "/" },
    { label: t("nav.doctors"), to: "/doctors" },
    { label: t("nav.specialties"), to: "/specializations" },
    { label: t("nav.about"), to: "/about" },
    { label: t("nav.branches"), to: "/branches" },
    { label: t("nav.reviews"), to: "/reviews" },
    { label: t("nav.faq"), to: "/faq" },
  ];

  const socialIcon = (id: string) => {
    switch (id) {
      case "instagram": return <Instagram className="h-4.5 w-4.5" aria-hidden />;
      case "telegram": return <Send className="h-4.5 w-4.5" aria-hidden />;
      case "youtube": return <Youtube className="h-4.5 w-4.5" aria-hidden />;
      default: return <MapPin className="h-4.5 w-4.5" aria-hidden />;
    }
  };

  return (
    <footer className="mt-auto bg-teal-950 text-teal-50" role="contentinfo">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo-alash-white.svg" alt="Медцентр «Алаш»" className="h-7 w-auto md:h-8" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-teal-100/80">{t("footer.desc")}</p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-teal-50 transition hover:bg-white/20"
                >
                  {socialIcon(s.id)}
                </a>
              ))}
            </div>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1FA855] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#188a45]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {t("footer.writeWa")}
            </a>
          </div>

          {/* Nav */}
          <nav aria-label="Навигация в подвале">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-200/80">{t("footer.navTitle")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link href={n.to} className="text-teal-50/90 transition hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy" className="text-teal-50/90 transition hover:text-white">
                  {t("footer.policy")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Popular */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-200/80">{t("footer.popTitle")}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {featuredSpecialties.map((s) => (
                <li key={s.slug}>
                  <Link href={`/specializations/${s.slug}`} className="text-teal-50/90 transition hover:text-white">
                    {L(s.name, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-200/80">{t("footer.contactTitle")}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <a href={phoneMainHref} className="flex items-center gap-2.5 font-semibold text-white transition hover:text-teal-200">
                <Phone className="h-4 w-4 shrink-0" aria-hidden />
                {phoneMain}
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-2.5 text-teal-50/90 transition hover:text-white">
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                {email}
              </a>
              <ul className="space-y-2 border-t border-white/10 pt-3 text-teal-100/80">
                {branches.map((b) => (
                  <li key={b.id} className="flex gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-300" aria-hidden />
                    <span>
                      <Link href={`/branches/${b.id}`} className="font-medium text-teal-50 transition hover:text-white">
                        {L(b.address, lang)}
                      </Link>
                      <span className="block text-xs text-teal-200/60">{[L(b.district, lang), b.phone].filter(Boolean).join(" · ")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-teal-200/60 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("footer.rights")}</span>
          <span>{license}</span>
          <Link href="/privacy" className="underline-offset-2 transition hover:text-white hover:underline">
            {t("footer.policy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
