/**
 * Сид: переносит статический контент (врачи, специализации, филиалы, отзывы,
 * FAQ) и встроенные словари текстов в БД. Идемпотентен: существующие записи
 * не перезаписываются — дозаполняются только отсутствующие.
 * Запуск: bun scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { branches, doctors, allSpecialties, reviews, faq } from "../src/lib/alash/data";
import { ruDict, kzDict } from "../src/lib/alash/dicts";

const db = new PrismaClient();

async function main() {
  // --- Врачи ---
  if ((await db.doctor.count()) === 0) {
    for (const [i, d] of doctors.entries()) {
      await db.doctor.create({
        data: {
          id: d.id,
          nameRu: d.name.ru,
          nameKz: d.name.kz,
          patronymicRu: d.patronymic.ru,
          patronymicKz: d.patronymic.kz,
          titleRu: d.title.ru,
          titleKz: d.title.kz,
          specialties: JSON.stringify(d.specialties),
          experience: d.experience,
          category: d.category,
          branches: JSON.stringify(d.branches),
          rating: d.rating,
          reviewsCount: d.reviewsCount,
          price: d.price,
          bioRu: d.bio.ru,
          bioKz: d.bio.kz,
          educationRu: d.education.ru,
          educationKz: d.education.kz,
          sortOrder: i,
        },
      });
    }
    console.log(`doctors: ${doctors.length}`);
  }

  // --- Специализации (включая процедуры) ---
  if ((await db.specialty.count()) === 0) {
    for (const [i, s] of allSpecialties.entries()) {
      await db.specialty.create({
        data: {
          slug: s.slug,
          kind: s.kind,
          icon: s.icon,
          nameRu: s.name.ru,
          nameKz: s.name.kz,
          shortRu: s.short.ru,
          shortKz: s.short.kz,
          descRu: s.desc.ru,
          descKz: s.desc.kz,
          featured: Boolean(s.featured),
          services: JSON.stringify(s.services),
          sortOrder: i,
        },
      });
    }
    console.log(`specialties: ${allSpecialties.length}`);
  }

  // --- Филиалы ---
  if ((await db.branch.count()) === 0) {
    for (const [i, b] of branches.entries()) {
      await db.branch.create({
        data: {
          id: b.id,
          nameRu: b.name.ru,
          nameKz: b.name.kz,
          districtRu: b.district.ru,
          districtKz: b.district.kz,
          addressRu: b.address.ru,
          addressKz: b.address.kz,
          phone: b.phone,
          hours: JSON.stringify(b.hours),
          descRu: b.desc.ru,
          descKz: b.desc.kz,
          highlights: JSON.stringify(b.highlights),
          landmarkRu: b.landmark.ru,
          landmarkKz: b.landmark.kz,
          mapUrl: b.mapUrl,
          sortOrder: i,
        },
      });
    }
    console.log(`branches: ${branches.length}`);
  }

  // --- Отзывы ---
  if ((await db.review.count()) === 0) {
    for (const r of reviews) {
      await db.review.create({
        data: {
          id: r.id,
          author: r.author,
          date: r.date,
          rating: r.rating,
          branchId: r.branchId ?? null,
          doctorId: r.doctorId ?? null,
          text: r.text,
          source: "imported",
        },
      });
    }
    console.log(`reviews: ${reviews.length}`);
  }

  // --- FAQ ---
  if ((await db.faqItem.count()) === 0) {
    for (const [i, f] of faq.entries()) {
      await db.faqItem.create({
        data: { qRu: f.q.ru, qKz: f.q.kz, aRu: f.a.ru, aKz: f.a.kz, sortOrder: i },
      });
    }
    console.log(`faq: ${faq.length}`);
  }

  // --- Тексты интерфейса (дозаполнение отсутствующих ключей) ---
  const existing = new Set((await db.siteText.findMany({ select: { key: true } })).map((t) => t.key));
  let texts = 0;
  const entries = Object.keys(ruDict) as (keyof typeof ruDict)[];
  for (const key of entries) {
    if (existing.has(key)) continue;
    await db.siteText.create({
      data: { key, valueRu: ruDict[key], valueKz: kzDict[key] ?? "" },
    });
    texts++;
  }
  console.log(`siteTexts: +${texts} (всего ${entries.length})`);

  // --- Фотографии сайта ---
  const images: [string, string, string, string][] = [
    ["hero.doctor", "/hero-doctor.png", "Врач медицинского центра «Алаш»", "«Алаш» медициналық орталығының дәрігері"],
    ["team.group", "/team/group.jpg", "Команда медицинского центра «Алаш»", "«Алаш» медициналық орталығының командасы"],
  ];
  for (const [key, url, altRu, altKz] of images) {
    await db.siteImage.upsert({
      where: { key },
      update: {},
      create: { key, url, altRu, altKz },
    });
  }

  // --- Настройки ---
  const settings: [string, string][] = [
    ["admin_password", "alash2026"],
    ["phone_main", "+7 (727) 350-40-40"],
    ["phone_mobile", "+7 701 350 40 40"],
    ["whatsapp", "77013504040"],
    ["email", "info@alashmed.kz"],
    ["clinic_legal", "ТОО «Алаш Медикал»"],
    ["clinic_license", "Лицензия № KZ92VCU00012345 от 15.03.2024"],
  ];
  for (const [key, value] of settings) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("settings + images: ok");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
