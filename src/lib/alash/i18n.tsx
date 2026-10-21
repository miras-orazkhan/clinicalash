"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "./types";
import { ruDict, kzDict, type DictKey } from "./dicts";

export type { DictKey };
export type Dicts = Record<Lang, Record<string, string>>;

/** Базовые словари; провайдер накладывает сверху редактируемые из БД */
const baseDicts: Dicts = {
  ru: ruDict as unknown as Record<string, string>,
  kz: kzDict as unknown as Record<string, string>,
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
  children,
  dicts,
}: {
  children: React.ReactNode;
  /** редактируемые тексты из БД (SiteText), мержатся поверх встроенных */
  dicts?: Partial<Dicts>;
}) {
  const [lang, setLangState] = useState<Lang>("ru");
  const merged = useMemo<Dicts>(
    () => ({
      ru: { ...baseDicts.ru, ...(dicts?.ru ?? {}) },
      kz: { ...baseDicts.kz, ...(dicts?.kz ?? {}) },
    }),
    [dicts]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("alash-lang");
      if (saved === "kz" || saved === "ru") {
        queueMicrotask(() => setLangState(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("alash-lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      let s: string = merged[lang][key] ?? merged.ru[key] ?? (key as string);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    },
    [lang, merged]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function reviewWord(n: number, lang: Lang): string {
  if (lang === "kz") return "пікір";
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "отзывов";
  if (mod10 === 1) return "отзыв";
  if (mod10 >= 2 && mod10 <= 4) return "отзыва";
  return "отзывов";
}

export function reviewsWord(n: number, lang: Lang): string {
  if (lang === "kz") return "пікірлер";
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "Отзывов";
  if (mod10 === 1) return "Отзыв";
  if (mod10 >= 2 && mod10 <= 4) return "Отзыва";
  return "Отзывов";
}
