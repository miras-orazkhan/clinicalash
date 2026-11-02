import type { CollectionConfig } from "payload";

/** Медиабиблиотека: файлы врачей/филиалов лежат в public/uploads (как и раньше) */
export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "filename",
    group: "Система",
  },
  access: {
    read: () => true,
  },
  upload: {
    // cwd в Next-рантайме — корень проекта
    staticDir: `${process.cwd()}/public/uploads`,
    mimeTypes: ["image/*"],
    // Существующие файлы в /uploads/doctors/... остаются доступны по старым URL;
    // новые загрузки кладутся по имени файла прямо в /uploads/
    disableLocalStorage: false,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alt-описание",
    },
  ],
};
