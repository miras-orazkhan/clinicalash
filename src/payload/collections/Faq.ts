import type { CollectionConfig } from "payload";

/** FAQ главной и страницы /faq */
export const Faq: CollectionConfig = {
  slug: "faq",
  defaultSort: "sortOrder",
  admin: {
    useAsTitle: "q",
    group: "Контент",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "q",
      type: "textarea",
      localized: true,
      required: true,
      label: "Вопрос",
    },
    {
      name: "a",
      type: "textarea",
      localized: true,
      required: true,
      label: "Ответ",
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
          label: "Порядок",
        },
      ],
    },
  ],
};
