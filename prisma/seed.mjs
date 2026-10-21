/**
 * Сид БД сайта «Алаш» — наполняет базу данными из prisma/seed-data.json.
 *
 * ПЕРЕНОС НА ДРУГУЮ МАШИНУ:
 *   1. Скопировать проект целиком (включая prisma/seed-data.json и public/ — там фото).
 *   2. bun install  (или npm install)
 *   3. В .env указать DATABASE_URL=file:<путь>/db/custom.db
 *      (если БД-файла нет — создать: npx prisma db push)
 *   4. npx prisma generate
 *   5. npx prisma db seed        ← наполнит БД этими данными
 *
 * Свойства сида:
 *   - Идемпотентен: можно запускать повторно (upsert по id/key, ничего не дублируется).
 *   - Работает и на пустой БД (создаёт все строки), и на уже наполненной (обновляет значения).
 *   - Не трогает таблицу Booking (заявки с сайта — рантайм-данные).
 *   - Отзывам и FAQ сохраняет исходные id → ссылки отзывов на врачей/филиалы не ломаются.
 *
 * После правок контента на текущей машине обновите сид-данные:
 *   node scripts/export-seed.mjs
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const prisma = new PrismaClient()
const dataPath = join(dirname(fileURLToPath(import.meta.url)), 'seed-data.json')

if (!existsSync(dataPath)) {
  console.error('Не найден prisma/seed-data.json. Сначала выполните: node scripts/export-seed.mjs')
  process.exit(1)
}

const data = JSON.parse(readFileSync(dataPath, 'utf8'))
const counts = { branches: 0, specialties: 0, doctors: 0, reviews: 0, faq: 0, siteTexts: 0, siteImages: 0, settings: 0 }

// upsert по естественному ключу; extra-поля из JSON отфильтровываются по модели автоматически не будут —
// поэтому в export-seed.mjs уже вычищены даты; здесь дополнительно не пропускаем _meta и пр.
async function upsertMany(model, rows, uniqueKey, label) {
  for (const row of rows) {
    const { [uniqueKey]: key, ...vals } = row
    await model.upsert({ where: { [uniqueKey]: key }, create: { [uniqueKey]: key, ...vals }, update: vals })
  }
  counts[label] = rows.length
  console.log(`  ${label}: ${rows.length}`)
}

try {
  console.log('Сид БД из', dataPath)
  await upsertMany(prisma.branch, data.branches ?? [], 'id', 'branches')
  await upsertMany(prisma.specialty, data.specialties ?? [], 'slug', 'specialties')
  await upsertMany(prisma.doctor, data.doctors ?? [], 'id', 'doctors')
  await upsertMany(prisma.review, data.reviews ?? [], 'id', 'reviews')
  await upsertMany(prisma.faqItem, data.faq ?? [], 'id', 'faq')
  await upsertMany(prisma.siteText, data.siteTexts ?? [], 'key', 'siteTexts')
  await upsertMany(prisma.siteImage, data.siteImages ?? [], 'key', 'siteImages')
  await upsertMany(prisma.setting, data.settings ?? [], 'key', 'settings')

  // Контрольная сверка с фактическим состоянием БД
  const [dbDoctors, dbBranches, dbTexts] = await Promise.all([
    prisma.doctor.count(),
    prisma.branch.count(),
    prisma.siteText.count(),
  ])
  console.log(`Итог в БД: doctors=${dbDoctors}, branches=${dbBranches}, siteTexts=${dbTexts}`)
  console.log('Сид завершён успешно.')
} catch (e) {
  console.error('Ошибка сида:', e)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
void counts
