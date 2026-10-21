import type { Localized } from "./types";

export const CLINIC = {
  name: "Медцентр «Алаш»",
  nameKz: "«Алаш» медициналық орталығы",
  legal: "ТОО «Алаш Медикал»",
  license: "Лицензия № KZ92VCU00012345 от 15.03.2024",
  since: 2012,
  phoneMain: "+7 (727) 350-40-40",
  phoneMainHref: "tel:+77273504040",
  phoneMobile: "+7 701 350 40 40",
  phoneMobileHref: "tel:+77013504040",
  whatsapp: "+7 701 350 40 40",
  whatsappHref: "https://wa.me/77013504040",
  email: "info@alashmed.kz",
  socials: [
    { id: "instagram", label: "Instagram", url: "https://instagram.com/alashmed.kz" },
    { id: "telegram", label: "Telegram", url: "https://t.me/alashmed" },
    { id: "youtube", label: "YouTube", url: "https://youtube.com/@alashmed" },
    { id: "2gis", label: "2ГИС", url: "https://2gis.kz/almaty/search/медцентр%20Алаш" },
  ],
};

export function waLink(text?: string): string {
  const base = "https://wa.me/77013504040";
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export const WA_DEFAULT: Localized = {
  ru: "Здравствуйте! Хочу записаться на приём.",
  kz: "Сәлеметсіз бе! Қабылдауға жазғым келеді.",
};
