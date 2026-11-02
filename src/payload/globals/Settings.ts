import type { GlobalConfig } from "payload";

/** Настройки контактов (старые ключи Setting: phone_main, whatsapp...) */
export const Settings: GlobalConfig = {
  slug: "settings",
  admin: {
    group: "Тексты",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Контакты",
          fields: [
            {
              name: "phone_main",
              type: "text",
              label: "Основной телефон",
            },
            {
              name: "phone_mobile",
              type: "text",
              label: "Мобильный телефон",
            },
            {
              name: "whatsapp",
              type: "text",
              label: "WhatsApp (77009990103)",
            },
            {
              name: "email",
              type: "text",
              label: "Email",
            },
          ],
        },
        {
          label: "Организация",
          fields: [
            {
              name: "clinic_legal",
              type: "text",
              label: "Юр. лицо",
            },
          ],
        },
      ],
    },
  ],
};
