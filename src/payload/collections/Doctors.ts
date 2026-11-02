import type { CollectionConfig } from "payload";

/** Врачи клиники. Формат зеркалит старый Doctor для бесшовного переключения контент-слоя */
export const Doctors: CollectionConfig = {
  slug: "doctors",
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
      label: "URL-ID (например amirova-khaliya)",
    },
    {
      name: "name",
      type: "text",
      localized: true,
      required: true,
      label: "Имя Фамилия",
    },
    {
      name: "patronymic",
      type: "text",
      localized: true,
      label: "Отчество",
    },
    {
      name: "title",
      type: "textarea",
      localized: true,
      label: "Специализация (на карточке)",
    },
    {
      type: "row",
      fields: [
        {
          name: "experience",
          type: "number",
          label: "Стаж, лет (0 → «—»)",
        },
        {
          name: "price",
          type: "number",
          label: "Цена приёма, ₸ (0 → «по записи»)",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "rating",
          type: "number",
          min: 0,
          max: 5,
          label: "Рейтинг",
        },
        {
          name: "reviewsCount",
          type: "number",
          label: "Кол-во отзывов",
        },
        {
          name: "category",
          type: "select",
          options: [
            { value: "highest", label: "Высшая категория" },
            { value: "first", label: "Первая категория" },
            { value: "second", label: "Вторая категория" },
          ],
          defaultValue: "highest",
          label: "Категория",
        },
      ],
    },
    {
      name: "specialties",
      type: "relationship",
      relationTo: "specialties",
      hasMany: true,
      label: "Направления",
      admin: {
        sortOptions: "name",
      },
    },
    {
      name: "branches",
      type: "relationship",
      relationTo: "branches",
      hasMany: true,
      label: "Филиалы",
    },
    {
      name: "bio",
      type: "textarea",
      localized: true,
      label: "О враче (+ «Опыт работы» отдельным абзацем)",
    },
    {
      name: "education",
      type: "textarea",
      localized: true,
      label: "Образование",
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
