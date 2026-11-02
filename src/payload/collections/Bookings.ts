import type { CollectionConfig } from "payload";

/** Заявки записи с сайта (Phase B: сохраняются сюда) */
export const Bookings: CollectionConfig = {
  slug: "bookings",
  defaultSort: "-createdAt",
  admin: {
    useAsTitle: "name",
    group: "Система",
  },
  access: {
    // Заявку создают анонимные посетители сайта, читают/меняют — только админка
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "ticket",
      type: "text",
      admin: {
        readOnly: true,
        description: "Выдаётся сайтом при отправке формы (АЛШ-…)",
      },
      label: "Тикет",
    },
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Имя",
        },
        {
          name: "phone",
          type: "text",
          required: true,
          label: "Телефон",
        },
        {
          name: "status",
          type: "select",
          options: [
            { value: "new", label: "Новая" },
            { value: "confirmed", label: "Подтверждена" },
            { value: "done", label: "Завершена" },
            { value: "cancelled", label: "Отменена" },
          ],
          defaultValue: "new",
          label: "Статус",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "specSlug",
          type: "text",
          label: "Направление (slug)",
        },
        {
          name: "doctor",
          type: "relationship",
          relationTo: "doctors",
          label: "Врач",
        },
        {
          name: "branch",
          type: "relationship",
          relationTo: "branches",
          label: "Филиал",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "date",
          type: "text",
          label: "Дата",
        },
        {
          name: "time",
          type: "text",
          label: "Время",
        },
      ],
    },
  ],
};
