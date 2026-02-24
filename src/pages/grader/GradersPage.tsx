
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import Swal from "sweetalert2";
import axios from "axios";

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
import { selectAssignmentsForGrader } from "@/store/slices/graders.slice";

import { fetchSubjectsQuestionThunk } from "@/store/slices/subjects.slice";
import GradersHeader from "./components/GradersHeader";
import GradersToolbar from "./components/GradersToolbar";
import GradersTable from "./components/GradersTable";
import GradersCreateModal from "./components/GradersCreateModal";
import GradersEditModal from "./components/GradersEditModal";
import GradersSubjectLists from "./components/GraderSubjectList"
import { selectIsSystemLocked, selectSessionsForCampaign } from "@/store/slices/examData.slice";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { createGraderAssignmentsThunk } from "@/store/slices/graders.slice";
import { showSuccess } from "@/components/ui/successAlert"
import { showError } from "@/components/ui/ErrorAlert";
import { confirmAction } from "@/components/ui/comfirmaction";
import { OverlayLoader } from "@/components/ui/Loading";

import type {
  Account,
  Role,
  ActiveFilter,
  RoleFilter,
  CreateAccountFormValues,
  UpdateAccountFormValues,
  SimpleAssignment
} from "./types";

export default function AccountsPage() {
  const dispatch = useAppDispatch();
  const locked = useAppSelector(selectIsSystemLocked);

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
  const [subjectListAccount, setSubjectListAccount] = useState<Account | null>(null);
  const [subjectAssignments, setSubjectAssignments] = useState<SimpleAssignment[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const camp = useAppSelector(selectActiveCampaign);
  const sessInCamp = useAppSelector(
    selectSessionsForCampaign(camp ? camp.id : null)
  );

  const campaignId = camp ? Number(camp.id) : 0;
  const accountId = subjectListAccount ? Number(subjectListAccount.id) : 0;

  // const graderAssignments = useAppSelector(
  //   subjectListAccount
  //     ? selectAssignmentsForGrader(campaignId, accountId)
  //     : () => [] // ถ้ายังไม่เลือก account ให้คืน array ว่าง
  // );
  // console.log(graderAssignments, campaignId, accountId)

  const openSubjectList = async (acc: Account) => {
    if (!camp) return;
    const numericCampId = Number(camp.id);

    try {
      const res = await axios.get(
        `/api/graders/assignment/${numericCampId}/${acc.id}`
      );

      console.log(res.data)

      // const data = res.data.sort(
      //   (a, b) => a.question_no - b.question_no
      // );
      // console.log(data)

      const data = res.data.map((rows) => ({
        id: rows.id,
        question_no: rows.question_no,
        label: rows.label,
        session_code: rows.session_code,
        title: rows.title,
        subject_name: rows.name
      }));

      setSubjectAssignments(data);


      setSubjectListAccount(acc);
    } catch (error: any) {
      console.error("cannot fetch subjectlists", error);
      await Swal.fire({
        icon: "error",
        title: "โหลดรายวิชาไม่สำเร็จ",
        text: error?.message ?? "ไม่สามารถดึงรายวิชาที่ได้รับมอบหมายได้",
      });
    }
  };


  useEffect(() => {
    const loadInitialData = async () => {
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

    loadInitialData();
  }, [dispatch]);

  useEffect(() => {
    const campaignId = camp ? Number(camp.id) : null;
    if (!campaignId) {
      return;
    }

    const loadGraderData = async () => {
      try {
        await dispatch(fetchAccountsGradersThunk(campaignId)).unwrap();
      } catch (error) {
        console.error('Failed to load grader accounts:', error);
      }
    };

    loadGraderData();
  }, [dispatch, camp]);




  const handleSessionChange = (sessionId: number) => {
    if (!camp) return;

    dispatch(
      fetchSubjectsQuestionThunk({
        session_id: sessionId,
        camapign_id: Number(camp.id),
      })
    );
  };


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
  const a = data.assignments;

  const assignments = [];

  if (a.sessionId > 0 && a.subjectId > 0 && a.questionNo1 > 0) {
    assignments.push({
      campaignId: Number(camp?.id),
      sessionId: a.sessionId,
      subjectId: a.subjectId,
      questionNo: a.questionNo1,
    });
  }

  if (a.sessionId > 0 && a.subjectId > 0 && a.questionNo2 > 0) {
    assignments.push({
      campaignId: Number(camp?.id),
      sessionId: a.sessionId,
      subjectId: a.subjectId,
      questionNo: a.questionNo2,
    });
  }

  // ✅ ถ้าไม่มี assignment หยุดทันที
  if (assignments.length === 0) {
    await Swal.fire({
      icon: "warning",
      title: "กรุณากำหนดงานตรวจ",
      text: "ต้องเลือก session, subject และอย่างน้อย 1 ข้อ",
    });
    return;
  }

  try {
    // 👉 ค่อยสร้าง account หลังจากผ่านเงื่อนไขแล้ว
    const created = await dispatch(
      createAccountThunk({
        username: data.username,
        password: data.password,
        full_name: data.full_name,
        email: data.email,
        role: data.role_id,
        campaignId: Number(camp.id),
      })
    ).unwrap();

    // ใส่ accountId หลังสร้างเสร็จ
    const finalAssignments = assignments.map((item) => ({
      ...item,
      accountId: created.id,
    }));

    await dispatch(
      createGraderAssignmentsThunk({ assignments: finalAssignments })
    ).unwrap();

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
    console.error("Failed to create account:", err);

    const errorMessage =
      typeof err === "string"
        ? err
        : err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "เกิดข้อผิดพลาดในการสร้างผู้ตรวจ";

    await Swal.fire({
      icon: "error",
      title: "ไม่สามารถสร้างผู้ตรวจได้",
      text: errorMessage,
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
      text: `ต้องการถอดสิทธิ์ผู้ใช้ ${acc.full_name} ใช่หรือไม่`,
      confirmText: "ถอดสิทธิ์",
      confirmColor: "#DC2626",
    });
    if (!ok) return;

    try {
      await dispatch(RevokeAccountThunk(acc.id)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "ถอดสิทธิ์สำเร็จ",
        text: acc.full_name,
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
      text: `ต้องการคืนสิทธิ์ผู้ใช้ ${acc.full_name} ใช่หรือไม่`,
      confirmText: "คืนสิทธิ์",
    });
    if (!ok) return;

    try {
      await dispatch(UnrevokeAccountThunk(acc.id)).unwrap();

      await Swal.fire({
        icon: "success",
        title: "คืนสิทธิ์สำเร็จ",
        text: acc.full_name,
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

  // Show loading overlay while initial data is loading
  if (isInitialLoading) {
    return <OverlayLoader open={true} label="" />;
  }

  return (

    <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
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
        onRevoke={handleRevoke}
        onUnrevoke={handleUnrevoke}
        onViewSubjects={openSubjectList}     // ✅ เพิ่มบรรทัดนี้
      />
      <GradersSubjectLists
        open={!!subjectListAccount}
        account={subjectListAccount}
        assignments={subjectAssignments}
        onClose={() => setSubjectListAccount(null)}
      />

      <GradersCreateModal
        open={isCreateOpen}
        roles={roles}
        loading={accountStatus === "loading"}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        sessions={sessInCamp}
        onSessionChange={handleSessionChange}   // 👈 เพิ่ม
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
