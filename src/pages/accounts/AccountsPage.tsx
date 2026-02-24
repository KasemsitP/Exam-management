// src/pages/accounts/AccountsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";

import {
  selectAccountsSlice,
  selectAllAccounts,
  selectAllRoles,
  fetchAccountsThunk,
  fetchRolesThunk,
  createAccountThunk,
  updateAccountThunk,
  deleteAccountThunk,
  RevokeAccountThunk,
  UnrevokeAccountThunk,
} from "@/store/slices/account.slice";

import AccountsHeader from "./components/AccountsHeader";
import AccountsToolbar from "./components/AccountsToolbar";
import AccountsTable from "./components/AccountsTable";
import AccountCreateModal from "./components/AccountCreateModal";
import AccountEditModal from "./components/AccountEditModal";

import type {
  Account,
  Role,
  ActiveFilter,
  RoleFilter,
  CreateAccountFormValues,
  UpdateAccountFormValues,
} from "./types";
import Swal from "sweetalert2";
import { confirmAction } from "@/components/ui/comfirmaction";
import { OverlayLoader } from "@/components/ui/Loading";

export default function AccountsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { status: accountStatus } = useAppSelector(selectAccountsSlice);
  const accounts = useAppSelector(selectAllAccounts);
  const roles = useAppSelector(selectAllRoles) as Role[];
  
  // Track initial loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  // Modals
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // initial fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchAccountsThunk()).unwrap(),
          dispatch(fetchRolesThunk()).unwrap()
        ]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadData();
  }, [dispatch]);

  // derived: filtered accounts
  const filteredAccounts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    let list = accounts;

    if (roleFilter !== "all") {
      list = list.filter((a) => a.role_id === roleFilter);
    }

    if (activeFilter !== "all") {
      list = list.filter((a) => (activeFilter === "active" ? a.active : !a.active));
    }

    if (!term) return list;

    return list.filter(
      (acc) =>
        acc.username.toLowerCase().includes(term) ||
        acc.full_name.toLowerCase().includes(term) ||
        acc.email?.toLowerCase().includes(term)
    );
  }, [accounts, searchText, roleFilter, activeFilter]);

  // stats
  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [accounts]);

  // handlers
  const handleCreate = async (data: CreateAccountFormValues) => {
    try {
      await dispatch(
        createAccountThunk({
          username: data.username,
          password: data.password,
          full_name: data.full_name,
          email: data.email,
          role: data.role_id, // backend expects 'role'
        })
      ).unwrap();
      Swal.fire({
        icon: "success",
        title: "สร้างผู้ใช้สำเร็จ",
        text: `สร้างผู้ใช้ ${data.username} สำเร็จ`,
        timer: 1200,
        showConfirmButton: false,
      });
      setCreateOpen(false);
    } catch (err: any) {
      console.log(err)
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถสร้างผู้ใช้ในระบบได้",
        text: err?? "ไม่สามารถสร้างบัญชีได้",
      });
    }
  };

  const handleUpdate = async (id: number, data: UpdateAccountFormValues) => {
    try {
      await dispatch(
        updateAccountThunk({
          id,
          full_name: data.full_name,
          email: data.email,
          role_id: data.role_id,
          active: data.active,
          newPassword: data.newPassword || undefined,
        })
      ).unwrap();
      const acc = accounts.find((a) => a.id === id);
      Swal.fire({
        icon: "success",
        title: "อัปเดตผู้ใช้สำเร็จ",
        text: `อัปเดตผู้ใช้ ${acc?.username ?? ""} สำเร็จ`,
      });
      setEditingAccount(null);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถอัปเดตผู้ใช้ได้",
        text: err ?? "",
      });
    }
  };

  const handleDelete = async (acc: Account) => {
    const ok = await Swal.fire({
      title: "ลบผู้ใช้?",
      text: `ต้องการลบผู้ใช้ ${acc.username} ใช่หรือไม่`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      confirmButtonColor: "#DC2626",
    }).then((res) => res.isConfirmed);
    if (!ok) return;

    try {
      await dispatch(deleteAccountThunk(acc.id)).unwrap();

      Swal.fire({
        icon: "success",
        title: "ลบผู้ใช้สำเร็จ",
        text: `ลบผู้ใช้ ${acc.username}`,
        timer: 1200,
        showConfirmButton: false,
      });
      setEditingAccount(null);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถลบผู้ใช้ได้",
        text: err ?? "",
      });
    }
  };

  const handleRevoke = async (acc: Account) => {
    const ok = await confirmAction({
      title: "ระงับบัญชี?",
      text: `ต้องการถอนสิทธิ์ผู้ใช้ ${acc.username} ใช่หรือไม่`,
      confirmText: "Revoke",
      confirmColor: "#DC2626",
    });
    if (!ok) return;

    try {
      await dispatch(RevokeAccountThunk(acc.id)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "ระงับบัญชีสำเร็จ",
        text: `ถอนสิทธิ์ผู้ใช้ ${acc.username} สำเร็จ`,
        timer: 1200,
        showConfirmButton: false,
      });
      setEditingAccount(null);
      await dispatch(fetchAccountsThunk()).unwrap();
      await dispatch(fetchRolesThunk()).unwrap();

    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "ดำเนินการล้มเหลว",
        text: err?.message ?? "",
      });
    }
  };

  const handleUnrevoke = async (acc: Account) => {
    const ok = await confirmAction({
      title: "คืนสิทธิ์ผู้ใช้?",
      text: `ต้องการคืนสิทธิ์ผู้ใช้ ${acc.username} ใช่หรือไม่`,
      confirmText: "คืนสิทธิ์",
    });
    if (!ok) return;

    try {
      await dispatch(UnrevokeAccountThunk(acc.id)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "คืนสิทธิ์สำเร็จ",
        text: `คืนสิทธิ์ผู้ใช้ ${acc.username} สำเร็จ`,
        timer: 1200,
        showConfirmButton: false,
      });
      setEditingAccount(null);
      await dispatch(fetchAccountsThunk()).unwrap();
      await dispatch(fetchRolesThunk()).unwrap();

    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "ดำเนินการล้มเหลว",
        text: err?.message ?? "",
      });
    }
  };

  // Show loading overlay while initial data is loading
  if (isInitialLoading) {
    return <OverlayLoader open={true} label="กำลังโหลดข้อมูล..." />;
  }

  return (
   <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
      <AccountsHeader stats={stats} />

      <AccountsToolbar
        searchText={searchText}
        onSearchChange={setSearchText}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        roles={roles}
        onOpenCreate={() => setCreateOpen(true)}
      />

      <AccountsTable
        accounts={filteredAccounts}
        roles={roles}
        status={accountStatus}
        onEdit={setEditingAccount}
        onDelete={handleDelete}
        onRevoke={handleRevoke}
        onUnrevoke={handleUnrevoke}
      />

      <AccountCreateModal
        open={isCreateOpen}
        roles={roles}
        loading={accountStatus === "loading"}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <AccountEditModal
        open={!!editingAccount}
        account={editingAccount}
        roles={roles}
        loading={accountStatus === "loading"}
        onClose={() => setEditingAccount(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
