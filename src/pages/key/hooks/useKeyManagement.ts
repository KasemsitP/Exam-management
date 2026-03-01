// hooks/useKeyManagement.ts
import { useEffect, useMemo, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import Swal from "sweetalert2";
import axios from "axios";

import {
  fetchKeysForCampaign,
  saveNewKey,
  deleteKey,
  clearActiveKeys,
  selectAllActiveKeys,
  selectKeyManagementStatus,
  selectKeyManagementError,
  checkEncryptionPrerequisites,
  clearEncryptionResult,
  runBulkEncryptionForSession,
  selectEncryptionStatus,
  selectLastBulkEncryptionStats,
  selectPrerequisites,
  fetchKeysForCampaignByManager
} from "@/store/slices/key.slice";

import {
  selectDashboardStatus,
  selectEncryptedStatus,
  selectImportStatus,
  fetchDashboardStatus,
  selectKeyStatus,
  selectSubjects,
  selectSubjectQuestionsGrouped,
  selectSession
} from "@/store/slices/dashboard.slice"

import { selectCurrentUser } from "@/store/slices/auth.slice";

import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";

const parseCampaignId = (id: string): number => Number(id.replace("camp-", ""));
const parseSessionId = (id: string): number => Number(id.replace("sess-", ""));

export const useKeyManagement = () => {
  const dispatch = useAppDispatch();

  // --- Redux state ---
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const users = useAppSelector(selectCurrentUser)
  const activeKeys = useAppSelector(selectAllActiveKeys);
  const keyStatus = useAppSelector(selectKeyManagementStatus);
  const keyManagementError = useAppSelector(selectKeyManagementError);
  const sessions = useAppSelector(selectActiveCampaignSessions) as any[];
  const prerequisites = useAppSelector(selectPrerequisites);
  const encryptionStatus = useAppSelector(selectEncryptionStatus);
  const lastBulkEncryptionStats = useAppSelector(selectLastBulkEncryptionStats);

  const dashboardStatus = useAppSelector(selectDashboardStatus)
  const EncryptedStatus = useAppSelector(selectEncryptedStatus)
  const ImportStatus = useAppSelector(selectImportStatus)

  const keyStatusDashboard = useAppSelector(selectKeyStatus)
  const subjects = useAppSelector(selectSubjects)
  const subjectQuestionsGrouped = useAppSelector(selectSubjectQuestionsGrouped)
  const sessionInfo = useAppSelector(selectSession)

  const NumberOfSession = sessions.length;

  // --- Local state ---
  const [selectedSessionId, setSelectedSessionId] = useState<string>("20");
  const [IshasKey, setIshasKey] = useState(false)
  
  // เปลี่ยนจาก useState เป็น useRef
  const [initialKeyValue, setInitialKeyValue] = useState<string>("");
  const myKeyRef = useRef<HTMLInputElement>(null);
  const [myKeyId, setMyKeyId] = useState<number | null>(null);
  const [managerName, setManagerName] = useState<string>("");
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [forgetKey, setForgetKey] = useState("")
  const [modalforgetKey, setModalForgetKey] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);

  const manager_order = users ? users.manager_order : null;

  const accountFullName = users ? users.name : "ไม่พบผู้ใช้";
  const isManager = users ? users.roles.includes("manager") : false;

  const numericCampaignId = activeCampaign
    ? parseCampaignId(activeCampaign.id)
    : null;

  const userAccountId = users.id ?? null;
  const isLoading = keyStatus === "loading";
  const canGenerate = !isLoading && !myKeyId;
  const isEncryptionLoading = encryptionStatus === "loading";
  
  const canEncrypt =
    !!prerequisites?.hasTwoKeys && !!prerequisites?.hasImportedUsers;

  const headerSummary = useMemo(
    () => {
      const totalSessions = ImportStatus ? ImportStatus.length : 0;
      const importedSessions = ImportStatus
        ? ImportStatus.filter((s) => s.import_status === "IMPORTED").length
        : 0;
      const encryptedSessions = EncryptedStatus
        ? EncryptedStatus.filter((s) => s.encryption_status === "ENCRYPTED_ALL").length
        : 0;

      return { totalSessions, importedSessions, EncryptedStatus, encryptedSessions, keyStatusDashboard, subjects, subjectQuestionsGrouped, sessionInfo, keyStatus };
    },
    [ImportStatus, EncryptedStatus, keyStatusDashboard, subjects, subjectQuestionsGrouped, sessionInfo, keyStatus]
  );

  const syncLocalFromKeys = (keys: any[]) => {
    const userKey = keys.find((k) => k.account_id === Number(userAccountId)) ?? keys[0] ?? null;

    // อัปเดตค่า input ผ่าน ref
    if (myKeyRef.current) {
      myKeyRef.current.value = userKey?.key ?? "";
    }
    setInitialKeyValue(userKey?.key ?? "");
    setMyKeyId(userKey?.id ?? null);
    setManagerName(String(userKey?.full_name ?? ""));
  };

  useEffect(() => {
    if (!numericCampaignId || !userAccountId) {
      setIsInitialLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        await Promise.all([       
          dispatch(fetchDashboardStatus(numericCampaignId)).unwrap(),
          dispatch(fetchKeysForCampaignByManager({campaignId: numericCampaignId , AccountId : Number(userAccountId)}))
            .unwrap()
            .then(syncLocalFromKeys)
            .catch((err) => {
              console.log("fetchKeysForCampaignByManager failed:", err);
              syncLocalFromKeys([]);
            }),
          dispatch(checkEncryptionPrerequisites(numericCampaignId)).unwrap()
        ]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();

    return () => {
      dispatch(clearActiveKeys());
    };
  }, [numericCampaignId, userAccountId, dispatch]);

  useEffect(() => {
    if (sessions.length > 0) {
      setSelectedSessionId(String(sessions[0].id));
    } else {
      setSelectedSessionId("");
    }
  }, [sessions]);

  const openForgetKeyModal = (keyId: number) => {
    if (!isManager) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถกู้คืนคีย์ได้",
        text: "คุณไม่มีสิทธิ์ในการกู้คืนคีย์เนื่องจากคุณไม่ใช่ผู้จัดการคีย์",
      });
      return;
    }
    setSelectedKeyId(keyId);
    setModalForgetKey(true);
  };

  const handleSaveKey = async () => {
    if (!isManager) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถสร้างคีย์ได้",
        text: "คุณไม่มีสิทธิ์ในการสร้างคีย์เนื่องจากคุณไม่ใช่ผู้จัดการคีย์",
      });
      return;
    }
    if (!numericCampaignId || !userAccountId) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือก Campaign ก่อน",
      });
      return;
    }

    const isok = await Swal.fire({
      title: "ยืนยันการบันทึกคีย์",
      text: "คุณต้องการบันทึกคีย์ของคุณหรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
    })
    if (!isok.isConfirmed) return;


    if (myKeyId) {
      Swal.fire({
        icon: "error",
        title: "คีย์ถูกบันทึกแล้ว",
      });
      return;
    }

    // ดึงค่ามาจาก useRef
    const currentKeyValue = myKeyRef.current?.value || "";

    if (!currentKeyValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอก Secret Key",
      });
      return;
    }

    if (currentKeyValue.trim().length !== 16) {
      Swal.fire({
        icon: "error",
        title: "คีย์ต้องมีความยาว 16 ตัวอักษร",
      });
      return;
    }

    dispatch(
      saveNewKey({
        campaignId: numericCampaignId,
        key: currentKeyValue.trim(),
        account_id: Number(userAccountId),
        order_num: manager_order === 1 ? 1 : 2, 
      })
    )
      .unwrap()
      .then(async () => {
        Swal.fire({ icon: "success", title: "บันทึกคีย์สำเร็จ", 
          text : `บันทึกคีย์ลำดับที่ ${manager_order} สำเร็จ ในรอบสอบ ${activeCampaign?.name ?? ""}`,
          timer: 1500, showConfirmButton: false });

        const keys = await dispatch(fetchKeysForCampaignByManager({ campaignId: numericCampaignId, AccountId: Number(userAccountId) })).unwrap();
        syncLocalFromKeys(keys);

        dispatch(checkEncryptionPrerequisites(numericCampaignId));
        dispatch(fetchDashboardStatus(numericCampaignId));
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "บันทึกคีย์ไม่สำเร็จ",
          text: typeof error === "string" ? error : "เกิดข้อผิดพลาด",
        });
      })
  };

  const handleForgetKey = async (password: string) => {
    if (!selectedKeyId) return;
    if (!isManager) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถกู้คืนคีย์ได้",
        text: "คุณไม่มีสิทธิ์ในการกู้คืนคีย์เนื่องจากคุณไม่ใช่ผู้จัดการคีย์",
      });
      return;
    }
    try {
      const result = await axios.post("/api/keys/forget", {
        campaignId: numericCampaignId,
        accountId: userAccountId,
        keyId: selectedKeyId,
        password
      })
      if (result.data.success) {
        Swal.fire({ icon: "success", title: "กู้คืนคีย์สำเร็จ", timer: 1500, showConfirmButton: false });
        setForgetKey(result.data.data)
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "กู้คืนคีย์ไม่สำเร็จ",
        text: error.response?.data?.message || "เกิดข้อผิดพลาด",
        confirmButtonText: "ตกลง",
      });
    }
  }

  const handleDeleteKey = (keyId: number) => {
    if (!isManager) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถลบคีย์ได้",
        text: "คุณไม่มีสิทธิ์ในการลบคีย์เนื่องจากคุณไม่ใช่ผู้จัดการคีย์",
      });
      return;
    }
    Swal.fire({
      title: `ยืนยันการลบคีย์`,
      text: `คุณต้องการลบคีย์ของคุณหรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) return;
      dispatch(deleteKey({ campaignId: numericCampaignId!, account_id: Number(userAccountId), keyId }))
        .unwrap()
        .then(async () => {
          Swal.fire({ icon: "success", title: "ลบคีย์สำเร็จ",
            text: `ลบคีย์ลำดับที่ ${manager_order} สำเร็จ ในรอบสอบ ${activeCampaign?.name ?? ""}`,
            timer: 1500, showConfirmButton: false });

          // เคลียร์ค่า input ใน ref
          if (myKeyRef.current) myKeyRef.current.value = "";

          const keys = await dispatch(fetchKeysForCampaignByManager({ campaignId: numericCampaignId!, AccountId: Number(userAccountId) })).unwrap();
          syncLocalFromKeys(keys);

          dispatch(checkEncryptionPrerequisites(numericCampaignId!));
          dispatch(fetchDashboardStatus(numericCampaignId));
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "ลบคีย์ไม่สำเร็จ",
            text: typeof error === "string" ? error : "เกิดข้อผิดพลาด",
            confirmButtonText: "ตกลง",
          });
        });
    });
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleRunBulkEncryption = async () => {
    if (!numericCampaignId || !canEncrypt) {
      await Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณาตรวจสอบให้แน่ใจว่ามีคีย์ในระบบครบ 2 คีย์ และนำเข้าผู้สอบเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    dispatch(clearEncryptionResult());
    const MIN_LOADING_TIME = 3000;
    const startTime = Date.now();

    Swal.fire({
      title: "กำลังเข้ารหัส...",
      text: "กรุณารอสักครู่",
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
    });

    let result;
    try {
      result = await dispatch(runBulkEncryptionForSession({ campaignId: numericCampaignId }));
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);
      await new Promise((resolve) => setTimeout(resolve, remaining));
      Swal.close();
    }

    if (result.meta.requestStatus === "fulfilled") {
      await Promise.all([
        dispatch(fetchDashboardStatus(numericCampaignId)),
        dispatch(checkEncryptionPrerequisites(numericCampaignId)),
        dispatch(fetchKeysForCampaign(numericCampaignId)),
      ]);
      await Swal.fire({
        icon: "success",
        title: "เข้ารหัสสำเร็จ!",
        text: `เข้ารหัสผู้สอบ ${(result.payload as any).usersEncrypted / NumberOfSession} คนในรอบสอบนี้`,
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      await Swal.fire({
        icon: "error",
        title: "เข้ารหัสล้มเหลว",
        text: result.payload as string,
        confirmButtonText: "ตกลง",
      });
    }
  };

  const prerequisitesCards = useMemo(
    () => ({
      hasTwoKeys: prerequisites?.hasTwoKeys ?? false,
      hasImportedUsers: prerequisites?.hasImportedUsers ?? false,
    }),
    [prerequisites]
  );

  return {
    initialKeyValue,
    activeCampaign,
    activeKeys,
    keyStatus,
    keyManagementError,
    sessions,
    prerequisites: prerequisitesCards,
    encryptionStatus,
    lastBulkEncryptionStats,
    headerSummary,

    IshasKey,
    myKeyRef, // โยน Ref ออกไปแทนตัวแปร String
    myKeyId,
    managerName,
    
    selectedSessionId,
    setSelectedSessionId,
    numericCampaignId,
    isLoading,
    isInitialLoading,
    canGenerate,
    isEncryptionLoading,
    canEncrypt,

    handleSaveKey,
    handleDeleteKey,
    handleSessionChange,
    handleRunBulkEncryption,

    keyStatusDashboard,
    subjects,
    subjectQuestionsGrouped,

    forgetKey,
    setForgetKey,
    modalforgetKey,
    setModalForgetKey,
    handleForgetKey,
    accountFullName,
    openForgetKeyModal,

    manager_order
  };
};