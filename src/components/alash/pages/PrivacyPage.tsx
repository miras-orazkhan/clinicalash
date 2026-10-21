"use client";

import React from "react";
import { useI18n, type DictKey } from "@/lib/alash/i18n";
import { Breadcrumbs } from "../ui-bits";

export function PrivacyPage() {
  const { t } = useI18n();
  // Абзацы хранятся как редактируемые тексты pp.p0..pp.pN
  const paragraphs: string[] = [];
  for (let i = 0; i < 40; i++) {
    const key = `pp.p${i}` as DictKey;
    const v = t(key);
    if (v === key) break;
    paragraphs.push(v);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <Breadcrumbs items={[{ label: t("bc.home"), href: "/" }, { label: t("pp.title") }]} />
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{t("pp.title")}</h1>
      <p className="mt-2 text-xs text-muted-foreground">{t("pp.updated")}</p>

      <div className="mt-8 space-y-5 text-sm leading-relaxed text-foreground/90 sm:text-base">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
