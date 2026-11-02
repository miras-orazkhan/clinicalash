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

База данных — PostgreSQL (docker-контейнер `clinicalash`, порт 5434) — сайт сразу запускается с данными:
58 врачей, 47 направлений с прайсом (235 услуг), 2 филиала (24/7), отзывы, FAQ, все тексты RU/KZ.

> **Windows:** скрипт `dev` использует `tee` — запускайте в Git Bash / WSL, либо напрямую:
> `npx next dev -p 3000`

---

## База данных

PostgreSQL в docker-контейнере `clinicalash` (127.0.0.1:5434), **две базы**:

- `clinicalash` — legacy-таблицы прежней админки (Prisma). Больше не читаются сайтом; можно удалить.
- `clinicalash_cms` — живой контент Payload (врачи, прайсы, тексты RU/KZ, заявки).

`DATABASE_URL` / `PAYLOAD_DATABASE_URL` в `.env` указывают соответственно.

### Запуск
```bash
docker run -d --name clinicalash \
  -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres \
  -p 127.0.0.1:5434:5432 -v clinicalash_pgdata:/var/lib/postgresql/data \
  --restart unless-stopped postgres:16-alpine
```
При первом `npm run dev` Payload сам создаёт свои таблицы в `clinicalash_cms`.

### Пересоздать пустую БД Payload ( disaster-restore )
Том `clinicalash_pgdata` хранит данные. Если база потерялась:
```bash
docker exec clinicalash psql -U postgres -c "CREATE DATABASE clinicalash_cms"   # после DROP при необходимости
npm run dev
# пересоздать контент из снапшота prisma/seed-data.json (58 врачей, прайсы, тексты RU/KZ, фото):
curl -X POST http://localhost:3000/api/payload-migrate -H "x-migrate-key: $(grep ^PAYLOAD_SECRET .env | cut -d= -f2)"
```

> **Без Docker:** любой PostgreSQL 12+, создать базы `clinicalash`/`clinicalash_cms` и поправить `.env`.

---

## Админка (CMS)

Единая админка — **Payload CMS**: **http://localhost:3000/cms** (логин `admin@alash.kz`, пароль `alash2026`).

- Поля RU/ҚАЗ — вкладками локализации сверху страницы документа;
- связи (направления/филиалы врача) — выбором из списка, прайс-листы — редактором строк с ценами в ₸;
- фото — в медиабиблиотеке (`/uploads`, клик по иконке в карточке врача);
- заявки записи (`АЛШ-…`) и отзывы посетителей приходят в коллекции Bookings/Reviews.

> Смена пароля администратора: `/cms` → учеётные записи (admin@alash.kz) → новый пароль.
> CSV-импорт/экспорт из прежней админки не перенесён — запросите, если нужен.

После правок контента в `/cms` обновляйте снапшот для disaster-restore:
```bash
curl -X POST "http://localhost:3000/api/payload-migrate?export=1" \
  -H "x-migrate-key: $(grep ^PAYLOAD_SECRET .env | cut -d= -f2)" > prisma/seed-data.json
git add prisma/seed-data.json && git commit -m "контент: снапшот" && git push
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
src/app/(site)/          маршруты: / (публичный сайт), /api/bookings, /api/reviews
src/app/(payload)/       админка Payload (/cms) и REST API (/api/payload/*)
src/payload/             коллекции CMS (doctors, specialties, branches, reviews, faq,
                         bookings, site_texts, site_images, media, users) + global settings
payload.config.ts        конфиг Payload: локали ru/kz, маршруты, Postgres-адаптер
src/components/alash/    UI: страницы, шапка, поиск, виджеты записи
src/lib/alash/           dicts.ts (тексты RU/KZ), content.ts (чтение из Payload),
                         payloadClient.ts, i18n
prisma/seed-data.json    снапшот контента для восстановления Payload-БД (см. выше)
db/custom.db             SQLite-снапшот исходной БД (legacy, можно удалить)
docker: clinicalash      PostgreSQL 16 на 127.0.0.1:5434 (том clinicalash_pgdata)
public/                  фото врачей, hero, логотипы
```

Публичные страницы: `/doctors`, `/doctors/:id`, `/specializations`, `/specializations/:slug`,
`/about`, `/branches`, `/branches/:id`, `/reviews`, `/faq`, `/privacy`.

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| Ошибки типов Prisma / пустые списки | `npx prisma generate`, перезапустить dev |
| Сайт пустой, «Unable to connect» в логах | проверить `DATABASE_URL` в `.env`; запущен ли контейнер `clinicalash` (`docker ps`) |
| Контейнера нет / БД пуста | см. раздел «База данных» выше: `docker run …` + `npx prisma db push && npx prisma db seed` |
| Порт 5434 занят | остановить конкурирующий контейнер или сменить порт в `docker run` и в `.env` |
| Порт 3000 занят | `npx next dev -p 3001` |
| `tee: command not found` (Windows) | Git Bash / WSL или `npx next dev -p 3000` |

---

## Безопасность

- Репозиторий содержит данные клиники и пароль админки по умолчанию — **держите репозиторий приватным**.
- Пароль БД (`password` в `DATABASE_URL`) — только для локальной разработки; контейнер слушает 127.0.0.1, наружу не открыт.
- После первого запуска смените пароль админки: `/admin` → Настройки.
