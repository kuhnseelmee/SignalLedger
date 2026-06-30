export type Role =
  | "owner"
  | "admin"
  | "compliance"
  | "coordinator"
  | "support_worker"
  | "property_manager"
  | "viewer"
  | "participant"
  | "guardian"
  | "system";

export const rolePermissions: Record<Role, string[]> = {
  owner: ["*"],
  admin: ["*"],
  compliance: [
    "incident",
    "reportable_incident",
    "evidence_pack",
    "compliance_review",
    "audit_log",
  ],
  coordinator: ["participant_timeline", "shift", "incident", "welfare_task"],
  support_worker: ["own_shift", "participant_context", "signal_create"],
  property_manager: ["property_hazard", "inspection", "maintenance"],
  viewer: ["read_only"],
  participant: ["participant_visible"],
  guardian: ["guardian_visible"],
  system: ["*"],
};

export function permissionsForRole(role: Role): string[] {
  return rolePermissions[role] ?? [];
}

export function hasPermission(role: Role, permission: string): boolean {
  const permissions = permissionsForRole(role);
  return permissions.includes("*") || permissions.includes(permission);
}

export function visibleSignalVisibilities(role: Role): string[] {
  switch (role) {
    case "owner":
    case "admin":
    case "compliance":
    case "system":
      return ["provider", "restricted", "participant", "guardian"];
    case "participant":
      return ["participant"];
    case "guardian":
      return ["guardian"];
    case "viewer":
      return ["provider"];
    case "coordinator":
    case "support_worker":
    case "property_manager":
      return ["provider", "participant"];
    default:
      return ["provider", "participant"];
  }
}
