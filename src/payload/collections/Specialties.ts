import type { CollectionConfig } from "payload";

/** Направления (specialty) + процедурные кабинеты (procedure) с прайс-листами */
export const Specialties: CollectionConfig = {
  slug: "specialties",
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
      label: "URL-ID (например kardiologiya)",
    },
    {
      type: "row",
      fields: [
        {
          name: "kind",
          type: "select",
          options: [
            { value: "specialty", label: "Врачебное направление" },
            { value: "procedure", label: "Процедура / диагностика" },
          ],
          defaultValue: "specialty",
          label: "Тип",
        },
        {
          name: "icon",
          type: "text",
          label: "Lucide-иконка (Heart, Brain, Scan...)",
        },
      ],
    },
    {
      name: "name",
      type: "text",
      localized: true,
      required: true,
      label: "Название",
    },
    {
      name: "short",
      type: "text",
      localized: true,
      label: "Короткая строка (на карточке каталога)",
    },
    {
      name: "desc",
      type: "textarea",
      localized: true,
      label: "Описание (на странице направления)",
    },
    {
      name: "services",
      type: "array",
      localized: true,
      label: "Прайс-лист (услуги с ценами)",
      labels: { singular: "Услуга", plural: "Услуги" },
      admin: {
        isSortable: true,
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Услуга",
        },
        {
          name: "price",
          type: "number",
          label: "Цена, ₸ (0 → «по записи»)",
        },
        {
          name: "note",
          type: "text",
          label: "Примечание",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "featured",
          type: "checkbox",
          defaultValue: false,
          label: "На главной (9 направлений)",
        },
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
