import { ReactNode } from "react";
import { useAppSelector } from "@/store/hook";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { can, canAny, Permission } from "@/lib/rbac";

interface ShowIfCanProps {
  permission?: Permission;
  anyOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function ShowIfCan({ permission, anyOf, fallback = null, children }: ShowIfCanProps) {
  const user = useAppSelector(selectCurrentUser);
  const roles = user?.roles;

  const isAllowed = (() => {
    if (permission) return can(roles, permission);
    if (anyOf && anyOf.length > 0) return canAny(roles, anyOf);
    return !!roles?.length;
  })();

  if (!isAllowed) return <>{fallback}</>;
  return <>{children}</>;
}
