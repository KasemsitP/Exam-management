// hooks/useGradingStation.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector, useAppDispatch } from "@/store/hook";

import {
  submitScoreThunk,
  selectIsGradingLoading,
  selectGradingError,
  clearGradingError,
  PayloadScore,
  verifyAndAllocateThunk,
  selectLastSlotId,
  selectGradingRecords,
  fetchRecordThunk,
} from "@/store/slices/grading.slice";

import { selectCurrentUser } from "@/store/slices/auth.slice";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  selectGradersForCampaign,
  selectGradersStatus,
  fetchGradersForCampaignThunk,
  CrmGrader,
  selectAssignmentsForGrader
} from "@/store/slices/graders.slice";

import { DeleteCamp } from "@/utils/camp";

export interface RecordedScore {
  slotId: number;
  score: number;
  enteredAt: string;
}

export const useGradingStation = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // --- 1. Slices ---
  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const lastSlotId = useAppSelector(selectLastSlotId);
  const records = useAppSelector(selectGradingRecords);

  const campaignNumericId = activeCampaign?.id
    ? Number(DeleteCamp(String(activeCampaign.id)))
    : null;

  const accountId = user ? Number(user.id) : null;
  const gradersStatus = useAppSelector(selectGradersStatus);
  const graders = useAppSelector(
    selectGradersForCampaign(campaignNumericId)
  );

  const gradersAssignment = useAppSelector(
    selectAssignmentsForGrader(campaignNumericId, accountId)
  );

  useEffect(() => {
    console.log("gradersAssignment =", gradersAssignment);
  }, [gradersAssignment]);

  const isLoading = useAppSelector(selectIsGradingLoading);
  const gradingError = useAppSelector(selectGradingError);

  // --- 2. Fetch graders once ---
  useEffect(() => {
    if (activeCampaign && gradersStatus === "idle") {
      dispatch(
        fetchGradersForCampaignThunk(
          activeCampaign.id ? Number(DeleteCamp(activeCampaign.id)) : null
        )
      );
    }
  }, [activeCampaign, gradersStatus, dispatch]);

  // --- 3. Grader profile & assignments ---
  const graderProfile = useMemo<CrmGrader | null>(() => {
    if (!user || !graders || graders.length === 0) return null;
    const userId = String(user.id);
    const profile =
      graders.find((g: any) => String(g.account_id) === userId) ?? null;

    console.log("Matched graderProfile:", profile);
    return profile;
  }, [graders, user]);

  const myAssignments = useMemo<CrmGrader[]>(() => {
    if (!user || !graders || graders.length === 0) return [];
    const userId = String(user.id);
    return graders.filter((g: any) => String(g.account_id) === userId);
  }, [graders, user]);

  const [activeAssignment, setActiveAssignment] = useState<CrmGrader | null>(
    null
  );

  useEffect(() => {
    if (myAssignments.length > 0) {
      setActiveAssignment(myAssignments[0]); 
    } else {
      setActiveAssignment(null);
    }
  }, [myAssignments]);

  // --- 4. Scanner state ---
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [pauseAfterSuccess, setPauseAfterSuccess] = useState(true);
  const [pause, setPause] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [cooldownMs, setCooldownMs] = useState(1200);
  const lastScanRef = useRef<number>(0);
  const [manualPayload, setManualPayload] = useState("");
  const canScan = useMemo(
    () => scannerEnabled && !pause,
    [scannerEnabled, pause]
  );

  // --- 5. Scoring state ---
  const [scanData, setScanData] = useState<string | null>("");
  const [score, setScore] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recent, setRecent] = useState<RecordedScore[]>([]);

  // --- 6. Error -> toast ---
  useEffect(() => {
    if (gradingError) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: gradingError,
        variant: "destructive",
      });
      dispatch(clearGradingError());
    }
  }, [gradingError, dispatch, toast]);

  // --- 7. Fetch records for recent list ---
  useEffect(() => {
    if (activeAssignment?.grader_id) {
      dispatch(fetchRecordThunk(activeAssignment.grader_id));
    }
  }, [dispatch, activeAssignment?.grader_id]);

  useEffect(() => {
    if (records && records.length > 0) {
      setRecent(
        records
          .slice(0, 5)
          .map((r) => ({
            slotId: r.slotId ?? 0,
            score: r.score,
            enteredAt:
              (r as any).enteredAt ??
              new Date().toLocaleTimeString("th-TH"),
          }))
      );
    } else {
      setRecent([]);
    }
  }, [records]);

  // --- 8. Handlers ---

  const handleScan = async (value: string) => {
    const now = Date.now();
    if (!canScan) return;
    if (now - lastScanRef.current < cooldownMs) return; // กันยิงรัว
    lastScanRef.current = now;

    if (!activeAssignment || !graderProfile) return;

    setScannerEnabled(false);
    setPause(true);

    const result = await dispatch(
      verifyAndAllocateThunk({
        qrPayload: value,
        campaignId: Number(DeleteCamp(activeCampaign.id)),
        graderId: graderProfile.grader_id,
      })
    );

    if (verifyAndAllocateThunk.rejected.match(result)) {
      // error ถูกเก็บใน gradingState.error แล้ว
      return;
    }

    setScanData(value ?? null);
    toast({
      title: "สแกนสำเร็จ",
      description: `พบรหัสผู้เข้าสอบ: ${value ?? "ไม่ระบุ"}`,
    });

    if (pauseAfterSuccess) {
      return;
    }
    setTimeout(() => {
      setPause(false);
      setScannerEnabled(true);
    }, cooldownMs);
  };

  const handleClear = () => {
    setManualPayload("");
    setScanData(null);
    setPause(false);
    setScannerEnabled(true);
  };

  const verifyManualPayload = async () => {
    const value = manualPayload.trim();
    if (!value) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "กรุณาวาง/พิมพ์ QR payload ก่อน",
        variant: "destructive",
      });
      return;
    }
    setScannerEnabled(false);
    setPause(true);
    await handleScan(value);
  };

  const handleConfirmScore = () => {
    if (!scanData || !user || !activeAssignment || !score) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description:
          "กรุณาสแกน QR, ตรวจสอบโปรไฟล์ผู้ตรวจ, และกรอกคะแนนก่อน",
        variant: "destructive",
      });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSaveScore = async () => {
    if (!scanData || !user || !activeAssignment || !score) {
      setIsConfirmOpen(false);
      return;
    }

    const payload: PayloadScore = {
      slotId: lastSlotId,
      qrPayload: scanData,
      campaignId: activeAssignment.campaign_id,
      graderId: activeAssignment.grader_id,
      score: Number(score),
    };

    try {
      const resultAction = await dispatch(submitScoreThunk(payload));

      if (resultAction.type.endsWith("/rejected")) {
        const errorPayload = resultAction.payload as string;
        throw new Error(errorPayload);
      }

      const result = resultAction.payload as { slotId: number; score: number };

      const record: RecordedScore = {
        slotId: lastSlotId,
        score: Number(score),
        enteredAt: new Date().toLocaleTimeString("th-TH"),
      };

      setRecent((prev) => [record, ...prev].slice(0, 6));
      setScanData(null);
      setScore("");
      toast({
        title: "บันทึกคะแนนสำเร็จ!",
        description: `Slot ID: ${result.slotId} | คะแนน: ${result.score}`,
      });

      if (pauseAfterSuccess) {
        setPause(false);
        setScannerEnabled(true);
      }
      handleClear()
    } catch (error: any) {
      console.error("Failed to save score:", error);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const toggleScanner = () => {
    setScannerEnabled((prev) => {
      const next = !prev;
      setPause(!next ? true : false);
      return next;
    });
  };

  const toggleFacingMode = () => {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  };

  const closeConfirmModal = () => setIsConfirmOpen(false);

  const requestCameraPermission = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    toggleScanner();
  } catch (err) {
    console.warn("ผู้ใช้ไม่ได้อนุญาตกล้อง:", err);
    alert("กรุณาอนุญาตกล้องเพื่อใช้งานสแกน QR");
  }
};


  return {
    user,
    graderProfile,
    gradersStatus,
    activeAssignment,
    isLoading,
    gradersAssignment,
    scanData,
    score,
    manualPayload,
    recent,
    scannerEnabled,
    pause,
    pauseAfterSuccess,
    cooldownMs,
    facingMode,
    isConfirmOpen,
    // requestCameraPermission,
    setPauseAfterSuccess,
    setCooldownMs,
    toggleScanner,
    toggleFacingMode,
    handleClear,
    setManualPayload,
    verifyManualPayload,
    setScore,
    handleConfirmScore,
    handleSaveScore,
    handleScan,
    closeConfirmModal,
  };
};
