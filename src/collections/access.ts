import type { Access, FieldAccess } from "payload";

const editorRoles = new Set(["admin", "super-admin", "editor", "seo-manager"]);

const isEditorRole = (role: unknown) => typeof role === "string" && editorRoles.has(role);

export const publishedOrEditor: Access = ({ req }) => {
  if (isEditorRole(req.user?.role)) {
    return true;
  }

  return {
    _status: {
      equals: "published",
    },
  };
};

export const workflowPublishedOrEditor: Access = ({ req }) => {
  if (isEditorRole(req.user?.role)) {
    return true;
  }

  return {
    workflowStatus: {
      equals: "published",
    },
  };
};

export const approvedMediaOrEditor: Access = ({ req }) => {
  if (isEditorRole(req.user?.role)) {
    return true;
  }

  return {
    usageStatus: {
      equals: "approved",
    },
  };
};

export const editorsOnly: Access = ({ req }) => {
  const role = req.user?.role;
  return role === "admin" || role === "super-admin" || role === "editor";
};

export const adminsOnly: Access = ({ req }) => {
  const role = req.user?.role;
  return role === "admin" || role === "super-admin";
};

export const selfOrAdmin: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === "admin" || req.user.role === "super-admin") return true;

  return {
    id: {
      equals: req.user.id,
    },
  };
};

export const rolesFieldAccess: FieldAccess = ({ req }) => {
  return req.user?.role === "admin" || req.user?.role === "super-admin";
};
