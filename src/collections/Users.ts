import type { CollectionConfig } from "payload";

import { adminsOnly, rolesFieldAccess, selfOrAdmin } from "./access";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    defaultColumns: ["email", "name", "role", "updatedAt"],
    useAsTitle: "email",
  },
  auth: true,
  access: {
    create: adminsOnly,
    delete: adminsOnly,
    read: selfOrAdmin,
    update: selfOrAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      access: {
        create: rolesFieldAccess,
        update: rolesFieldAccess,
      },
      defaultValue: "editor",
      options: [
        "registered-traveler",
        "business-owner",
        "editor",
        "seo-manager",
        "moderator",
        "admin",
        "super-admin",
      ],
      required: true,
    },
  ],
};
