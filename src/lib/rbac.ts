export type AppRole =
  | "Admin"
  | "Owner"
  | "Manager"
  | "Service Advisor"
  | "Customer Service"
  | "Technician"
  | "Marketing CRM";

export type PermissionScope =
  | "dashboard"
  | "branches"
  | "customers"
  | "vehicles"
  | "transactions"
  | "complaints"
  | "follow-ups"
  | "reminders"
  | "bookings"
  | "integrations"
  | "admin"
  | "reports"
  | "settings"
  | "workflow";
export type PermissionAction = "read" | "write";

export const routeRoleMatrix: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: "/dashboard", roles: ["Admin", "Owner", "Manager", "Service Advisor", "Customer Service", "Technician", "Marketing CRM"] },
  { prefix: "/branches", roles: ["Admin", "Owner", "Manager", "Service Advisor", "Customer Service"] },
  { prefix: "/customers", roles: ["Admin", "Owner", "Manager", "Service Advisor", "Marketing CRM"] },
  { prefix: "/vehicles", roles: ["Admin", "Owner", "Manager", "Service Advisor"] },
  { prefix: "/transactions", roles: ["Admin", "Owner", "Manager", "Service Advisor", "Technician"] },
  { prefix: "/complaints", roles: ["Admin", "Owner", "Manager", "Service Advisor"] },
  { prefix: "/follow-ups", roles: ["Admin", "Owner", "Manager", "Customer Service"] },
  { prefix: "/reminders", roles: ["Admin", "Owner", "Manager", "Customer Service"] },
  { prefix: "/bookings", roles: ["Admin", "Owner", "Manager", "Customer Service"] },
  { prefix: "/workflow", roles: ["Admin", "Owner", "Manager", "Service Advisor", "Customer Service", "Technician", "Marketing CRM"] },
  { prefix: "/integrations", roles: ["Admin", "Owner", "Manager", "Service Advisor", "Customer Service"] },
  { prefix: "/admin", roles: ["Admin"] },
  { prefix: "/reports", roles: ["Admin", "Owner", "Manager", "Marketing CRM"] },
  { prefix: "/settings", roles: ["Admin"] },
];

export const permissionMatrix: Record<AppRole, Record<PermissionScope, PermissionAction>> = {
  Admin: { dashboard: "write", branches: "write", customers: "write", vehicles: "write", transactions: "write", complaints: "write", "follow-ups": "write", reminders: "write", bookings: "write", integrations: "write", admin: "write", reports: "write", settings: "write", workflow: "write" },
  Owner: { dashboard: "read", branches: "read", customers: "read", vehicles: "read", transactions: "read", complaints: "read", "follow-ups": "read", reminders: "read", bookings: "read", integrations: "read", admin: "read", reports: "read", settings: "read", workflow: "read" },
  Manager: { dashboard: "read", branches: "read", customers: "write", vehicles: "write", transactions: "write", complaints: "write", "follow-ups": "read", reminders: "write", bookings: "write", integrations: "write", admin: "read", reports: "read", settings: "read", workflow: "read" },
  "Service Advisor": { dashboard: "read", branches: "read", customers: "write", vehicles: "write", transactions: "write", complaints: "write", "follow-ups": "read", reminders: "read", bookings: "read", integrations: "write", admin: "read", reports: "read", settings: "read", workflow: "read" },
  "Customer Service": { dashboard: "read", branches: "read", customers: "read", vehicles: "read", transactions: "read", complaints: "read", "follow-ups": "write", reminders: "write", bookings: "write", integrations: "write", admin: "read", reports: "read", settings: "read", workflow: "read" },
  Technician: { dashboard: "read", branches: "read", customers: "read", vehicles: "read", transactions: "read", complaints: "read", "follow-ups": "read", reminders: "read", bookings: "read", integrations: "read", admin: "read", reports: "read", settings: "read", workflow: "read" },
  "Marketing CRM": { dashboard: "read", branches: "read", customers: "read", vehicles: "read", transactions: "read", complaints: "read", "follow-ups": "read", reminders: "read", bookings: "read", integrations: "read", admin: "read", reports: "write", settings: "read", workflow: "read" },
};

export function canAccessRoute(pathname: string, role: AppRole) {
  const rule = routeRoleMatrix.find((item) => pathname.startsWith(item.prefix));
  return !rule || rule.roles.includes(role);
}

export function hasPermission(role: AppRole, scope: PermissionScope, action: PermissionAction) {
  const access = permissionMatrix[role][scope];
  return access === "write" || (access === "read" && action === "read");
}

export function filterNavigationByRole<T extends { href: string }>(items: T[], role: AppRole) {
  return items.filter((item) => canAccessRoute(item.href, role));
}
