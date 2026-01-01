
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";

import {
  selectAccountsSlice,
  selectGraderAccounts,
  selectGraderRole,
  fetchAccountsThunk,
  fetchRolesThunk,
  createAccountThunk,
  updateAccountThunk,
  deleteAccountThunk,
  fetchAccountsGradersThunk
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
        })
      ).unwrap();

      const accountId = created.id;
      const campaignId = Number(camp?.id);
      console.log("lnw", accountId)


      const assignments = (data.assignments ?? [])
        .filter(a => a.sessionId > 0 && a.subjectId > 0 && a.questionNo > 0)
        .map(a => ({
          campaignId,
          accountId: accountId,
          sessionId: a.sessionId,
          subjectId: a.subjectId,
          questionNo: a.questionNo,
        }));
      console.log(assignments)
      if (assignments.length > 0) {
        await dispatch(
          createGraderAssignmentsThunk({ assignments })
        ).unwrap();
      }


      dispatch(fetchAccountsThunk())
      showSuccess(
        "สร้างผู้ตรวจสำเร็จ",
        ""
      )
      setCreateOpen(false);
    } catch (err: any) {
      showError("ไม่สามารถสร้างผู้ตรวจได้", err)
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
      toast({
        title: "บันทึกการแก้ไขแล้ว",
        description: acc?.username ?? "",
      });
      setEditingAccount(null);
    } catch (err: any) {
      toast({
        title: "อัปเดตล้มเหลว",
        description: err?.message ?? "ไม่สามารถอัปเดตบัญชีได้",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (acc: Account) => {
    if (!window.confirm(`ยืนยันการลบผู้ใช้: ${acc.username}?`)) return;
    try {
      await dispatch(deleteAccountThunk(acc.id)).unwrap();
      toast({
        title: "ลบผู้ใช้แล้ว",
        description: acc.username,
        variant: "destructive",
      });
    } catch (err: any) {
      toast({
        title: "ลบล้มเหลว",
        description: err?.message ?? "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive",
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
