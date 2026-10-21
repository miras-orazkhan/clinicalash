"use client";

import React, { createContext, useContext } from "react";
import type { SiteContent } from "@/lib/alash/content";
import { CLINIC, waLink as defaultWaLink } from "@/lib/alash/clinic";

const Ctx = createContext<SiteContent | null>(null);

export function ContentProvider({ content, children }: { content: SiteContent; children: React.ReactNode }) {
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

/** Контент сайта из БД (врачи, специализации, филиалы, отзывы, FAQ, фото, настройки) */
export function useContent(): SiteContent {
  const v = useContext(Ctx);
  if (!v) throw new Error("useContent must be used within ContentProvider");
  return v;
}

/** Контактные данные клиники из настроек БД с фолбэком на статические */
export function useClinic() {
  const { settings } = useContent();
  const phoneMain = settings.phone_main || CLINIC.phoneMain;
  const phoneMobile = settings.phone_mobile || CLINIC.phoneMobile;
  const whatsapp = settings.whatsapp || "77013504040";
  const email = settings.email || CLINIC.email;
  const legal = settings.clinic_legal || CLINIC.legal;
  const license = settings.clinic_license || CLINIC.license;
  const telHref = (p: string) => `tel:${p.replace(/[^+\d]/g, "")}`;
  const waLink = (text?: string) => {
    const base = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  };
  void defaultWaLink;
  return {
    phoneMain,
    phoneMainHref: telHref(phoneMain),
    phoneMobile,
    phoneMobileHref: telHref(phoneMobile),
    whatsapp,
    waLink,
    email,
    legal,
    license,
    socials: CLINIC.socials,
  };
}
