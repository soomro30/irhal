import type { CollectionConfig } from "payload";

import { editorsOnly, workflowPublishedOrEditor } from "./access";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";
import { geoFields, sourceFields, workflowStatusField } from "./shared";

export const Districts: CollectionConfig = {
  slug: "districts",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: workflowPublishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["name", "city", "zone", "workflowStatus"],
    useAsTitle: "name",
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    { name: "city", type: "relationship", relationTo: "cities", required: true },
    {
      name: "zone",
      type: "select",
      options: ["central", "north", "south", "east", "west", "airport", "coastal", "suburban"],
      required: true,
    },
    { name: "summary", type: "textarea", required: true },
    ...geoFields,
    workflowStatusField,
    sourceFields,
  ],
};
