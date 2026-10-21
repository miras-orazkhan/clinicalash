"use client";

import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, Phone } from "lucide-react";
import { useI18n } from "@/lib/alash/i18n";
import { Breadcrumbs } from "../ui-bits";
import { L } from "@/lib/alash/types";
import { useContent, useClinic } from "../ContentProvider";

export function FaqPage() {
  const { t, lang } = useI18n();
  const { faq } = useContent();
  const { phoneMain, phoneMainHref, waLink } = useClinic();
  const waDefault =
    lang === "kz" ? "Сәлеметсіз бе! Қабылдауға жазғым келеді." : "Здравствуйте! Хочу записаться на приём.";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: t("bc.home"), href: "/" }, { label: t("bc.faq") }]} />
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t("fp.title")}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t("fp.sub")}</p>

      <Accordion type="single" collapsible className="mt-8 rounded-2xl border bg-card px-5">
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

      <div className="mt-8 rounded-2xl bg-teal-950 p-6 text-teal-50 sm:p-8">
        <p className="text-sm leading-relaxed sm:text-base">{t("fp.contactLine", { phone: phoneMain })}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={phoneMainHref}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-teal-900 transition hover:bg-teal-50"
          >
            <Phone className="h-4 w-4" aria-hidden />
            {phoneMain}
          </a>
          <a
            href={waLink(waDefault)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1FA855] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#188a45]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t("cta.whatsapp")}
          </a>
        </div>
      </div>
    </div>
  );
}
