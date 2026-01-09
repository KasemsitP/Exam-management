// hooks/useKeyManagement.ts
import { useEffect, useMemo, useState } from "react";
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
  selectPrerequisites,
  fetchKeysForCampaignByManager
} from "@/store/slices/key.slice";

import { selectDashboardStatus, selectEncryptedStatus, selectImportStatus, fetchDashboardStatus } from "@/store/slices/dashboard.slice"

import { selectCurrentUser } from "@/store/slices/auth.slice";

import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";

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

  // --- Local state ---
  const [keyInput, setKeyInput] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("20");
  const [IshasKey, setIshasKey] = useState(false)
  const [myKeyId, setMyKeyId] = useState<number | null>(null);

  const numericCampaignId = activeCampaign
    ? parseCampaignId(activeCampaign.id)
    : null;

  const userAccountId = users.id ?? null;
  const isLoading = keyStatus === "loading";
  const canGenerate = !isLoading && activeKeys.length < 2;
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

      return { totalSessions, importedSessions, encryptedSessions };
    },
    [ImportStatus, EncryptedStatus]
  );


  useEffect(() => {
    console.log("dashboardStatus =", dashboardStatus);
    console.log("EncryptedStatus =", EncryptedStatus);
    console.log("ImportStatus =", ImportStatus);
    console.log("headerSummary =", headerSummary);
    console.log(sessions)
  }, [dashboardStatus, EncryptedStatus, ImportStatus]);




  useEffect(() => {
    if (!numericCampaignId || !userAccountId) return;
    dispatch(fetchDashboardStatus(numericCampaignId));
    dispatch(
      fetchKeysForCampaignByManager({
        campaignId: numericCampaignId,
        AccountId: Number(userAccountId),
      })
    )
      .unwrap()
      .then((keys) => {
        console.log("keys =", keys);

        if (!keys || keys.length === 0) {
          setKeyInput("");
          setIshasKey(false);
          setMyKeyId(null);
          return;
        }

        const latest = keys[0];
        console.log("latest =", latest);

        setKeyInput(latest.key ?? "");
        setIshasKey(true);
        setMyKeyId(latest.id);
      })
      .catch((err) => {
        console.log("fetchKeysForCampaignByManager failed:", err);
        setKeyInput("");
        setIshasKey(false);
        setMyKeyId(null);
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



  const handleSaveKey = () => {
    if (!numericCampaignId) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือก Campaign ก่อน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (!keyInput.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกคีย์ (Secret)",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (!canGenerate) {
      Swal.fire({
        icon: "error",
        title: "รอบสอบนี้มีคีย์ครบ 2 อันแล้ว",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (keyInput.trim().length !== 16) {
      Swal.fire({
        icon: "error",
        title: "คีย์ต้องมีความยาว 16 ตัวอักษร",
        text: "กรุณาตรวจสอบ Secret Key อีกครั้ง",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    dispatch(
      saveNewKey({
        campaignId: numericCampaignId,
        key: keyInput.trim(),
        account_id: Number(userAccountId)
      })
    )
      .unwrap()
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "บันทึกคีย์สำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });

        dispatch(checkEncryptionPrerequisites(numericCampaignId));
        setKeyInput("");
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "บันทึกคีย์ไม่สำเร็จ",
          text: typeof error === "string" ? error : "เกิดข้อผิดพลาด",
          confirmButtonText: "ตกลง",
        });
      });


    setKeyInput("");
    dispatch(
      fetchKeysForCampaignByManager({
        campaignId: numericCampaignId,
        AccountId: Number(userAccountId),
      })
    )
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
      if (result.isConfirmed) {
        dispatch(deleteKey(keyId))
          .unwrap()
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "ลบคีย์สำเร็จ",
              timer: 1500,
              showConfirmButton: false,
            });

            if (numericCampaignId) {
              dispatch(checkEncryptionPrerequisites(numericCampaignId));
            }
          })
          .catch((error) => {
            Swal.fire({
              icon: "error",
              title: "ลบคีย์ไม่สำเร็จ",
              text: typeof error === "string" ? error : "เกิดข้อผิดพลาด",
              confirmButtonText: "ตกลง",
            });
          });
      }
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

    // แสดง loading ระหว่างเข้ารหัส
    Swal.fire({
      title: "กำลังเข้ารหัส...",
      text: "กรุณารอสักครู่",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    console.log(numericCampaignId , selectedSessionId);

    const result: any = await dispatch(
      runBulkEncryptionForSession({
        campaignId: numericCampaignId,
        sessionId: parseSessionId(selectedSessionId),
      })
    );

    Swal.close();

    if (result.meta.requestStatus === "fulfilled") {
      await Swal.fire({
        icon: "success",
        title: "เข้ารหัสสำเร็จ!",
        text: `เข้ารหัสผู้สอบ ${result.payload.usersEncrypted} คน ใน Session นี้`,
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
    myKeyId,
    keyInput,
    setKeyInput,
    selectedSessionId,
    setSelectedSessionId,

    // derived
    numericCampaignId,
    isLoading,
    canGenerate,
    isEncryptionLoading,
    canEncrypt,

    // handlers
    handleSaveKey,
    handleDeleteKey,
    handleSessionChange,
    handleRunBulkEncryption,
  };
};
