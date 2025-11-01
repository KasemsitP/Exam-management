import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { selectAuthStatus, selectCurrentUser } from "@/store/slices/auth.slice";
import { can, canAny, Permission } from "@/lib/rbac";

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
  permission?: Permission;
  anyOf?: Permission[];
}

export function RequireAuth({
  children,
  redirectTo = "/",
  permission,
  anyOf,
}: RequireAuthProps) {
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();

  if (status !== "authenticated" || !user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (permission && !can(user.roles, permission)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">Permission required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have access to this section of the system. Please contact an administrator if
            you believe this is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (anyOf && !canAny(user.roles, anyOf)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
