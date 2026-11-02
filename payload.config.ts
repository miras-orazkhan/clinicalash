import sharp from "sharp";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";

import { Branches } from "./src/payload/collections/Branches";
import { Bookings } from "./src/payload/collections/Bookings";
import { Doctors } from "./src/payload/collections/Doctors";
import { Faq } from "./src/payload/collections/Faq";
import { Media } from "./src/payload/collections/Media";
import { Reviews } from "./src/payload/collections/Reviews";
import { SiteImages } from "./src/payload/collections/SiteImages";
import { SiteTexts } from "./src/payload/collections/SiteTexts";
import { Specialties } from "./src/payload/collections/Specialties";
import { Users } from "./src/payload/collections/Users";
import { Settings } from "./src/payload/globals/Settings";

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: "— Alash CMS",
    },
  },
  collections: [
    Users,
    Media,
    Doctors,
    Specialties,
    Branches,
    Reviews,
    Faq,
    Bookings,
    SiteTexts,
    SiteImages,
  ],
  globals: [Settings],
  // Rich text не используется — все поля сайта текстовые (textarea), Lexical отключён
  // Локализация всего RU/KZ-контента: поля с localized: true редактируются вкладками RU | ҚАЗ
  localization: {
    locales: [
      { code: "ru", label: "Русский" },
      { code: "kz", label: "Қазақша" },
    ],
    defaultLocale: "ru",
    fallback: true,
  },
  routes: {
    // Админка Payload — /cms (старая /admin остаётся до конца демо-периода)
    admin: "/cms",
    // REST API Payload — /api/payload/* (не пересекается со старыми /api/*)
    api: "/api/payload",
  },
  typescript: {
    autoGenerate: true,
    outputFile: "src/payload-types.ts",
  },
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: process.env.PAYLOAD_SERVER_URL || undefined,
  db: postgresAdapter({
    pool: {
      // Payload — отдельная база clinicalash_cms в том же контейнере (не смешивать с таблицами Prisma)
      connectionString: process.env.PAYLOAD_DATABASE_URL || "",
    },
  }),
  sharp,
});
