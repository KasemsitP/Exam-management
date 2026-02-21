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

const parseCampaignId = (id: string): number => Number(id.replace("camp-", ""));
const parseSessionId = (id: string): number => Number(id.replace("sess-", ""));

export const useKeyManagement = () => {
  const { toast } = useToast();
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
  const [manager2, setmanager2] = useState<string>("")


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

      return { totalSessions, importedSessions,EncryptedStatus, encryptedSessions , keyStatusDashboard, subjects, subjectQuestionsGrouped, sessionInfo , keyStatus};;
    },
    [ImportStatus, EncryptedStatus, keyStatusDashboard, subjects, subjectQuestionsGrouped, sessionInfo ,keyStatus]
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
    if (!numericCampaignId || !userAccountId) return;

    dispatch(fetchDashboardStatus(numericCampaignId));

    dispatch(fetchKeysForCampaign(numericCampaignId))
      .unwrap()
      .then(syncLocalFromKeys)
      .catch((err) => {
        console.log("fetchKeysForCampaign failed:", err);
        syncLocalFromKeys([]);
      });

    dispatch(checkEncryptionPrerequisites(numericCampaignId));

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




  const handleSaveKey = (orderNum: 1 | 2) => {
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


  const handleDeleteKey = (keyId: number) => {
    Swal.fire({
      title: `ยืนยันการลบคีย์ ID: ${keyId}?`,
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
    if (!numericCampaignId || !selectedSessionId || !canEncrypt) {
      await Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณาเลือก Session และตรวจสอบว่าคีย์/ข้อมูล พร้อม",
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
      await Swal.fire({
        icon: "success",
        title: "เข้ารหัสสำเร็จ!",
        text: `เข้ารหัสผู้สอบ ${result.payload.usersEncrypted / NumberOfSession} คน ใน Session นี้`,
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
  };
};
