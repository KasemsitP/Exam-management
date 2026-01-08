
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import Swal from "sweetalert2";

import {
  selectAccountsSlice,
  selectGraderAccounts,
  selectGraderRole,
  fetchAccountsThunk,
  fetchRolesThunk,
  createAccountThunk,
  updateAccountThunk,
  deleteAccountThunk,
  fetchAccountsGradersThunk,
  RevokeAccountThunk,
  UnrevokeAccountThunk
} from "@/store/slices/account.slice";
import GradersHeader from "./components/GradersHeader";
import GradersToolbar from "./components/GradersToolbar";
import GradersTable from "./components/GradersTable";
import GradersCreateModal from "./components/GradersCreateModal";
import GradersEditModal from "./components/GradersEditModal";
import { selectSessionsForCampaign } from "@/store/slices/examData.slice";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { createGraderAssignmentsThunk } from "@/store/slices/graders.slice";
import { showSuccess } from "@/components/ui/successAlert"
import { showError } from "@/components/ui/ErrorAlert";
import { confirmAction } from "@/components/ui/comfirmaction";

import type {
  Account,
  Role,
  ActiveFilter,
  RoleFilter,
  CreateAccountFormValues,
  UpdateAccountFormValues,
} from "./types";

export default function AccountsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { status: accountStatus } = useAppSelector(selectAccountsSlice);

  const accounts = useAppSelector(selectGraderAccounts);

  const roles = useAppSelector(selectGraderRole);


  const [searchText, setSearchText] = useState("");
  const initialRole = roles.find((r) => r.code === "GRADER")?.id ?? "all";
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(
    initialRole
  );
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");


  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const camp = useAppSelector(selectActiveCampaign);
  const sessInCamp = useAppSelector(
    selectSessionsForCampaign(camp ? camp.id : null)
  );

  useEffect(() => {
    console.log("activeCampaign =", camp);
    console.log("campId =", camp?.id);
    console.log("sessions in camp =", sessInCamp);
    console.log(accounts)
  }, [camp, sessInCamp]);


  useEffect(() => {
    dispatch(fetchAccountsThunk());
    dispatch(fetchRolesThunk());
  }, [dispatch]);

  useEffect(() => {
    const campaignId = camp ? Number(camp.id) : null;
    if (!campaignId) {
      return;
    }
    dispatch(fetchAccountsGradersThunk(campaignId));
  }, [dispatch, camp]);




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


  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [accounts]);


  const handleCreate = async (data: CreateAccountFormValues) => {
    try {
      const created = await dispatch(
        createAccountThunk({
          username: data.username,
          password: data.password,
          full_name: data.full_name,
          email: data.email,
          role: data.role_id,
          campaignId: Number(camp.id)
        })
      ).unwrap();

      const assignments = (data.assignments ?? [])
        .filter(a => a.sessionId > 0 && a.subjectId > 0 && a.questionNo > 0)
        .map(a => ({
          campaignId: Number(camp?.id),
          accountId: created.id,
          sessionId: a.sessionId,
          subjectId: a.subjectId,
          questionNo: a.questionNo,
        }));

      if (assignments.length > 0) {
        await dispatch(
          createGraderAssignmentsThunk({ assignments })
        ).unwrap();
      }
    await dispatch(fetchAccountsThunk()).unwrap();
    await dispatch(fetchAccountsGradersThunk(Number(camp.id))).unwrap();
    await dispatch(fetchRolesThunk()).unwrap();

      await Swal.fire({
        icon: "success",
        title: "สร้างผู้ตรวจสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });

      setCreateOpen(false);
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถสร้างผู้ตรวจได้",
        text: err?.message ?? "",
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

      await dispatch(fetchAccountsThunk());

      await Swal.fire({
        icon: "success",
        title: "บันทึกการแก้ไขแล้ว",
        timer: 1200,
        showConfirmButton: false,
      });
      setEditingAccount(null);
    await dispatch(fetchAccountsThunk()).unwrap();
    await dispatch(fetchAccountsGradersThunk(Number(camp.id))).unwrap();
    await dispatch(fetchRolesThunk()).unwrap();

    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "อัปเดตล้มเหลว",
        text: err?.message ?? "ไม่สามารถอัปเดตบัญชีได้",
      });
    }
  };


  const handleRevoke = async (acc: Account) => {
    const ok = await confirmAction({
      title: "ระงับบัญชี?",
      text: `ต้องการ Revoke ผู้ใช้ ${acc.username} ใช่หรือไม่`,
      confirmText: "Revoke",
      confirmColor: "#DC2626",
    });
    if (!ok) return;

    try {
      await dispatch(RevokeAccountThunk(acc.id)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "Revoke สำเร็จ",
        text: acc.username,
        timer: 1200,
        showConfirmButton: false,
      });
      setEditingAccount(null);
    await dispatch(fetchAccountsThunk()).unwrap();
    await dispatch(fetchAccountsGradersThunk(Number(camp.id))).unwrap();
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
      text: `ต้องการ Un-Revoke ผู้ใช้ ${acc.username} ใช่หรือไม่`,
      confirmText: "Un-Revoke",
    });
    if (!ok) return;

    try {
      await dispatch(UnrevokeAccountThunk(acc.id)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "คืนสิทธิ์สำเร็จ",
        text: acc.username,
        timer: 1200,
        showConfirmButton: false,
      });
      setEditingAccount(null);
    await dispatch(fetchAccountsThunk()).unwrap();
    await dispatch(fetchAccountsGradersThunk(Number(camp.id))).unwrap();
    await dispatch(fetchRolesThunk()).unwrap();

    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "ดำเนินการล้มเหลว",
        text: err?.message ?? "",
      });
    }
  };



  const handleDelete = async (acc: Account) => {
    const ok = await confirmAction({
      title: "ลบผู้ใช้?",
      text: `ยืนยันการลบผู้ใช้ ${acc.username}`,
      confirmText: "ลบ",
      confirmColor: "#DC2626",
    });
    if (!ok) return;

    try {
      await dispatch(deleteAccountThunk(acc.id)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "ลบผู้ใช้แล้ว",
        text: acc.username,
        timer: 1200,
        showConfirmButton: false,
      });
    await dispatch(fetchAccountsThunk()).unwrap();
    await dispatch(fetchAccountsGradersThunk(Number(camp.id))).unwrap();
    await dispatch(fetchRolesThunk()).unwrap();
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "ลบล้มเหลว",
        text: err?.message ?? "",
      });
    }
  };


  return (
    <div className="d-flex flex-column gap-4">
      <GradersHeader stats={stats} />

      <GradersToolbar
        searchText={searchText}
        onSearchChange={setSearchText}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        roles={roles}
        onOpenCreate={() => setCreateOpen(true)}
      />

      <GradersTable
        accounts={filteredAccounts}
        roles={roles}
        status={accountStatus}
        onEdit={setEditingAccount}
        onDelete={handleDelete}
        onRevoke={handleRevoke}       // <<-- ส่งเป็นฟังก์ชันที่รับ Account
        onUnrevoke={handleUnrevoke}   // <<-- ส่งเป็นฟังก์ชันที่รับ Account
      />

      <GradersCreateModal
        open={isCreateOpen}
        roles={roles}
        loading={accountStatus === "loading"}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        sessions={sessInCamp}
      />

      <GradersEditModal
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
