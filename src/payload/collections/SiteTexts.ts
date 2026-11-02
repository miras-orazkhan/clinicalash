import type { CollectionConfig } from "payload";

/** Тексты интерфейса сайта: 233 ключа × RU/KZ, перекрывают встроенный словарь */
export const SiteTexts: CollectionConfig = {
  slug: "site_texts",
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
      label: "Ключ (hero.title1, adv.3.text, nav.doctors...)",
      admin: {
        description:
          "Группы: hero / home / adv / dp / sp / team / br / rp / faq / about / cta / footer / nav ...",
      },
    },
    {
      name: "value",
      type: "textarea",
      localized: true,
      required: true,
      label: "Текст",
    },
  ],
};
