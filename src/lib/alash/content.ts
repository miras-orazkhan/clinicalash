import { getPayloadClient } from "./payloadClient";
import type { Branch, DocCategory, Doctor, FaqItem, Review, ServiceItem, Specialty, SpecialtyKind } from "./types";
import type { Dicts } from "./i18n";

/** Контент сайта, читаемый из Payload — в форматах существующих TS-интерфейсов */
export interface SiteContent {
  doctors: Doctor[];
  specialties: Specialty[]; // процедуры + врачебные направления, единый отсортированный список
  branches: Branch[];
  reviews: Review[];
  faq: FaqItem[];
  images: Record<string, { url: string; altRu: string; altKz: string }>;
  settings: Record<string, string>;
}

type Row = Record<string, unknown> | null | undefined;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const loc = (v: unknown): { ru: string; kz: string } => {
  const o = (v ?? null) as Row;
  return { ru: str(o?.ru), kz: str(o?.kz) };
};
const num = (v: unknown, fallback = 0): number =>
  (typeof v === "number" ? v : Number(v) || fallback) as number;

const bySortOrder = (a: Row, b: Row): number => {
  const da = a ?? {}, dbb = b ?? {};
  const so = num(da.sortOrder) - num(dbb.sortOrder);
  if (so !== 0) return so;
  return str((da.name as Row)?.ru).localeCompare(str((dbb.name as Row)?.ru), "ru");
};

