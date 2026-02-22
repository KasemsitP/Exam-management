import { useMemo } from "react";
import { Role, selectCurrentUser } from "@/store/slices/auth.slice";
import { buildThemeByRole } from "@/components/layout/theme";
import { useAppSelector } from "@/store/hook";

export const useRoleTheme = (roles: Role[] = []) => {
  const roleKey = useMemo<Role | "DEFAULT">(() => {
    const has = (r: Role) => roles.includes(r);

    if (has("admin")) return "admin";
    if (has("manager")) return "manager";
    if (has("staff")) return "staff";
    if (has("grader")) return "grader";

    return "DEFAULT";
  }, [roles]);

  const theme = useMemo(() => buildThemeByRole(roleKey), [roleKey]);

  return { theme, roleKey };
};