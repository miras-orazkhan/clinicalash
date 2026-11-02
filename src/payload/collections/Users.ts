import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    group: "Система",
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
