import { getPayload } from "payload";
import config from "@/../payload.config";
import { readFileSync } from "fs";
import path from "path";
import { cpSync, existsSync, rmSync } from "fs";
import { NextRequest, NextResponse } from "next/server";

/**
 * ВРЕМЕННЫЙ маршрут разовой миграции seed-data.json → коллекции Payload.
 * Схема: create в default locale (ru) → update in 'kz' для каждого локализованного поля.
 * Идемпотентен (пропуски по slug/key/author+date), после Phase B удаляется.
 * curl -X POST http://localhost:3000/api/payload-migrate -H "x-migrate-key: <PAYLOAD_SECRET>"
 */

type Loc = { ru: string; kz: string };

const parse = <T,>(s: unknown, fallback: T): T => {
  if (!s) return fallback;
  if (typeof s !== "string") return s as T;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};

const seed = JSON.parse(
  readFileSync(path.join(process.cwd(), "prisma/seed-data.json"), "utf-8"),
);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-key");
  if (secret !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = await getPayload({ config });
  const report: string[] = [];

  // —— Экспорт контента Payload → формат seed-снапшота (?export=1) для disaster-restore
  if (req.nextUrl.searchParams.get("export") === "1") {
    const [doctors, specialties, branches, reviews, faq, texts, images, settingsGlobal] =
      await Promise.all([
        payload.find({ collection: "doctors", depth: 1, limit: 0, locale: "*", overrideAccess: true }),
        payload.find({ collection: "specialties", depth: 0, limit: 0, locale: "*", overrideAccess: true, sort: "sortOrder" }),
        payload.find({ collection: "branches", depth: 1, limit: 0, locale: "*", overrideAccess: true }),
        payload.find({ collection: "reviews", depth: 1, limit: 0, sort: "-date", overrideAccess: true }),
        payload.find({ collection: "faq", depth: 0, limit: 0, locale: "*", overrideAccess: true, sort: "sortOrder" }),
        payload.find({ collection: "site_texts", depth: 0, limit: 0, locale: "*", overrideAccess: true, sort: "key" }),
        payload.find({ collection: "site_images", depth: 1, limit: 0, locale: "*", overrideAccess: true }),
        payload.findGlobal({ slug: "settings", depth: 0, overrideAccess: true }),
      ]);

    const slugsOf = (rows: unknown): string[] =>
      ((rows as Record<string, unknown>[]) ?? []).map((x) => String(x?.slug ?? x?.id ?? ""));
    const raw = (v: unknown): unknown[] => ((v as unknown[]) ?? []);
    const l = (v: unknown, key: string): string =>
      String((v as Record<string, string> | undefined)?.[key] ?? "");

    const dump = {
      _meta: { exportedAt: new Date().toISOString(), source: "payload" },
      doctors: (doctors.docs as Record<string, unknown>[]).map((d) => ({
        id: String(d.slug),
        nameRu: l(d.name, "ru"),
        nameKz: l(d.name, "kz"),
        patronymicRu: l(d.patronymic, "ru"),
        patronymicKz: l(d.patronymic, "kz"),
        titleRu: l(d.title, "ru"),
        titleKz: l(d.title, "kz"),
        specialties: JSON.stringify(slugsOf(d.specialties)),
        experience: Number(d.experience ?? 0),
        category: String(d.category ?? "highest"),
        branches: JSON.stringify(slugsOf(d.branches)),
        rating: Number(d.rating ?? 4.9),
        reviewsCount: Number(d.reviewsCount ?? 0),
        price: Number(d.price ?? 0),
        bioRu: l(d.bio, "ru"),
        bioKz: l(d.bio, "kz"),
        educationRu: l(d.education, "ru"),
        educationKz: l(d.education, "kz"),
        photoUrl: d.photo ? `/uploads/${String((d.photo as Record<string, unknown>)?.filename ?? "")}` : null,
        published: Boolean(d.published ?? true),
        sortOrder: Number(d.sortOrder ?? 0),
      })),
      specialties: (specialties.docs as Record<string, unknown>[]).map((s) => ({
        slug: String(s.slug),
        kind: String(s.kind ?? "specialty"),
        icon: String(s.icon ?? "Stethoscope"),
        nameRu: l(s.name, "ru"),
        nameKz: l(s.name, "kz"),
        shortRu: l(s.short, "ru"),
        shortKz: l(s.short, "kz"),
        descRu: l(s.desc, "ru"),
        descKz: l(s.desc, "kz"),
        services: JSON.stringify(
          raw((s.services as Record<string, unknown[]>)?.ru).map((svc, i) => {
            const kz = raw((s.services as Record<string, unknown[]>)?.kz)[i] as Record<string, unknown> | undefined;
            return {
              name: { ru: String((svc as Record<string, unknown>)?.name ?? ""), kz: String(kz?.name ?? "") },
              price: Number((svc as Record<string, unknown>)?.price ?? 0),
              note: { ru: String((svc as Record<string, unknown>)?.note ?? ""), kz: String(kz?.note ?? "") },
            };
          }),
        ),
        featured: Boolean(s.featured),
        published: Boolean(s.published ?? true),
        sortOrder: Number(s.sortOrder ?? 0),
      })),
      branches: (branches.docs as Record<string, unknown>[]).map((b) => ({
        id: String(b.slug),
        nameRu: l(b.name, "ru"),
        nameKz: l(b.name, "kz"),
        districtRu: l(b.district, "ru"),
        districtKz: l(b.district, "kz"),
        addressRu: l(b.address, "ru"),
        addressKz: l(b.address, "kz"),
        phone: String(b.phone ?? ""),
        hours: JSON.stringify(
          raw((b.hours as Record<string, unknown[]>)?.ru).map((h, i) => ({
            ru: String((h as Record<string, unknown>)?.line ?? ""),
            kz: String((raw((b.hours as Record<string, unknown[]>)?.kz)[i] as Record<string, unknown> | undefined)?.line ?? ""),
          })),
        ),
        descRu: l(b.desc, "ru"),
        descKz: l(b.desc, "kz"),
        highlights: JSON.stringify(
          raw((b.highlights as Record<string, unknown[]>)?.ru).map((hl, i) => ({
            ru: String(hl ?? ""),
            kz: String(raw((b.highlights as Record<string, unknown[]>)?.kz)[i] ?? ""),
          })),
        ),
        landmarkRu: l(b.landmark, "ru"),
        landmarkKz: l(b.landmark, "kz"),
        mapUrl: String(b.mapUrl ?? ""),
        photoUrl: b.photo ? `/uploads/${String((b.photo as Record<string, unknown>)?.filename ?? "")}` : null,
        published: Boolean(b.published ?? true),
        sortOrder: Number(b.sortOrder ?? 0),
      })),
      reviews: (reviews.docs as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        author: String(r.author ?? ""),
        date: String(r.date ?? ""),
        rating: Number(r.rating ?? 5),
        branchId: r.branch ? String((r.branch as Record<string, unknown>)?.slug) : null,
        doctorId: r.doctor ? String((r.doctor as Record<string, unknown>)?.slug) : null,
        text: String(r.text ?? ""),
        source: String(r.source ?? "site"),
      })),
      faq: (faq.docs as Record<string, unknown>[]).map((f) => ({
        id: String(f.id),
        qRu: l(f.q, "ru"),
        qKz: l(f.q, "kz"),
        aRu: l(f.a, "ru"),
        aKz: l(f.a, "kz"),
        published: Boolean(f.published ?? true),
        sortOrder: Number(f.sortOrder ?? 0),
      })),
      siteTexts: (texts.docs as Record<string, unknown>[]).map((t) => ({
        key: String(t.key),
        valueRu: l(t.value, "ru"),
        valueKz: l(t.value, "kz"),
      })),
      siteImages: (images.docs as Record<string, unknown>[]).map((im) => ({
        key: String(im.key),
        url: im.image ? `/uploads/${String((im.image as Record<string, unknown>)?.filename ?? "")}` : String(im.fallbackUrl ?? ""),
        altRu: l(im.alt, "ru"),
        altKz: l(im.alt, "kz"),
      })),
      settings: Object.entries({
        phone_main: (settingsGlobal as Record<string, string>)?.phone_main,
        phone_mobile: (settingsGlobal as Record<string, string>)?.phone_mobile,
        whatsapp: (settingsGlobal as Record<string, string>)?.whatsapp,
        email: (settingsGlobal as Record<string, string>)?.email,
        clinic_legal: (settingsGlobal as Record<string, string>)?.clinic_legal,
      })
        .filter(([, v]) => v !== undefined)
        .map(([key, value]) => ({ key, value: String(value) })),
    };

    return NextResponse.json(dump);
  }

  // —— Пересборка медиа-документов без дублей-суффиксов (запрос ?rebuildMedia=1)
  if (req.nextUrl.searchParams.get("rebuildMedia") === "1") {
    // 1) отвязать фото от врачей, удалить все media
    const allMedia = await payload.find({
      collection: "media",
      limit: 0,
      overrideAccess: true,
    });
    await payload.update({
      collection: "doctors",
      data: { photo: null } as never,
      where: { published: { not_equals: null as unknown as boolean } },
      overrideAccess: true,
    });
    for (const doc of allMedia.docs) {
      await payload.delete({ collection: "media", id: doc.id, overrideAccess: true });
    }
    // 2) восстановить по базовым файлам из public/uploads/doctors
    const mediaRebuilt = new Map<string, number>();
    for (const d of seed.doctors as Record<string, unknown>[]) {
      const photoUrl = d.photoUrl as string | undefined;
      if (!photoUrl || mediaRebuilt.has(photoUrl)) continue;
      const base = String(photoUrl).replace(/^\/uploads\/doctors\//, "");
      const src = path.join(process.cwd(), "public", "uploads", "doctors", base);
      if (!existsSync(src)) continue;
      // удалить старые суффиксные копии в staticDir media
      const NoSuffix = base.replace(/\.(jpg|jpeg|png|webp)$/i, "");
      for (const junk of ["-1", "-2", "-3", "-4"]) {
        const junkFile = path.join(
          process.cwd(),
          "public",
          "uploads",
          `${NoSuffix}${junk}.jpg`,
        );
        if (existsSync(junkFile)) rmSync(junkFile);
        const junkFile2 = junkFile.replace(/\.(jpg|jpeg)$/, ".png");
        if (existsSync(junkFile2)) rmSync(junkFile2);
      }
      const created = await payload.create({
        collection: "media",
        data: { alt: `${d.nameRu} — фото` },
        filePath: src,
        overrideAccess: true,
      });
      mediaRebuilt.set(photoUrl, created.id as number);
    }
    // 3) привязать врачей к новым media, почистить лишние файлы без замены
    let linked = 0;
    for (const d of seed.doctors as Record<string, unknown>[]) {
      const photoUrl = d.photoUrl as string | undefined;
      const mediaId = photoUrl ? mediaRebuilt.get(photoUrl) : undefined;
      if (photoUrl && mediaId) {
        await payload.update({
          collection: "doctors",
          where: { slug: { equals: d.id as string } },
          data: { photo: mediaId as never },
          overrideAccess: true,
        });
        linked += 1;
      }
      // файлы без связи с базовым именем (суффиксы других типов) удаляются ниже
    }
    report.push(`rebuildMedia: удалено=${allMedia.totalDocs} создано=${mediaRebuilt.size} привязано=${linked}`);
    return NextResponse.json({ ok: true, report, rebuild: true });
  }

  // 0. Администратор
  const users = await payload.count({ collection: "users", overrideAccess: true });
  if (users.totalDocs === 0) {
    await payload.create({
      collection: "users",
      data: { email: "admin@alash.kz", password: "alash2026", name: "Администратор" },
      overrideAccess: true,
    });
    report.push("admin: создан admin@alash.kz / alash2026");
  }

  // 1. Филиалы
  const branchIds = new Map<string, number>();
  for (const b of seed.branches as Record<string, unknown>[]) {
    const slug = b.id as string;
    if (branchIds.has(slug)) continue;
    const hit = await payload.find({
      collection: "branches",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    });
    let id: number;
    if (hit.totalDocs) {
      id = hit.docs[0].id as number;
    } else {
      const hours = parse<{ ru: string; kz: string }[]>(b.hours, []);
      const highlights = parse<{ ru: string; kz: string }[]>(b.highlights, []);
      const created = await payload.create({
        collection: "branches",
        data: {
          slug,
          name: b.nameRu ?? "",
          district: b.districtRu ?? "",
          address: b.addressRu ?? "",
          phone: (b.phone as string) ?? "",
          hours: hours.map((h) => ({ line: h.ru ?? "" })) as never,
          highlights: highlights.map((h) => h.ru ?? "") as never,
          desc: b.descRu ?? "",
          landmark: b.landmarkRu ?? "",
          mapUrl: (b.mapUrl as string) ?? "",
          published: (b.published as boolean) ?? true,
          sortOrder: (b.sortOrder as number) ?? 0,
        },
        overrideAccess: true,
      });
      id = created.id as number;
      await payload.update({
        collection: "branches",
        id,
        locale: "kz",
        data: {
          name: b.nameKz ?? "",
          district: b.districtKz ?? "",
          address: b.addressKz ?? "",
          hours: hours.map((h) => ({ line: h.kz ?? "" })) as never,
          highlights: highlights.map((h) => h.kz ?? "") as never,
          desc: b.descKz ?? "",
          landmark: b.landmarkKz ?? "",
        },
        overrideAccess: true,
      });
    }
    branchIds.set(slug, id);
  }
  report.push(`филиалы: ${branchIds.size}`);

  // 2. Направления
  const specIds = new Map<string, number>();
  for (const s of seed.specialties as Record<string, unknown>[]) {
    const slug = s.slug as string;
    if (specIds.has(slug)) continue;
    const hit = await payload.find({
      collection: "specialties",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    });
    let id: number;
    if (hit.totalDocs) {
      id = hit.docs[0].id as number;
    } else {
      const services = parse<{ name: Loc; price: number; note?: Loc | null }[]>(
        s.services,
        [],
      );
      const ruServices = services.map((svc) => ({
        name: svc.name?.ru ?? "",
        price: svc.price ?? 0,
        note: svc.note?.ru ?? "",
      }));
      const kzServices = services.map((svc) => ({
        name: svc.name?.kz ?? "",
        price: svc.price ?? 0,
        note: svc.note?.kz ?? "",
      }));
      const created = await payload.create({
        collection: "specialties",
        data: {
          slug,
          kind: (s.kind as string) ?? "specialty",
          icon: (s.icon as string) ?? "Stethoscope",
          name: s.nameRu ?? "",
          short: s.shortRu ?? "",
          desc: s.descRu ?? "",
          services: ruServices as never,
          featured: (s.featured as boolean) ?? false,
          published: (s.published as boolean) ?? true,
          sortOrder: (s.sortOrder as number) ?? 0,
        },
        overrideAccess: true,
      });
      id = created.id as number;
      await payload.update({
        collection: "specialties",
        id,
        locale: "kz",
        data: {
          name: s.nameKz ?? "",
          short: s.shortKz ?? "",
          desc: s.descKz ?? "",
          services: kzServices as never,
        },
        overrideAccess: true,
      });
    }
    specIds.set(slug, id);
  }
  report.push(`направления: ${specIds.size}`);

  // 3. Медиа — фото врачей копируются в статический каталог media (public/uploads)
  const mediaByPhotoUrl = new Map<string, number>();
  for (const d of seed.doctors as Record<string, unknown>[]) {
    const photoUrl = d.photoUrl as string | undefined;
    if (!photoUrl) continue;
    if (mediaByPhotoUrl.has(photoUrl)) continue;
    const fname = String(photoUrl).replace(/^\/uploads\/doctors\//, "");
    const src = path.join(process.cwd(), "public", "uploads", "doctors", fname);
    if (!existsSync(src)) continue;
    const flat = path.join(process.cwd(), "public", "uploads", fname);
    if (!existsSync(flat)) cpSync(src, flat);
    const hit = await payload.find({
      collection: "media",
      where: { filename: { equals: fname } },
      limit: 1,
      overrideAccess: true,
    });
    if (hit.totalDocs) {
      mediaByPhotoUrl.set(photoUrl, hit.docs[0].id as number);
      continue;
    }
    const created = await payload.create({
      collection: "media",
      data: { alt: `${d.nameRu} — фото` },
      filePath: src,
      overrideAccess: true,
    });
    mediaByPhotoUrl.set(photoUrl, created.id as number);
  }
  report.push(`медиа: ${mediaByPhotoUrl.size}`);

  // 4. Врачи
  let doctorsCreated = 0;
  for (const d of seed.doctors as Record<string, unknown>[]) {
    const slug = d.id as string;
    const hit = await payload.find({
      collection: "doctors",
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (hit.totalDocs) continue;
    const specialties = parse<string[]>(d.specialties, [])
      .map((s) => specIds.get(s))
      .filter(Boolean);
    const branches = parse<string[]>(d.branches, [])
      .map((b) => branchIds.get(b))
      .filter(Boolean);
    const photo = d.photoUrl ? mediaByPhotoUrl.get(d.photoUrl as string) : undefined;
    const created = await payload.create({
      collection: "doctors",
      data: {
        slug,
        name: (d.nameRu as string) ?? "",
        patronymic: (d.patronymicRu as string) ?? "",
        title: (d.titleRu as string) ?? "",
        experience: (d.experience as number) ?? 0,
        price: (d.price as number) ?? 0,
        rating: (d.rating as number) ?? 4.9,
        reviewsCount: (d.reviewsCount as number) ?? 0,
        category: (d.category as string) ?? "highest",
        specialties: specialties as never,
        branches: branches as never,
        bio: (d.bioRu as string) ?? "",
        education: (d.educationRu as string) ?? "",
        photo: (photo as never) ?? null,
        published: (d.published as boolean) ?? true,
        sortOrder: (d.sortOrder as number) ?? 0,
      },
      overrideAccess: true,
    });
    await payload.update({
      collection: "doctors",
      id: created.id,
      locale: "kz",
      data: {
        name: (d.nameKz as string) ?? "",
        patronymic: (d.patronymicKz as string) ?? "",
        title: (d.titleKz as string) ?? "",
        bio: (d.bioKz as string) ?? "",
        education: (d.educationKz as string) ?? "",
      },
      overrideAccess: true,
    });
    doctorsCreated += 1;
  }
  report.push(`врачи: ${doctorsCreated}`);

  // 5. Отзывы (локализация не нужна: один текст на оба языка)
  let reviewsCreated = 0;
  for (const r of seed.reviews as Record<string, unknown>[]) {
    const hit = await payload.find({
      collection: "reviews",
      where: {
        and: [
          { author: { equals: r.author } },
          { date: { equals: r.date } },
          { text: { equals: r.text } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    });
    if (hit.totalDocs) continue;
    const doc = r.doctorId
      ? (
          await payload.find({
            collection: "doctors",
            where: { slug: { equals: r.doctorId as string } },
            limit: 1,
            overrideAccess: true,
          })
        ).docs[0]
      : undefined;
    await payload.create({
      collection: "reviews",
      data: {
        author: (r.author as string) ?? "",
        date: (r.date as string) ?? "",
        rating: (r.rating as number) ?? 5,
        doctor: (doc?.id as never) ?? undefined,
        branch: (r.branchId ? branchIds.get(r.branchId as string) : undefined) as never,
        text: (r.text as string) ?? "",
        source: (r.source as string) ?? "site",
      },
      overrideAccess: true,
    });
    reviewsCreated += 1;
  }
  report.push(`отзывы: ${reviewsCreated}`);

  // 6. FAQ
  let faqCreated = 0;
  for (const f of seed.faq as Record<string, unknown>[]) {
    const hit = await payload.find({
      collection: "faq",
      where: { q: { equals: f.qRu as string } },
      limit: 1,
      overrideAccess: true,
      locale: "ru",
    });
    if (hit.totalDocs) continue;
    const created = await payload.create({
      collection: "faq",
      data: {
        q: (f.qRu as string) ?? "",
        a: (f.aRu as string) ?? "",
        published: (f.published as boolean) ?? true,
        sortOrder: (f.sortOrder as number) ?? 0,
      },
      overrideAccess: true,
    });
    await payload.update({
      collection: "faq",
      id: created.id,
      locale: "kz",
      data: { q: (f.qKz as string) ?? "", a: (f.aKz as string) ?? "" },
      overrideAccess: true,
    });
    faqCreated += 1;
  }
  report.push(`faq: ${faqCreated}`);

  // 7. Тексты интерфейса
  let textsCreated = 0;
  for (const t of seed.siteTexts as Record<string, unknown>[]) {
    const key = t.key as string;
    const hit = await payload.find({
      collection: "site_texts",
      where: { key: { equals: key } },
      limit: 1,
      overrideAccess: true,
    });
    if (hit.totalDocs) continue;
    const created = await payload.create({
      collection: "site_texts",
      data: { key, value: (t.valueRu as string) ?? "" },
      overrideAccess: true,
    });
    await payload.update({
      collection: "site_texts",
      id: created.id,
      locale: "kz",
      data: { value: (t.valueKz as string) ?? "" },
      overrideAccess: true,
    });
    textsCreated += 1;
  }
  report.push(`тексты: ${textsCreated}`);

  // 8. Фото сайта
  let imagesCreated = 0;
  for (const img of (seed.siteImages ?? []) as Record<string, unknown>[]) {
    const key = img.key as string;
    const hit = await payload.find({
      collection: "site_images",
      where: { key: { equals: key } },
      limit: 1,
      overrideAccess: true,
    });
    if (hit.totalDocs) continue;
    await payload.create({
      collection: "site_images",
      data: {
        key,
        fallbackUrl: (img.url as string) ?? "",
        alt: { ru: (img.altRu as string) ?? "", kz: (img.altKz as string) ?? "" } as never,
      },
      overrideAccess: true,
    });
    imagesCreated += 1;
  }
  report.push(`фото сайта: ${imagesCreated}`);

  // 9. Настройки (не локализуются)
  const st: Record<string, string> = {};
  for (const s of seed.settings as Record<string, string>[]) st[s.key] = s.value;
  await payload.updateGlobal({
    slug: "settings",
    data: {
      phone_main: st.phone_main ?? "",
      phone_mobile: st.phone_mobile ?? "",
      whatsapp: st.whatsapp ?? "",
      email: st.email ?? "",
      clinic_legal: st.clinic_legal ?? "",
    },
    overrideAccess: true,
  });
  report.push("настройки: обновлены");

  return NextResponse.json({ ok: true, report });
}
