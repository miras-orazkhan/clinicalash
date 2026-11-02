import type { CollectionConfig } from "payload";

/** Фотографии сайта по ключам: hero.doctor, team.group */
export const SiteImages: CollectionConfig = {
  slug: "site_images",
  defaultSort: "key",
  admin: {
    useAsTitle: "key",
    group: "Тексты",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "key",
      type: "text",
      unique: true,
      index: true,
      required: true,
      label: "Ключ (hero.doctor, team.group)",
    },
    {
      name: "image",
      type: "relationship",
      relationTo: "media",
      label: "Новое фото (библиотека /uploads)",
    },
    {
      name: "fallbackUrl",
      type: "text",
      label: "Или готовый URL (например /hero-doctor.png)",
      admin: {
        description:
          "Сейчас на сайте используется этот URL. Новое фото в библиотеке имеет приоритет.",
      },
    },
    {
      name: "alt",
      type: "text",
      localized: true,
      label: "Alt-описание",
    },
  ],
};
