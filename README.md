# Сайт медицинского центра «Алаш» (Алматы)

Двуязычный (RU/ҚАЗ) сайт круглосуточной клиники: врачи, направления и прайс, филиалы, отзывы, FAQ, запись на приём и CMS-админка.

**Стек:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Prisma + SQLite

---

## Быстрый старт (5 минут)

```bash
git clone https://github.com/miras-orazkhan/clinicalash.git
cd clinicalash
bun install            # или: npm install
npx prisma generate
npm run dev            # → http://localhost:3000
```

База данных уже в репозитории (`db/custom.db`) — сайт сразу запускается с данными:
58 врачей, 47 направлений с прайсом (235 услуг), 2 филиала (24/7), отзывы, FAQ, все тексты RU/KZ.

> **Windows:** скрипт `dev` использует `tee` — запускайте в Git Bash / WSL, либо напрямую:
> `npx next dev -p 3000`

---

## База данных

### Как есть (рекомендуется)
Ничего делать не нужно — снапшот `db/custom.db` лежит в репо, `.env` уже настроен:
```
DATABASE_URL=file:../db/custom.db
```
Относительный путь резолвится от `prisma/schema.prisma`, то есть указывает на `<проект>/db/custom.db` на любой машине. Если папку проекта перемещаете — путь менять не нужно; если хотите абсолютный:

```
DATABASE_URL=file:/полный/путь/к/проекту/db/custom.db
```

### С чистой базы (создать и наполнить сидом)
```bash
cp .env.example .env          # или создайте .env вручную (см. выше)
npx prisma db push            # создать таблицы
npx prisma db seed            # наполнить всеми данными
```

---

## Админка (CMS)

- Адрес: **http://localhost:3000/admin** (пароль по умолчанию: `alash2026`)
- Разделы: врачи, направления и услуги, филиалы, отзывы, FAQ, тексты RU/KZ, фото, настройки контактов, заявки записи, CSV-импорт/экспорт

После правок контента обновляйте сид-снимок:
```bash
npm run db:export-seed        # перезапишет prisma/seed-data.json
git add -A && git commit -m "контент: ..." && git push
```

---

## Продакшн-сборка (опционально)

```bash
npm run build
npm start                     # NODE_ENV=production bun .next/standalone/server.js
```
`npm start` требует [bun](https://bun.sh); без него:
```bash
NODE_ENV=production node .next/standalone/server.js
```

---

## Требования

| Инструмент | Версия |
|------------|--------|
| Node.js    | 20 LTS или новее |
| bun (опционально, но быстрее) | 1.2+ |

---

## Структура проекта

```
src/app/                 маршруты: / (публичный сайт), /admin (CMS), /api
src/components/alash/    UI: страницы, шапка, поиск, виджеты записи
src/lib/alash/           dicts.ts (тексты RU/KZ), content.ts (чтение из БД),
                         router.tsx (hash-роутер #/doctors, #/branches …), i18n
prisma/schema.prisma     модель данных (Doctor, Specialty, Branch, Review, FaqItem,
                         SiteText, SiteImage, Setting, Booking)
prisma/seed.mjs          сид: наполняет БД из seed-data.json (идемпотентен)
prisma/seed-data.json    снимок всех контентных данных для переноса
scripts/                 импорт/экспорт: export-seed.mjs, csv, разовые импорты
db/custom.db             SQLite (снапшот в git; WAL/SHM не коммитятся)
public/                  фото врачей, hero, логотипы
```

Публичные страницы — hash-роутер: `#/doctors`, `#/doctors/:id`, `#/specializations`, `#/branches`, `#/branches/:id`, `#/reviews`, `#/faq`, `#/about`, `#/privacy`.

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Ошибки типов Prisma / пустые списки | `npx prisma generate`, перезапустить dev |
| Сайт пустой, «Unable to connect» в логах | проверить `DATABASE_URL` в `.env`; путь относительный — от папки `prisma/` |
| Порт 3000 занят | `npx next dev -p 3001` |
| `tee: command not found` (Windows) | Git Bash / WSL или `npx next dev -p 3000` |
| БД заблокирована (database is locked) | остановить второй процесс dev/скрипты, перезапустить |

---

## Безопасность

- Репозиторий содержит данные клиники и пароль админки по умолчанию — **держите репозиторий приватным**.
- После первого запуска смените пароль админки: `/admin` → Настройки.
- Файл `.env` секретов не содержит (только путь к БД), но в git-истории ранее был абсолютный путь контейнера — не критично.