export async function getSiteContent(): Promise<SiteContent> {
  const payload = await getPayloadClient();

  const [docRows, specRows, branchRows, reviewRows, faqRows, imageRows, settings] =
    await Promise.all([
      payload.find({ collection: "doctors", where: { published: { equals: true } }, depth: 1, locale: "*", limit: 0, overrideAccess: true }),
      payload.find({ collection: "specialties", where: { published: { equals: true } }, depth: 0, locale: "*", limit: 0, overrideAccess: true }),
      payload.find({ collection: "branches", where: { published: { equals: true } }, depth: 1, locale: "*", limit: 0, overrideAccess: true }),
      payload.find({ collection: "reviews", depth: 1, limit: 0, sort: "-date", overrideAccess: true }),
      payload.find({ collection: "faq", where: { published: { equals: true } }, depth: 0, locale: "*", limit: 0, overrideAccess: true }),
      payload.find({ collection: "site_images", depth: 1, locale: "*", limit: 0, overrideAccess: true }),
      payload.findGlobal({ slug: "settings", depth: 0, locale: "*", overrideAccess: true }),
    ]);

  const doctors: Doctor[] = (docRows.docs as Row[]).sort(bySortOrder).map((d) => {
    const r = d ?? {};
    return {
      id: str(r.slug),
      name: loc(r.name),
      patronymic: loc(r.patronymic),
      title: loc(r.title),
      specialties: ((r.specialties as Row[]) ?? []).map((x) => str(x?.slug)),
      experience: num(r.experience),
      category: (str(r.category) || "highest") as DocCategory,
      branches: ((r.branches as Row[]) ?? []).map((x) => str(x?.slug)),
      rating: num(r.rating, 4.9),
      reviewsCount: num(r.reviewsCount),
      price: num(r.price),
      bio: loc(r.bio),
      education: loc(r.education),
      photoUrl:
        (r.photo as Row)?.url ? str((r.photo as Row)?.url) : undefined,
    };
  });

  const specialties: Specialty[] = (specRows.docs as Row[]).sort(bySortOrder).map((s) => {
    const r = s ?? {};
    const servicesMap = (r.services ?? {}) as { ru?: unknown; kz?: unknown };
    const ruSvc = ((servicesMap.ru as Row[]) ?? []);
    const kzSvc = ((servicesMap.kz as Row[]) ?? []);
    return {
      slug: str(r.slug),
      kind: (str(r.kind) || "specialty") as SpecialtyKind,
      icon: str(r.icon) || "Stethoscope",
      name: loc(r.name),
      short: loc(r.short),
      desc: loc(r.desc),
      services: ruSvc.map((x, i) => {
        const y = kzSvc[i] ?? {};
        const noteRu = str(x?.note);
        const noteKz = str(y?.note);
        return {
          name: { ru: str(x?.name), kz: str(y?.name) || str(x?.name) },
          price: num(x?.price),
          note: noteRu || noteKz ? { ru: noteRu, kz: noteKz } : undefined,
        };
      }),
      featured: Boolean(r.featured),
    };
  });

  const branches: Branch[] = (branchRows.docs as Row[]).sort(bySortOrder).map((b) => {
    const r = b ?? {};
    const hoursMap = (r.hours ?? {}) as { ru?: unknown; kz?: unknown };
    const toLines = (list: unknown): { ru: string; kz: string }[] =>
      ((list as Row[]) ?? []).map((x) => ({ ru: str(x?.line), kz: str(x?.line) }));
    const ruHours = toLines(hoursMap.ru);
    const kzHours = toLines(hoursMap.kz);
    const hiMap = (r.highlights ?? {}) as { ru?: unknown; kz?: unknown };
    const chop = (list: unknown): string[] =>
      ((list as unknown[]) ?? []).map((x) => (typeof x === "string" ? x : "")).filter(Boolean);
    const ruHi = chop(hiMap.ru);
    const kzHi = chop(hiMap.kz);
    return {
      id: str(r.slug),
      name: loc(r.name),
      district: loc(r.district),
      address: loc(r.address),
      phone: str(r.phone),
      hours: ruHours.map((h, i) => ({ ru: h.ru, kz: kzHours[i]?.kz ?? h.kz })),
      desc: loc(r.desc),
      highlights: ruHi.map((h, i) => ({ ru: h, kz: kzHi[i] ?? h })),
      landmark: loc(r.landmark),
      mapUrl: str(r.mapUrl),
    };
  });

  const reviews: Review[] = (reviewRows.docs as Row[]).map((v) => {
    const r = v ?? {};
    return {
      id: String(r.id ?? ""),
      author: str(r.author),
      date: str(r.date),
      rating: num(r.rating, 5),
      branchId: (r.branch as Row)?.slug ? str((r.branch as Row)?.slug) : undefined,
      doctorId: (r.doctor as Row)?.slug ? str((r.doctor as Row)?.slug) : undefined,
      text: str(r.text),
      local: str(r.source) === "site",
    };
  });

  const faq: FaqItem[] = (faqRows.docs as Row[]).sort(bySortOrder).map((f) => {
    const r = f ?? {};
    return { q: loc(r.q), a: loc(r.a) };
  });

  const images: SiteContent["images"] = {};
  for (const img of imageRows.docs as Row[]) {
    const r = img ?? {};
    const key = str(r.key) as string;
    const alt = loc(r.alt);
    images[key] = {
      url: (r.image as Row)?.url ? str((r.image as Row)?.url) : str(r.fallbackUrl),
      altRu: alt.ru,
      altKz: alt.kz,
    };
  }

  const st = settings as Row;
  return {
    doctors,
    specialties,
    branches,
    reviews,
    faq,
    images,
    settings: {
      phone_main: str(st?.phone_main),
      phone_mobile: str(st?.phone_mobile),
      whatsapp: str(st?.whatsapp),
      email: str(st?.email ?? ""),
      clinic_legal: str(st?.clinic_legal ?? ""),
    },
  };
}

/** Редактируемые тексты из Payload: { ru: {key:value}, kz: {...} } */
export async function getDbTexts(): Promise<Dicts> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "site_texts",
    depth: 0,
    locale: "*",
    limit: 0,
    overrideAccess: true,
  });
  const ru: Record<string, string> = {};
  const kz: Record<string, string> = {};
  for (const doc of res.docs as Row[]) {
    const r = doc ?? {};
    const key = str(r.key);
    if (!key) continue;
    const value = loc(r.value);
    ru[key] = value.ru;
    if (value.kz) kz[key] = value.kz;
  }
  return { ru, kz };
}
