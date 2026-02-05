// src/hooks/useGradingRecheck.ts
import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";

import { selectCurrentUser } from "@/store/slices/auth.slice";
import { selectActiveCampaign } from "@/store/slices/examData.slice";

import {
  selectGradersForCampaign,
  selectGradersStatus,
  selectAssignmentsForGrader,
  fetchGradersForCampaignThunk,
  CrmGrader,
} from "@/store/slices/graders.slice";

import {
  selectGradingRecords,
  fetchRecordThunk,
} from "@/store/slices/grading.slice";

import { DeleteCamp } from "@/utils/camp";

export interface RecheckSlotInfo {
  slotId: number;
  graderOrder: number;
  status: string;
  bookletId: number;
  userId: number;
  userCode: string;
  subjectId: number;
  questionNo: number;
}

export interface RecordedScore {
  slotId: number;
  score: number;
  enteredAt: string;
}

export const useGradingRecheck = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // --- 1. Global state ---
  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);

  const campaignNumericId = activeCampaign?.id
    ? Number(DeleteCamp(String(activeCampaign.id)))
    : null;

  const gradersStatus = useAppSelector(selectGradersStatus);
  const graders = useAppSelector(
    selectGradersForCampaign(campaignNumericId)
  );

  const accountId = user ? Number(user.id) : null;
  const gradersAssignment = useAppSelector(
    selectAssignmentsForGrader(campaignNumericId, accountId)
  );

  // ดึง grader list ครั้งแรก
  useEffect(() => {
    if (campaignNumericId && gradersStatus === "idle") {
      dispatch(fetchGradersForCampaignThunk(campaignNumericId));
    }
  }, [campaignNumericId, gradersStatus, dispatch]);

  // หา profile grader ปัจจุบัน
  const graderProfile: CrmGrader | null = useMemo(() => {
    if (!user || !graders || graders.length === 0) return null;
    const userId = String(user.id);
    return graders.find((g: any) => String(g.account_id) === userId) ?? null;
  }, [graders, user]);

  const myAssignments = useMemo<CrmGrader[]>(() => {
    if (!user || !graders || graders.length === 0) return [];
    const userId = String(user.id);
    return graders.filter((g: any) => String(g.account_id) === userId);
  }, [graders, user]);

  const [activeAssignment, setActiveAssignment] =
    useState<CrmGrader | null>(null);

  useEffect(() => {
    if (myAssignments.length > 0) {
      setActiveAssignment(myAssignments[0]);
    } else {
      setActiveAssignment(null);
    }
  }, [myAssignments]);

  // --- 2. Scanner / score state ---
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [pauseAfterSuccess, setPauseAfterSuccess] = useState(true);
  const [pause, setPause] = useState(false);
  const [facingMode, setFacingMode] =
    useState<"environment" | "user">("environment");
  const [cooldownMs, setCooldownMs] = useState(1200);
  const lastScanRef = useRef<number>(0);

  const [manualPayload, setManualPayload] = useState("");
  const [scanData, setScanData] = useState<string | null>(null);
  const [questionNo, setQuestionNo] = useState<number | null>(null);
  const [score, setScore] = useState<string>("");

  const [currentSlot, setCurrentSlot] = useState<RecheckSlotInfo | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const canScan = useMemo(
    () => scannerEnabled && !pause,
    [scannerEnabled, pause]
  );

  const isLoading = loadingScan || loadingSave;

  // --- 3. Recent scores (reuse grading slice เดิม) ---
  const records = useAppSelector(selectGradingRecords);
  const [recent, setRecent] = useState<RecordedScore[]>([]);

  useEffect(() => {
    if (activeAssignment?.grader_id) {
      dispatch(fetchRecordThunk(activeAssignment.grader_id));
    }
  }, [dispatch, activeAssignment?.grader_id]);

  useEffect(() => {
    if (records && records.length > 0) {
      setRecent(
        records.slice(0, 5).map((r: any) => ({
          slotId: r.slotId ?? 0,
          score: Number(r.score),
          enteredAt:
            r.enteredAt ?? new Date().toLocaleTimeString("th-TH"),
        }))
      );
    } else {
      setRecent([]);
    }
  }, [records]);

  // --- 4. Scanner helpers ---
  const toggleScanner = () => {
    setScannerEnabled((prev) => {
      const next = !prev;
      setPause(!next);
      return next;
    });
  };

  const toggleFacingMode = () => {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  };

  const handleClear = () => {
    setManualPayload("");
    setScanData(null);
    setCurrentSlot(null);
    setScore("");
    setPause(false);
    setScannerEnabled(true);
  };

  // --- 5. Scan สำหรับ RECHECK (ใช้ axios) ---
  const handleScan = async (value: string) => {
    const now = Date.now();
    if (!canScan) return;

    if (!questionNo) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เลือกข้อ",
        text: "กรุณาเลือกข้อคำถามก่อนสแกน recheck",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (!activeCampaign || !graderProfile || !campaignNumericId) {
      await Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ครบ",
        text: "ไม่พบข้อมูลแคมเปญหรือโปรไฟล์ผู้ตรวจ",
      });
      return;
    }

    // กันสแกนถี่
    if (now - lastScanRef.current < cooldownMs) return;
    lastScanRef.current = now;

    try {
      setLoadingScan(true);
      setScannerEnabled(false);
      setPause(true);

      // *** ตรงนี้ให้ router ฝั่ง server match กับ path นี้ ***
      // POST /grading-recheck/scan
      const { data } = await axios.post<RecheckSlotInfo>(
        "/api/grading/recheck/scan-disputed",
        {
          qrPayload: value,
          campaignId: campaignNumericId,
          graderId: graderProfile.grader_id,
          questionNo: questionNo,
        }
      );

      setCurrentSlot(data);
      setScanData(value ?? null);

      if (data.status !== "DISPUTED") {
        toast({
          title: "ยังไม่เข้าข่าย recheck",
          description: `สถานะปัจจุบันของ slot: ${data.status}`,
        });
      } else {
        toast({
          title: "โหลด slot สำหรับ recheck แล้ว",
          description: `Slot #${data.slotId} | ข้อที่ ${data.questionNo}`,
        });
      }

      if (!pauseAfterSuccess) {
        setTimeout(() => {
          setPause(false);
          setScannerEnabled(true);
        }, cooldownMs);
      }
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "สแกนสำหรับ recheck ไม่สำเร็จ",
        text:
          err?.response?.data?.message ??
          err.message ??
          "เกิดข้อผิดพลาด",
      });
      setPause(false);
      setScannerEnabled(true);
    } finally {
      setLoadingScan(false);
    }
  };

  const verifyManualPayload = async () => {
    const value = manualPayload.trim();
    if (!value) {
      await Swal.fire({
        icon: "error",
        title: "ไม่มีข้อมูล",
        text: "กรุณาวางหรือพิมพ์ QR payload ก่อน",
      });
      return;
    }
    await handleScan(value);
  };

  // --- 6. Save คะแนน RECHECK (axios -> endpoint เดิม /grading/score) ---
  const handleSaveScore = async () => {
    if (!currentSlot || !scanData || !graderProfile || !score || !campaignNumericId) {
      await Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ครบ",
        text: "ต้องมี slot + QR + คะแนน ก่อนบันทึก recheck",
      });
      return;
    }

    try {
      setLoadingSave(true);

      // ใช้ endpoint เดิมที่ server รองรับการบันทึกคะแนน
      const { data } = await axios.post("/grading/score", {
        slotId: currentSlot.slotId,
        qrPayload: scanData,
        campaignId: campaignNumericId,
        graderId: graderProfile.grader_id,
        score: Number(score),
        questionNo: currentSlot.questionNo,
      });

      await Swal.fire({
        icon: "success",
        title: "บันทึกคะแนน recheck สำเร็จ",
        text: `Slot #${data.slotId} คะแนน: ${data.score}`,
      });

      handleClear();
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "บันทึกคะแนน recheck ไม่สำเร็จ",
        text:
          err?.response?.data?.message ??
          err.message ??
          "เกิดข้อผิดพลาด",
      });
    } finally {
      setLoadingSave(false);
      setIsConfirmOpen(false);
    }
  };

  const closeConfirmModal = () => setIsConfirmOpen(false);

  return {
    // header / profile
    user,
    graderProfile,
    gradersStatus,
    activeAssignment,
    isLoading,
    gradersAssignment,

    // scanner / score state
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
    questionNo,

    // setters
    setQuestionNo,
    setPauseAfterSuccess,
    setCooldownMs,
    setManualPayload,
    setScore,

    // handlers
    toggleScanner,
    toggleFacingMode,
    handleClear,
    verifyManualPayload,
    handleSaveScore,
    handleScan,
    closeConfirmModal,
  };
};
