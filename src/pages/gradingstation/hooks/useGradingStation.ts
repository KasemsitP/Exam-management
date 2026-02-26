// hooks/useGradingStation.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector, useAppDispatch } from "@/store/hook";
import Swal from "sweetalert2";

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
  gradingSlice,
  selectBagNo,
  clearGradingState,
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

export const useGradingStation = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // --- 1. Slices ---

  const user = useAppSelector(selectCurrentUser);
  console.log("Current user:", user);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const lastSlotId = useAppSelector(selectLastSlotId);
  const records = useAppSelector(selectGradingRecords);

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

  const bagNo = useAppSelector(selectBagNo);

  useEffect(() => {
    console.log("gradersAssignment =", gradersAssignment);
    console.log("bagNo =", bagNo);
  }, [gradersAssignment]);

  const isLoading = useAppSelector(selectIsGradingLoading);
  const gradingError = useAppSelector(selectGradingError);
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
  const [questionNo, setQuestionNo] = useState<number>(null);
  const [questionMaxScore, setQuestionMaxScore] = useState<number>(null);

  console.log(questionNo, questionMaxScore)

  // --- 6. Error -> toast ---
  useEffect(() => {
    if (gradingError) {
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

    const result = await dispatch(
      verifyAndAllocateThunk({
        qrPayload: value,
        campaignId: Number(DeleteCamp(activeCampaign.id)),
        graderId: graderProfile.grader_id,
        questionNo: questionNo,
      })
    );
    console.log("verifyAndAllocate result:", result);

    if (verifyAndAllocateThunk.rejected.match(result)) {
      await Swal.fire({
        icon: "error",
        title: "สแกนไม่สำเร็จ",
        text: result.payload || result.error?.message || "เกิดข้อผิดพลาดในการตรวจสอบ QR",
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
    dispatch(clearGradingState());
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

    setScannerEnabled(false);
    setPause(true);
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
    <div>รหัส Slot: <strong>${lastSlotId}</strong></div>

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
      const resultAction = await dispatch(submitScoreThunk(payload));

      if (resultAction.type.endsWith("/rejected")) {
        const errorPayload = resultAction.payload as string;
        throw new Error(errorPayload);
      }

      const result = resultAction.payload as {
        slotId: number;
        score: number;
      };

      const record: RecordedScore = {
        slotId: lastSlotId,
        score: Number(score),
       enteredAt: new Date().toISOString(),
        qr_payload: scanData
      };

      //setRecent((prev) => [record, ...prev].slice(0, 6));
      setScanData(null);
      setScore("");


      await dispatch(fetchRecordThunk(activeAssignment.grader_id)).unwrap();

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
    QRActive
  };
};