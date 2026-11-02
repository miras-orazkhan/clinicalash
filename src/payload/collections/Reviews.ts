import type { CollectionConfig } from "payload";

/** Отзывы (public: отзывы с сайта падают сюда же в Phase B) */
export const Reviews: CollectionConfig = {
  slug: "reviews",
  defaultSort: "-date",
  admin: {
    useAsTitle: "author",
    group: "Контент",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "author",
          type: "text",
          required: true,
          label: "Автор",
        },
        {
          name: "date",
          type: "text",
          label: "Дата (ISO yyyy-mm-dd)",
        },
        {
          name: "rating",
          type: "number",
          min: 1,
          max: 5,
          defaultValue: 5,
          label: "Оценка ★",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "doctor",
          type: "relationship",
          relationTo: "doctors",
          label: "Врач (необязательно)",
        },
        {
          name: "branch",
          type: "relationship",
          relationTo: "branches",
          label: "Филиал (необязательно)",
        },
        {
          name: "source",
          type: "select",
          options: [
            { value: "site", label: "Отправлен с сайта" },
            { value: "imported", label: "Импортирован" },
          ],
          defaultValue: "site",
          label: "Источник",
        },
      ],
    },
    {
      name: "text",
      type: "textarea",
      required: true,
      label: "Текст отзыва (один текст для RU и KZ)",
    },
  ],
};
