import type { CollectionConfig } from "payload";

/** Филиалы клиники */
export const Branches: CollectionConfig = {
  slug: "branches",
  defaultSort: "sortOrder",
  admin: {
    useAsTitle: "name",
    group: "Контент",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      required: true,
      label: "URL-ID (например serkebaeva)",
    },
    {
      name: "name",
      type: "text",
      localized: true,
      required: true,
      label: "Название",
    },
    {
      name: "district",
      type: "text",
      localized: true,
      label: "Район",
    },
    {
      name: "address",
      type: "text",
      localized: true,
      label: "Адрес",
    },
    {
      type: "row",
      fields: [
        {
          name: "phone",
          type: "text",
          label: "Телефон",
        },
        {
          name: "mapUrl",
          type: "text",
          label: "Ссылка 2ГИС",
        },
      ],
    },
    {
      name: "highlights",
      type: "text",
      hasMany: true,
      localized: true,
      label: "Преимущества (чипы)",
    },
    {
      name: "hours",
      type: "array",
      localized: true,
      label: "Часы работы (строки на сервере)",
      labels: { singular: "Строка", plural: "Строки" },
      fields: [
        {
          name: "line",
          type: "text",
          label: "Текст",
        },
      ],
    },
    {
      name: "desc",
      type: "textarea",
      localized: true,
      label: "Описание",
    },
    {
      name: "landmark",
      type: "text",
      localized: true,
      label: "Ориентир",
    },
    {
      name: "photo",
      type: "relationship",
      relationTo: "media",
      label: "Фото",
    },
    {
      type: "row",
      fields: [
        {
          name: "published",
          type: "checkbox",
          defaultValue: true,
          label: "Показывать на сайте",
        },
        {
          name: "sortOrder",
          type: "number",
          label: "Порядок сортировки",
        },
      ],
    },
  ],
};
