// src/pages/accounts/types.ts
import type { Account } from "@/store/slices/account.slice";

export type Role = {
  id: number;
  name: string;
  code: string;
};

export type RoleFilter = number | "all" | "GRADER";
export type ActiveFilter = "all" | "active" | "inactive";

export interface AccountStats {
  total: number;
  active: number;
  inactive: number;
}

export interface CreateAccountFormValues {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  role_id: number;
  active: boolean;

  assignments?: {
    sessionId: number;  
    subjectId: number;  
    questionNo: number;  
  }[];
}
export interface UpdateAccountFormValues {
  full_name: string;
  email: string;
  role_id: number;
  active: boolean;
  newPassword?: string;
}

export type { Account };
