// hooks/useGradingStation.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector, useAppDispatch } from "@/store/hook";
import Swal from "sweetalert2";

import type {
  PayloadScore,
  PayloadSlot,
  GradingRecord,
} from "@/store/slices/grading.slice";

import { selectCurrentUser } from "@/store/slices/auth.slice";
import { selectActiveCampaign  , selectQrActiveCampaign} from "@/store/slices/examData.slice";
import {
  selectGradersForCampaign,
  selectGradersStatus,
  fetchGradersForCampaignThunk,
  CrmGrader,
  selectAssignmentsForGrader
} from "@/store/slices/graders.slice";

import { DeleteCamp } from "@/utils/camp";
import { set } from "react-hook-form";

export interface RecordedScore {
  random_num?: number;
  slotId: number;
  score: number;
  enteredAt: string;
  qr_payload: string
}

export type ScoreKey = {
  slot_id: number;
  question_no: number;
};

export interface DraftScore {
  id: number;
  bag_id: number;
  booklet_id: number;
  subject_id: number;
  question_no: number;
  slot_id: number;
  grader_id: number;
  score: string;
  status: string;
  created_at: string;
  updated_at: string;
  bag_no: number;
  payload: string;
  random_num: string;
  status_slot: string;
}

export const useGradingStation = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // --- 1. Slices ---

  const user = useAppSelector(selectCurrentUser);
  console.log("Current user:", user);
  const activeCampaign = useAppSelector(selectActiveCampaign);

  // --- Local grading state (เดิมอยู่ใน Redux grading.slice) ---
  const [lastSlotId, setLastSlotId] = useState<number | null>(null);
  const [bagNo, setBagNo] = useState<number | null>(null);
  const [records, setRecords] = useState<GradingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [random_number , setRandom_number] = useState<number | null>(null);
  const [IsScanned, setIsScanned] = useState(false);

  const QRActive = useAppSelector(selectQrActiveCampaign);

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
    console.log("bagNo =", bagNo);
  }, [gradersAssignment, bagNo]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

  // Track initial loading status
  useEffect(() => {
    if (gradersStatus === "succeeded" || gradersStatus === "failed") {
      setIsInitialLoading(false);
    }
  }, [gradersStatus]);

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
  const [draftScores, setDraftScores] = useState<DraftScore[]>([]);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [questionNo, setQuestionNo] = useState<number>(null);
  const [questionMaxScore, setQuestionMaxScore] = useState<number>(null);
  const [currentBagId, setCurrentBagId] = useState<number | null>(null);

  console.log(questionNo, questionMaxScore)

  // --- 6. Error -> toast ---
  useEffect(() => {
    if (gradingError) {
      setGradingError(null);
    }
  }, [gradingError, toast]);

  // --- Local API helpers (แทน thunks) ---
  const fetchRecords = useCallback(async (graderId: number) => {
    setIsLoading(true);
    setGradingError(null);
    try {
      const res = await axios.get(`/api/gradingscore/record/${graderId}`);
      const mapped: GradingRecord[] = res.data.map((r: any) => ({
        slotId: r.slot_id,
        score: r.score,
        qr_payload: r.qr_payload,
        enteredAt: new Date(r.enteredAT).toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        random_num: r.random_num,
      }));
      setRecords(mapped);
      return mapped;
    } catch (error: any) {
      const msg = error.response?.data?.message || "ไม่สามารถดึงประวัติคะแนนได้";
      setGradingError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyAndAllocate = useCallback(
    async (payload: PayloadSlot): Promise<{ slotId: number; bagNo: number }> => {
      setGradingError(null);
      try {
        const res = await axios.post("/api/gradingslots/verify", payload);
        setLastSlotId(res.data.slotId);
        setBagNo(res.data.bagNo);
        setIsScanned(true);
        setRandom_number(res.data.random_num);
        return res.data;
      } catch (error: any) {
        const msg =
          error.response?.data?.message || "ไม่สามารถสร้าง Slot การตรวจได้";
        setGradingError(msg);
        throw new Error(msg);
      }
    },
    []
  );

  const submitScore = useCallback(async (payload: PayloadScore) => {
    setIsLoading(true);
    setGradingError(null);
    try {
      const res = await axios.post("/api/gradingdraft/save", payload);
      return res.data as { slotId: number; score: number };
    } catch (error: any) {
      const msg = error.response?.data?.message || "ไม่สามารถบันทึกคะแนนได้";
      setGradingError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

const fetchDraftScores = useCallback(async (graderId: number) => {
  setIsDraftLoading(true);
  try {
    const res = await axios.get(`/api/gradingdraft/unconfirmed/${graderId}`);
    console.log("Fetched draft scores:", res.data);

    const bagId =
      typeof res.data?.data?.bag_id === "number" ? res.data.data.bag_id : null;

    const drafts = Array.isArray(res.data?.data?.drafts)
      ? res.data.data.drafts
      : [];

    setCurrentBagId(bagId);
    setDraftScores(drafts);
  } catch (error: any) {
    console.error("Failed to fetch draft scores:", error);
    setCurrentBagId(null);
    setDraftScores([]);
  } finally {
    setIsDraftLoading(false);
  }
}, []);

 const confirmAllDraftScores = useCallback(
  async (graderId: number, editedScores: Record<string, string>) => {
    setIsDraftLoading(true);

    try {
      const scores = Object.entries(editedScores)
        .map(([key, score]) => {
          let parsedKey: ScoreKey;

          try {
            parsedKey = JSON.parse(key) as ScoreKey;
          } catch {
            return null;
          }

          const slot_id = Number(parsedKey.slot_id);
          const question_no = Number(parsedKey.question_no);
          const numericScore = Number(score);

          if (
            !Number.isFinite(slot_id) ||
            !Number.isFinite(question_no) ||
            !Number.isFinite(numericScore) ||
            !Number.isFinite(currentBagId)
          ) {
            return null;
          }

          return {
            slot_id,
            question_no,
            score: numericScore,
          };
        })
        .filter(
          (
            item
          ): item is { slot_id: number; question_no: number; score: number } =>
            item !== null
        );

      if (scores.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "ยังไม่มีคะแนนที่ยืนยันได้",
          text: "กรุณาตรวจสอบข้อมูลคะแนนอีกครั้ง",
        });
        return;
      }

      await axios.post(`/api/gradingdraft/confirm-bag`, { graderId, scores, bagId: currentBagId });
      await fetchDraftScores(graderId);

      await Swal.fire({
        icon: "success",
        title: "ยืนยันคะแนนทั้งหมดสำเร็จ!",
      });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "ยืนยันคะแนนไม่สำเร็จ",
        text: error.response?.data?.message || "เกิดข้อผิดพลาด",
      });
    } finally {
      setIsDraftLoading(false);
    }
  },
  [fetchDraftScores, currentBagId]
);

  const clearLocalGradingState = useCallback(() => {
    setLastSlotId(null);
    setBagNo(null);
    setRandom_number(null);
    setRecords([]);
    setGradingError(null);
    setIsLoading(false);
    setIsScanned(false);
  }, []);

  // --- Reset เมื่อ user เปลี่ยน (แก้บั๊ก state ค้างหลัง logout/login) ---
  const prevUserIdRef = useRef(user?.id);
  useEffect(() => {
    if (prevUserIdRef.current !== user?.id) {
      clearLocalGradingState();
      prevUserIdRef.current = user?.id;
    }
  }, [user?.id, clearLocalGradingState]);

  // --- 7. Fetch records for recent list ---
  useEffect(() => {
    if (activeAssignment?.grader_id) {
      fetchRecords(activeAssignment.grader_id).catch(() => {});
      fetchDraftScores(activeAssignment.grader_id).catch(() => {});
    }
  }, [activeAssignment?.grader_id, fetchRecords, fetchDraftScores]);

  useEffect(() => {
    if (records && records.length > 0) {
      console.log("Fetched grading records:", records);
      setRecent(
        records
          .slice(0, 5)
          .map((r) => ({
            random_num: r.random_num,
            slotId: r.slotId ?? 0,
            score: r.score,
            qr_payload:
              r.qr_payload.length > 50
                ? r.qr_payload.slice(0, 50) + "..."
                : r.qr_payload,
            enteredAt: r.enteredAt ?? new Date().toISOString()
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

    if (!questionNo) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เลือกข้อ",
        text: "กรุณาเลือกข้อคำถามก่อนดำเนินการต่อ",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (now - lastScanRef.current < cooldownMs) return;
    lastScanRef.current = now;

    if (!activeAssignment || !graderProfile) return;

    setScannerEnabled(false);
    setPause(true);

    try {
      const result = await verifyAndAllocate({
        qrPayload: value,
        campaignId: Number(DeleteCamp(activeCampaign.id)),
        graderId: graderProfile.grader_id,
        questionNo: questionNo,
      });
      console.log("verifyAndAllocate result:", result);
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "สแกนไม่สำเร็จ",
        text: err.message || "เกิดข้อผิดพลาดในการตรวจสอบ QR",
      });
      return;
    }

    setScanData(value ?? null);

    await Swal.fire({
      icon: "success",
      title: "สแกนสำเร็จ",
      text: `พบรหัสผู้เข้าสอบ: ${value ?? "ไม่ระบุ"}`,
      timer: 1500,
      showConfirmButton: false,
    });

    if (pauseAfterSuccess) return;

    setTimeout(() => {
      setPause(false);
      setScannerEnabled(true);
    }, cooldownMs);
  };

  const handleClear = () => {
    clearLocalGradingState();
    setManualPayload("");
    setScanData(null);
    setPause(false);
    setScannerEnabled(true);
    setScore("");
    // setQuestionNo(null);
    // setQuestionMaxScore(null);
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

  // const handleConfirmScore = () => {

  //   //console.log( scanData , user,  activeAssignment , score)
  //   if (!scanData || !user || !activeAssignment || !score) {
  //     Swal.fire({
  //       icon: "error",
  //       title: "ข้อมูลไม่ครบ",
  //       text: "กรุณาสแกน QR, ตรวจสอบโปรไฟล์ผู้ตรวจ และกรอกคะแนนก่อน",
  //     });
  //     return;
  //   }


  //   setIsConfirmOpen(true);
  // };

  const handleSaveScore = async () => {
    console.log("TEST SAVE SCORE")
    if (!scanData || !user || !activeAssignment || !score) {
      setIsConfirmOpen(false);
      return;
    }
    if (questionMaxScore !== null && Number(score) > questionMaxScore) {
      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถบันทึกคะแนนได้",
        html: `
  <div style="text-align:left; line-height:1.8;">
    <div>
    เนื่องจากคะแนนที่กรอกสูงกว่าคะแนนเต็มของข้อที่เลือกไว้
    </div>

    <hr style="margin:10px 0;" />

    <div>ข้อ: <strong>${questionNo}</strong></div>
    <div>รายวิชา: <strong>${activeAssignment.subject_name}</strong></div>
    <div>หัวข้อ: <strong>${activeAssignment.question_label}</strong></div>

  </div>
`
        ,
        confirmButtonText: "ตกลง",
      });
      return;
    }

    if (questionMaxScore !== null && Number(score) < 0) {
      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถบันทึกคะแนนได้",
        html: `
  <div style="text-align:left; line-height:1.8;">
    <div>
    เนื่องจากคะแนนที่กรอกติดลบ กรุณากรอกคะแนนใหม่
    </div>

    <hr style="margin:10px 0;" />

    <div>ข้อ: <strong>${questionNo}</strong></div>
    <div>รายวิชา: <strong>${activeAssignment.subject_name}</strong></div>
    <div>หัวข้อ: <strong>${activeAssignment.question_label}</strong></div>

  </div>
`
        ,
        confirmButtonText: "ตกลง",
      });
      return;
    }


    const confirmResult = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการบันทึกคะแนน?",
html: `
  <div style="text-align:left; line-height:1.8;">
    <div>ข้อที่: <strong>${questionNo}</strong></div>
    <div>คะแนนที่บันทึก: <strong>${score}</strong> คะแนน</div>
    <div>รายวิชา: <strong>${activeAssignment.subject_name}</strong></div>
    <div>หัวข้อ: <strong>${activeAssignment.question_label}</strong></div>
    <div>เลขประจำถุง: <strong>${bagNo}</strong></div>
    <div>รหัสจัดเก็บ: <strong>${random_number}</strong></div>

  </div>
`
,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    const payload: PayloadScore = {
      slotId: lastSlotId,
      qrPayload: scanData,
      campaignId: activeAssignment.campaign_id,
      graderId: activeAssignment.grader_id,
      score: Number(score),
      question_no: questionNo,
    };

    try {
      const result = await submitScore(payload);
      console.log("submitScore result:", result);

      // const record: RecordedScore = {
      //   slotId: lastSlotId,
      //   score: Number(score),
      //  enteredAt: new Date().toISOString(),
      //   qr_payload: scanData
      // };

      //setRecent((prev) => [record, ...prev].slice(0, 6));
      setScanData(null);
      setScore("");
      setIsScanned(false);
      setManualPayload("");


      await fetchRecords(activeAssignment.grader_id);
      await fetchDraftScores(activeAssignment.grader_id);

      await Swal.fire({
        icon: "success",
        title: "บันทึกคะแนนสำเร็จ!",
        html: `
  <div style="text-align:left; line-height:1.8;">
    <div>ข้อที่: <strong>${questionNo}</strong></div>
    <div>คะแนนที่บันทึก: <strong>${score}</strong> คะแนน</div>
    <div>รายวิชา: <strong>${activeAssignment.subject_name}</strong></div>
    <div>หัวข้อ: <strong>${activeAssignment.question_label}</strong></div>
    <div>เลขประจำถุง: <strong>${bagNo}</strong></div>
    <div>รหัส Slot: <strong>${lastSlotId}</strong></div>

  </div>
`,
      });

      if (pauseAfterSuccess) {
        setPause(false);
        setScannerEnabled(true);
      }

   //   handleClear();
    } catch (error: any) {
      console.error("Failed to save score:", error);
      await Swal.fire({
        icon: "error",
        title: "บันทึกคะแนนไม่สำเร็จ",
        text: error.message || "เกิดข้อผิดพลาด",
      });
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const toggleScanner = () => {
    // dispatch(clearGradingState());
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
    isInitialLoading,
    gradersAssignment,
    scanData,
    score,
    manualPayload,
    recent,
    scannerEnabled,
    questionNo,
    setQuestionNo,
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
    //handleConfirmScore,
    handleSaveScore,
    handleScan,
    closeConfirmModal,
    setQuestionMaxScore,
    questionMaxScore,

    bagNo,
    lastSlotId,
    QRActive,

    IsScanned,
    random_number,

    draftScores,
    isDraftLoading,
    confirmAllDraftScores,
    fetchDraftScores,
  };
};