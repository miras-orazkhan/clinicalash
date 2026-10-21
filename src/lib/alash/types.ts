export type Lang = "ru" | "kz";

export type Localized = { ru: string; kz: string };

export interface Branch {
  id: string;
  name: Localized;
  district: Localized;
  address: Localized;
  phone: string;
  hours: Localized[];
  desc: Localized;
  highlights: Localized[];
  landmark: Localized;
  mapUrl: string;
}

export interface ServiceItem {
  name: Localized;
  price: number;
  note?: Localized;
}

export type SpecialtyKind = "procedure" | "specialty";

export interface Specialty {
  slug: string;
  kind: SpecialtyKind;
  icon: string;
  name: Localized;
  short: Localized;
  desc: Localized;
  services: ServiceItem[];
  featured?: boolean;
}

export type DocCategory = "highest" | "first" | "second";

export interface Doctor {
  id: string;
  name: Localized;
  patronymic: Localized;
  title: Localized;
  specialties: string[]; // specialty slugs
  experience: number;
  category: DocCategory;
  branches: string[]; // branch ids
  rating: number;
  reviewsCount: number;
  price: number;
  bio: Localized;
  education: Localized;
  photoUrl?: string; // /uploads/... — если задано, вместо инициалов показывается фото
}

export interface Review {
  id: string;
  author: string;
  date: string; // ISO
  rating: number;
  branchId?: string;
  doctorId?: string;
  text: string;
  local?: boolean; // added on site
}

export interface FaqItem {
  q: Localized;
  a: Localized;
}

export const L = (loc: Localized, lang: Lang): string => loc[lang] || loc.ru;

/** Имя Отчество — для карточек (без отчества — только имя, без лишнего пробела) */
export const doctorCardName = (d: Doctor, lang: Lang): string =>
  [L(d.name, lang).split(" ")[0], L(d.patronymic, lang)].filter(Boolean).join(" ");

/** Полное ФИО: Фамилия Имя Отчество — для страницы врача */
export const doctorFullName = (d: Doctor, lang: Lang): string => {
  const [first, last] = L(d.name, lang).split(" ");
  return `${last} ${first} ${L(d.patronymic, lang)}`;
};

export function price(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + "\u00A0₸";
}

/** Цена приёма врача: 0 (в источнике «Не указана») → пометка «по записи» */
export function consultPrice(n: number, lang: Lang): string {
  return n > 0 ? price(n) : lang === "kz" ? "жазылу бойынша" : "по записи";
}

/** Стаж: 0 (в источнике не указан) → «—», иначе «16 лет» / «16 жыл» */
export function experienceText(n: number, lang: Lang): string {
  return n > 0 ? `${n} ${yearsWord(n, lang)}` : "—";
}

export function yearsWord(n: number, lang: Lang): string {
  if (lang === "kz") return "жыл";
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return "лет";
  if (mod10 === 1) return "год";
  if (mod10 >= 2 && mod10 <= 4) return "года";
  return "лет";
}
