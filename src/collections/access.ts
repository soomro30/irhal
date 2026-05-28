import type { Access, FieldAccess } from "payload";

export const publishedOrEditor: Access = ({ req }) => {
  const role = req.user?.role;

  if (role === "admin" || role === "super-admin" || role === "editor" || role === "seo-manager") {
    return true;
  }

  return {
    _status: {
      equals: "published",
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
