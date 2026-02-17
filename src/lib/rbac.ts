import type { Role } from "@/store/slices/auth.slice";

export type Permission =
  | "manage_bags"
  | "manage_rooms"
  | "manage_sessions"
  | "manage_subjects"
  | "manage_users"
  | "manage_keys"
  | "import_subjects"
  | "allocate_seats"
  | "grade_exams"
  | "view_sessions"
  | "view_reports"
  | "view_qr"
  | "manage_graders"
  | "manage_accounts"
  | "manage_bagshandover"
  | "importcsv"
  | "signshheets"
  | "manage_grading"
  | "dashboard";

const ALL_PERMISSIONS: Permission[] = [
    "manage_bags",
    "manage_rooms",
    "manage_sessions",
    "manage_subjects",
    "manage_users",
    "manage_keys",
    "import_subjects",
    "allocate_seats",
    "view_sessions",
    "view_reports",
    "view_qr",
    "manage_graders",
    "manage_accounts",
    "manage_bagshandover",
    "importcsv",
    "signshheets",
    "manage_grading",
    "dashboard"
];

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "manage_bags",
    "manage_rooms",
    "manage_sessions",
    "manage_subjects",
    "manage_users",
    "manage_keys",
    "import_subjects",
    "allocate_seats",
    "view_sessions",
    "view_reports",
    "view_qr",
    "manage_graders",
    "manage_accounts",
    "manage_bagshandover",
    "importcsv",
    "signshheets",
    "manage_grading",
    "dashboard"
  ],
  manager: [
    "manage_keys",
  ],
  staff: [
    "manage_bags",
    "allocate_seats",
    "importcsv",
    "view_sessions",
    "view_qr",
  ],
  grader: ["grade_exams",],
};

const ADMIN_ROLE: Role = "admin";

export function can(roles: Role[] | undefined | null, permission: Permission): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  if (permission === "grade_exams") {
    return roles.includes("grader"); 
  }

  if (roles.includes(ADMIN_ROLE)) {
    return true; // super admin
  }

  return roles.some((role) => rolePermissions[role]?.includes(permission));
}

export function canAny(roles: Role[] | undefined | null, permissions: Permission[]): boolean {
  if (!permissions.length) {
    return true;
  }

  return permissions.some((permission) => can(roles, permission));
}

export function permissionsForRoles(roles: Role[] | undefined | null): Permission[] {
  if (!roles?.length) {
    return [];
  }

  if (roles.includes(ADMIN_ROLE)) {
    return ALL_PERMISSIONS;
  }

  const unique = new Set<Permission>();
  for (const role of roles) {
    for (const permission of rolePermissions[role] ?? []) {
      unique.add(permission);
    }
  }
  return [...unique];
}
