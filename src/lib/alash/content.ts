import { db } from "@/lib/db";
import type { Branch, DocCategory, Doctor, FaqItem, Review, ServiceItem, Specialty, SpecialtyKind } from "./types";
import type { Dicts } from "./i18n";

function parseJSON<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

/** Контент сайта, прочитанный из БД — в форматах существующих TS-интерфейсов */
export interface SiteContent {
  doctors: Doctor[];
  specialties: Specialty[]; // процедуры + врачебные направления, единый отсортированный список
  branches: Branch[];
  reviews: Review[];
  faq: FaqItem[];
  images: Record<string, { url: string; altRu: string; altKz: string }>;
  settings: Record<string, string>;
}

export async function getSiteContent(): Promise<SiteContent> {
  const [docRows, specRows, branchRows, reviewRows, faqRows, imageRows, settingRows] = await Promise.all([
    db.doctor.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }] }),
    db.specialty.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }] }),
    db.branch.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { nameRu: "asc" }] }),
    db.review.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    db.faqItem.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }] }),
    db.siteImage.findMany(),
    db.setting.findMany(),
  ]);

  const doctors: Doctor[] = docRows.map((d) => ({
    id: d.id,
    name: { ru: d.nameRu, kz: d.nameKz },
    patronymic: { ru: d.patronymicRu, kz: d.patronymicKz },
    title: { ru: d.titleRu, kz: d.titleKz },
    specialties: parseJSON<string[]>(d.specialties, []),
    experience: d.experience,
    category: d.category as DocCategory,
    branches: parseJSON<string[]>(d.branches, []),
    rating: d.rating,
    reviewsCount: d.reviewsCount,
    price: d.price,
    bio: { ru: d.bioRu, kz: d.bioKz },
    education: { ru: d.educationRu, kz: d.educationKz },
    photoUrl: d.photoUrl ?? undefined,
  }));

  const specialties: Specialty[] = specRows.map((s) => ({
    slug: s.slug,
    kind: s.kind as SpecialtyKind,
    icon: s.icon,
    name: { ru: s.nameRu, kz: s.nameKz },
    short: { ru: s.shortRu, kz: s.shortKz },
    desc: { ru: s.descRu, kz: s.descKz },
    services: parseJSON<ServiceItem[]>(s.services, []),
    featured: s.featured,
  }));

  const branches: Branch[] = branchRows.map((b) => ({
    id: b.id,
    name: { ru: b.nameRu, kz: b.nameKz },
    district: { ru: b.districtRu, kz: b.districtKz },
    address: { ru: b.addressRu, kz: b.addressKz },
    phone: b.phone,
    hours: parseJSON<Branch["hours"]>(b.hours, []),
    desc: { ru: b.descRu, kz: b.descKz },
    highlights: parseJSON<Branch["highlights"]>(b.highlights, []),
    landmark: { ru: b.landmarkRu, kz: b.landmarkKz },
    mapUrl: b.mapUrl,
  }));

  const reviews: Review[] = reviewRows.map((r) => ({
    id: r.id,
    author: r.author,
    date: r.date,
    rating: r.rating,
    branchId: r.branchId ?? undefined,
    doctorId: r.doctorId ?? undefined,
    text: r.text,
    local: r.source === "site",
  }));

  const faq: FaqItem[] = faqRows.map((f) => ({
    q: { ru: f.qRu, kz: f.qKz },
    a: { ru: f.aRu, kz: f.aKz },
  }));

  const images: SiteContent["images"] = {};
  for (const img of imageRows) images[img.key] = { url: img.url, altRu: img.altRu, altKz: img.altKz };

  const settings: Record<string, string> = {};
  for (const s of settingRows) settings[s.key] = s.value;

  return { doctors, specialties, branches, reviews, faq, images, settings };
}

/** Редактируемые тексты из БД: { ru: {key:value}, kz: {...} } */
export async function getDbTexts(): Promise<Dicts> {
  const rows = await db.siteText.findMany();
  const ru: Record<string, string> = {};
  const kz: Record<string, string> = {};
  for (const r of rows) {
    ru[r.key] = r.valueRu;
    if (r.valueKz) kz[r.key] = r.valueKz;
  }
  return { ru, kz };
}
