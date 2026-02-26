// hooks/useKeyManagement.ts
import { use, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { useToast } from "@/components/ui/use-toast";
import Swal from "sweetalert2";

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
  selectPrerequisites
} from "@/store/slices/key.slice";

import {
  selectDashboardStatus, selectEncryptedStatus, selectImportStatus, fetchDashboardStatus
  , selectKeyStatus, selectSubjects, selectSubjectQuestionsGrouped, selectSession
} from "@/store/slices/dashboard.slice"

import { selectCurrentUser } from "@/store/slices/auth.slice";

import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import { set } from "react-hook-form";
import axios from "axios";

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
  // const [keyInput, setKeyInput] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("20");
  const [IshasKey, setIshasKey] = useState(false)
  const [firstKey, setFirstKey] = useState<string>("");
  const [secondKey, setSecondKey] = useState<string>("");
  const [firstKeyId, setFirstKeyId] = useState<number | null>(null);
  const [secondKeyId, setSecondKeyId] = useState<number | null>(null);
  const [manager1, setmanager1] = useState<string>("");
  const [manager2, setmanager2] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [forgetKey, setForgetKey] = useState("")
  const [modalforgetKey, setModalForgetKey] = useState(false)
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);


  const accountFullName = users ? users.name : "ไม่พบผู้ใช้";
  const isManager = users ? users.roles.includes("manager") : false;
  // console.log("KeyCreateCard props:", {
  //   manager1
  // });

  const numericCampaignId = activeCampaign
    ? parseCampaignId(activeCampaign.id)
    : null;

  const userAccountId = users.id ?? null;
  const isLoading = keyStatus === "loading";
  const canGenerate = !isLoading && activeKeys.length < 2;
  const isEncryptionLoading = encryptionStatus === "loading";
  const canEncrypt =
    !!prerequisites?.hasTwoKeys && !!prerequisites?.hasImportedUsers;

  console.log(sessions, "sessions from useKeyManagement")



  const headerSummary = useMemo(
    () => {
      const totalSessions = ImportStatus ? ImportStatus.length : 0;
      const importedSessions = ImportStatus
        ? ImportStatus.filter((s) => s.import_status === "IMPORTED").length
        : 0;
      const encryptedSessions = EncryptedStatus
        ? EncryptedStatus.filter((s) => s.encryption_status === "ENCRYPTED_ALL").length
        : 0;

      console.log(encryptedSessions, "encryptedSessions in useKeyManagement")

      return { totalSessions, importedSessions, EncryptedStatus, encryptedSessions, keyStatusDashboard, subjects, subjectQuestionsGrouped, sessionInfo, keyStatus };;
    },
    [ImportStatus, EncryptedStatus, keyStatusDashboard, subjects, subjectQuestionsGrouped, sessionInfo, keyStatus]
  );

  function syncLocalFromKeys(keys: any[]) {
    const first = keys.find((k) => k.order_num === 1) ?? null;
    const second = keys.find((k) => k.order_num === 2) ?? null;

    setFirstKey(first?.key ?? "");
    setSecondKey(second?.key ?? "");
    setFirstKeyId(first?.id ?? null);
    setSecondKeyId(second?.id ?? null);

    setmanager1(String(first?.full_name ?? ""));
    setmanager2(String(second?.full_name ?? ""));
  }


  useEffect(() => {
    console.log("dashboardStatus =", dashboardStatus);
    console.log("EncryptedStatus =", EncryptedStatus);
    console.log("ImportStatus =", ImportStatus);
    console.log("headerSummary =", headerSummary);
    console.log("sessions =", sessions);
    console.log("keyStatusDashboard =", keyStatusDashboard);
    console.log("subjects =", subjects);
    console.log("subjectQuestionsGrouped =", subjectQuestionsGrouped);
    console.log("sessionInfo =", sessionInfo);
    console.log("keyStatus =", keyStatus);

  }, [dashboardStatus, EncryptedStatus, ImportStatus, sessions, keyStatusDashboard, subjects, subjectQuestionsGrouped, sessionInfo]);





  useEffect(() => {
    if (!numericCampaignId || !userAccountId) {
      setIsInitialLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        await Promise.all([
          dispatch(fetchDashboardStatus(numericCampaignId)).unwrap(),
          dispatch(fetchKeysForCampaign(numericCampaignId))
            .unwrap()
            .then(syncLocalFromKeys)
            .catch((err) => {
              console.log("fetchKeysForCampaign failed:", err);
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
      // บังคับให้เลือกตัวแรกเสมอ (หรือจะหา default ตัวอื่นก็ได้)
      setSelectedSessionId(String(sessions[0].id));
    } else {
      setSelectedSessionId("");
    }
  }, [sessions]);


  const handleSaveFirstKey = () => handleSaveKey(1);
  const handleSaveSecondKey = () => handleSaveKey(2);


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

  const handleSaveKey = (orderNum: 1 | 2) => {
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

    // ป้องกัน save ซ้ำ
    if (orderNum === 1 && firstKeyId) {
      Swal.fire({
        icon: "error",
        title: "คีย์คนที่ 1 ถูกบันทึกแล้ว",
      });
      return;
    }

    if (orderNum === 2 && secondKeyId) {
      Swal.fire({
        icon: "error",
        title: "คีย์คนที่ 2 ถูกบันทึกแล้ว",
      });
      return;
    }

    const keyValue = orderNum === 1 ? firstKey : secondKey;

    if (!keyValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอก Secret Key",
      });
      return;
    }

    if (keyValue.trim().length !== 16) {
      Swal.fire({
        icon: "error",
        title: "คีย์ต้องมีความยาว 16 ตัวอักษร",
      });
      return;
    }

    dispatch(
      saveNewKey({
        campaignId: numericCampaignId,
        key: keyValue.trim(),
        account_id: Number(userAccountId),
        order_num: orderNum,
      })
    )
      .unwrap()
      .then(async () => {
        Swal.fire({ icon: "success", title: "บันทึกคีย์สำเร็จ", timer: 1500, showConfirmButton: false });

        const keys = await dispatch(fetchKeysForCampaign(numericCampaignId)).unwrap();
        syncLocalFromKeys(keys);

        dispatch(checkEncryptionPrerequisites(numericCampaignId));
        dispatch(fetchDashboardStatus(numericCampaignId));

        const MIN_LOADING_TIME = 3000;
        const startTime = Date.now();

        // // ✅ 2. เปิด loading
        // Swal.fire({
        //   title: "กำลังประมวลผล...",
        //   allowOutsideClick: false,
        //   didOpen: () => {
        //     Swal.showLoading();
        //   },
        // });

        // // ✅ 3. ใส่ logic เวลา "ตรงนี้"
        // dispatch(runBulkEncryptionForSession({ campaignId: numericCampaignId }))
        //   .unwrap()
        //   .then(() => {
        //     const elapsed = Date.now() - startTime;
        //     const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);

        //     setTimeout(() => {
        //       Swal.fire({
        //         icon: "success",
        //         title: "เข้ารหัสสำเร็จ",
        //         timer: 1500,
        //         showConfirmButton: false,
        //       });
        //     }, remaining);
        //   })
        //   .catch(() => {
        //     const elapsed = Date.now() - startTime;
        //     const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);

        //     setTimeout(() => {
        //       Swal.fire({
        //         icon: "error",
        //         title: "เข้ารหัสล้มเหลว",
        //       });
        //     }, remaining);
        //   });
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
    if (!selectedKeyId) {
      return;
    }
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
        Swal.fire({
          icon: "success",
          title: "กู้คืนคีย์สำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
        console.log(result)
        setForgetKey(result.data.data)
      }
    } catch (error) {
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
      title: `ยืนยันการลบคีย์  ${keyId === firstKeyId ? "ผู้จัดการคีย์คนที่ 1" : "ผู้จัดการคีย์คนที่ 2"}`,
      text: `คุณต้องการลบคีย์ของ ${keyId === firstKeyId ? manager1 : manager2} หรือไม่?`,
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
          Swal.fire({ icon: "success", title: "ลบคีย์สำเร็จ", timer: 1500, showConfirmButton: false });

          const keys = await dispatch(fetchKeysForCampaign(numericCampaignId!)).unwrap();
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
    console.log(sessionId)
    setSelectedSessionId(sessionId);
  };

  const handleRunBulkEncryption = async () => {
    if (!numericCampaignId || !canEncrypt) {
      await Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณาตรวจสอบให้แน่ใจว่ามีคีย์ 2 คีย์ และนำเข้าผู้สอบเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    dispatch(clearEncryptionResult());

    const MIN_LOADING_TIME = 3000;
    const startTime = Date.now();

    // ✅ เปิด loading
    Swal.fire({
      title: "กำลังเข้ารหัส...",
      text: "กรุณารอสักครู่",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    let result;
    try {
      result = await dispatch(
        runBulkEncryptionForSession({
          campaignId: numericCampaignId,
        })
      );
    } finally {
      //  คำนวณเวลาให้ loading โชว์ขั้นต่ำ
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
        text: `เข้ารหัสผู้สอบ ${result.payload.usersEncrypted / NumberOfSession} คนในรอบสอบนี้`,
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
    // redux-ish
    activeCampaign,
    activeKeys,
    keyStatus,
    keyManagementError,
    sessions,
    prerequisites: prerequisitesCards,
    encryptionStatus,
    lastBulkEncryptionStats,
    headerSummary,

    // local

    IshasKey,
    firstKey,
    secondKey,
    firstKeyId,
    secondKeyId,
    selectedSessionId,
    setSelectedSessionId,
    setFirstKey,
    setSecondKey,
    // derived
    numericCampaignId,
    isLoading,
    isInitialLoading,
    canGenerate,
    isEncryptionLoading,
    canEncrypt,

    //manager
    manager1,
    manager2,

    // handlers
    handleSaveFirstKey,
    handleSaveSecondKey,
    handleSaveKey,
    handleDeleteKey,
    handleSessionChange,
    handleRunBulkEncryption,


    keyStatusDashboard,
    subjects,
    subjectQuestionsGrouped,

    //forgetkey
    forgetKey,
    setForgetKey,
    modalforgetKey,
    setModalForgetKey,
    handleForgetKey,
    accountFullName,
    openForgetKeyModal

  };
};
