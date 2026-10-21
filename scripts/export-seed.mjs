/**
 * Экспорт контента БД → prisma/seed-data.json
 *
 * Запускается ЛОКАЛЬНО после правок контента (админка / прямой импорт),
 * чтобы обновить сид-данные для переноса на другую машину:
 *
 *   node scripts/export-seed.mjs
 *
 * Что экспортируется: Branch, Specialty, Doctor, Review, FaqItem,
 * SiteText, SiteImage, Setting.
 * Что НЕ экспортируется: Booking (заявки — рантайм-данные),
 * служебные даты createdAt/updatedAt (генерируются заново при сиде).
 *
 * Файлы фото живут в public/ и переносятся вместе с кодом проекта,
 * в БД хранятся только пути (photoUrl, SiteImage.url).
 */
import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const prisma = new PrismaClient()

// Поля-даты, которые не включаем в сид (Prisma проставит сам)
const strip = (rows, dateFields) =>
  rows.map((r) => {
    const c = { ...r }
    for (const f of dateFields) delete c[f]
    return c
  })

try {
  const [branches, specialties, doctors, reviews, faq, siteTexts, siteImages, settings] =
    await Promise.all([
      prisma.branch.findMany({ orderBy: { id: 'asc' } }),
      prisma.specialty.findMany({ orderBy: { slug: 'asc' } }),
      prisma.doctor.findMany({ orderBy: { id: 'asc' } }),
      prisma.review.findMany({ orderBy: { id: 'asc' } }),
      prisma.faqItem.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.siteText.findMany({ orderBy: { key: 'asc' } }),
      prisma.siteImage.findMany({ orderBy: { key: 'asc' } }),
      prisma.setting.findMany({ orderBy: { key: 'asc' } }),
    ])

  const data = {
    _meta: {
      exportedAt: new Date().toISOString(),
      note: 'Сид-данные сайта «Алаш». Пересоздаётся командой: node scripts/export-seed.mjs',
      counts: {
        branches: branches.length,
        specialties: specialties.length,
        doctors: doctors.length,
        reviews: reviews.length,
        faq: faq.length,
        siteTexts: siteTexts.length,
        siteImages: siteImages.length,
        settings: settings.length,
      },
    },
    branches: strip(branches, ['updatedAt']),
    specialties: strip(specialties, ['updatedAt']),
    doctors: strip(doctors, ['createdAt', 'updatedAt']),
    reviews: strip(reviews, ['createdAt']),
    faq: strip(faq, []),
    siteTexts: strip(siteTexts, ['updatedAt']),
    siteImages: strip(siteImages, ['updatedAt']),
    settings: strip(settings, ['updatedAt']),
  }

  const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'prisma', 'seed-data.json')
  writeFileSync(out, JSON.stringify(data, null, 2), 'utf8')

  console.log('Экспорт завершён →', out)
  console.log('Счётчики:', JSON.stringify(data._meta.counts))
} finally {
  await prisma.$disconnect()
}
