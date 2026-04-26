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
import { selectActiveCampaign, selectQrActiveCampaign } from "@/store/slices/examData.slice";
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
  booklet_id: number;
  slot_id: number | null;
  question_no: number | null;
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

type PreviewStartResponse = {
  canStart: boolean;
  bagId: number;
  bagNo: number;
  bookletId: number;
  random_num: string | number;
  examCode: string | number;
  subjectId: number;
  subjectName: string;
  questionNo: number;
  questionLabel?: string | null;
  graderId: number;
  totalBooklets: number;
  min_random: number;
  max_random: number;
  message: string;
};


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
  const [random_number, setRandom_number] = useState<number | null>(null);
  const [IsScanned, setIsScanned] = useState(false);
  const [IsHasbag, setIsHasbag] = useState(false);

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
  const [draftBagInfo, setDraftBagInfo] = useState<{
    subject_name: string | null;
    question_label: string | null;
    question_no: number | null;
    bag_no?: number | null;
    min_random?: number | null;
    max_random?: number | null;
  }>({ subject_name: null, question_label: null, question_no: null });
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [questionNo, setQuestionNo] = useState<number>(null);
  //const [questionMaxScore, setQuestionMaxScore] = useState<number>(null);
  const [currentBagId, setCurrentBagId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<PreviewStartResponse | null>(null);

  //console.log(questionNo, questionMaxScore)

  // --- Derive max score from current question + assignments ---
  // แยกออกจาก fetchDraftScores เพราะ useCallback deps [] ทำให้ closure ไม่เห็น
  // gradersAssignment ล่าสุด (เคสรีเฟรชหน้าแล้ว Redux ยังโหลดไม่เสร็จ)
  // useEffect(() => {
  //   if (questionNo == null || gradersAssignment.length === 0) return;
  //   const ma = gradersAssignment.find(
  //     (a) => a.question_no === questionNo
  //   )?.max_score;
  //   if (ma != null) setQuestionMaxScore(ma);
  // }, [questionNo, gradersAssignment]);

  const questionMaxScore = useMemo(() => {
    if (questionNo == null || gradersAssignment.length === 0) return null;

    return (
      gradersAssignment.find((a) => a.question_no === questionNo)?.max_score ?? null
    );
  }, [questionNo, gradersAssignment]);

  // --- 6. Error -> toast ---
  useEffect(() => {
    if (gradingError) {
      setGradingError(null);
    }
  }, [gradingError, toast]);

  // --- Local API helpers (แทน thunks) ---
  // const fetchRecords = useCallback(async (graderId: number) => {
  //   setIsLoading(true);
  //   setGradingError(null);
  //   try {
  //     const res = await axios.get(`/api/gradingscore/record/${graderId}`);
  //     const mapped: GradingRecord[] = res.data.map((r: any) => ({
  //       slotId: r.slot_id,
  //       score: r.score,
  //       qr_payload: r.qr_payload,
  //       enteredAt: new Date(r.enteredAT).toLocaleString("th-TH", {
  //         timeZone: "Asia/Bangkok",
  //         year: "numeric",
  //         month: "2-digit",
  //         day: "2-digit",
  //         hour: "2-digit",
  //         minute: "2-digit",
  //         second: "2-digit",
  //       }),
  //       random_num: r.random_num,
  //     }));
  //     setRecords(mapped);
  //     return mapped;
  //   } catch (error: any) {
  //     const msg = error.response?.data?.message || "ไม่สามารถดึงประวัติคะแนนได้";
  //     setGradingError(msg);
  //     throw new Error(msg);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);

  const previewStart = useCallback(
    async (payload: PayloadSlot): Promise<PreviewStartResponse> => {
      setGradingError(null);
      try {
        const res = await axios.post("/api/gradingslots/preview-start", payload);
        return res.data;
      } catch (error: any) {
        const msg =
          error.response?.data?.message || "ไม่สามารถตรวจสอบข้อมูลก่อนเริ่มตรวจได้";
        setGradingError(msg);
        throw new Error(msg);
      }
    },
    []
  );

  const confirmStart = useCallback(
    async (payload: PayloadSlot): Promise<{ slotId: number; bagNo: number; random_num: number, isUpdate: boolean }> => {
      setGradingError(null);
      try {
        const res = await axios.post("/api/gradingslots/confirm-start", payload);
        setLastSlotId(res.data.slotId);
        setBagNo(res.data.bagNo);
        setIsScanned(true);
        setRandom_number(res.data.random_num);
        return res.data;
      } catch (error: any) {
        const msg =
          error.response?.data?.message || "ไม่สามารถเริ่มตรวจและสร้าง Slot ได้";
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
      setDraftBagInfo({
        subject_name: res.data?.data?.subject_name ?? null,
        question_label: res.data?.data?.question_label ?? null,
        bag_no: typeof res.data?.data?.bag_no === "number" ? res.data.data.bag_no : null,
        min_random: typeof res.data?.data?.min_random === "number" ? res.data.data.min_random : null,
        max_random: typeof res.data?.data?.max_random === "number" ? res.data.data.max_random : null,
        question_no:
          typeof res.data?.data?.question_no === "number"
            ? res.data.data.question_no
            : null,
      });
      if (bagId) {
        setIsHasbag(true);
        setQuestionNo(res.data?.data?.question_no ?? null);
      }


    } catch (error: any) {
      console.error("Failed to fetch draft scores:", error);
      setCurrentBagId(null);
      setDraftScores([]);
      setDraftBagInfo({ subject_name: null, question_label: null, question_no: null });
    } finally {
      setIsDraftLoading(false);
    }
  }, []);

  const confirmAllDraftScores = useCallback(
    async (graderId: number, editedScores: Record<string, string>) => {
      setIsDraftLoading(true);
      setScannerEnabled(false);
      console.log("Confirming all draft scores with editedScores:", editedScores);
      try {
        const hasDecimalScore = Object.values(editedScores).some((value) => {
          const trimmed = String(value).trim();
          const n = Number(trimmed);
          return trimmed !== "" && Number.isFinite(n) && !Number.isInteger(n);
        });

        const countDraftScores = Object.keys(editedScores).length;
        const countAllBooklets = draftScores.length;

        if (countDraftScores !== countAllBooklets) {

          await Swal.fire({
            icon: "error",
            title: "ยืนยันคะแนนไม่ได้",
            text: "กรุณาตรวจข้อสอบให้ครบทุกเล่มก่อนยืนยันคะแนนทั้งหมด",
            confirmButtonText: "ตกลง",
          });
          return;
        }
        const hasEmptyScore = Object.values(editedScores).some(
          (v) => String(v).trim() === ""
        );

        if (hasEmptyScore) {
          await Swal.fire({
            icon: "error",
            title: "ยืนยันคะแนนไม่ได้",
            text: "กรุณากรอกคะแนนให้ครบทุกช่อง",
            confirmButtonText: "ตกลง",
          });
          return;
        }
        if (hasDecimalScore) {
          await Swal.fire({
            icon: "error",
            title: "ยืนยันคะแนนไม่ได้",
            text: "คะแนนต้องเป็นจำนวนเต็มเท่านั้น กรุณาตรวจสอบอีกครั้ง",
            confirmButtonText: "ตกลง",
          });
          return;
        }



        const exceededRows = draftScores
          .map((item) => {
            const key = JSON.stringify({
              booklet_id: Number(item.booklet_id),
              slot_id: item.slot_id ?? null,
              question_no: item.question_no ?? null,
            });

            const rawValue =
              editedScores[key] ?? (item.score != null ? String(item.score) : "");

            const trimmed = String(rawValue).trim();
            const score = Number(trimmed);

            if (
              trimmed === "" ||
              !Number.isFinite(score) ||
              questionMaxScore === null ||
              score <= questionMaxScore
            ) {
              return null;
            }

            return {
              random_num: item.random_num,
              score,
            };
          })
          .filter(
            (item): item is { random_num: string; score: number } => item !== null
          );

        if (exceededRows.length > 0) {
          const listHtml = exceededRows
            .map(
              (item) => `
        <li style="margin-bottom:6px;">
          ลำดับจัดเก็บ <strong>${item.random_num}</strong>
          : <strong>${item.score}</strong> คะแนน
        </li>
      `
            )
            .join("");

          await Swal.fire({
            icon: "error",
            title: "ไม่สามารถยืนยันคะแนนได้",
            html: `
      <div style="text-align:left; line-height:1.8;">
        <div>พบคะแนนที่เกินคะแนนเต็ม ${questionMaxScore} คะแนน ดังนี้</div>
        <ul style="margin-top:10px; padding-left:20px;">
          ${listHtml}
        </ul>
      </div>
    `,
            confirmButtonText: "ตกลง",
          });
          return;
        }

        const scores = Object.entries(editedScores)
          .map(([key, score]) => {
            let parsedKey: ScoreKey;

            try {
              parsedKey = JSON.parse(key) as ScoreKey;
            } catch {
              return null;
            }

            const slot_id =
              parsedKey.slot_id != null ? Number(parsedKey.slot_id) : NaN;
            const question_no =
              parsedKey.question_no != null ? Number(parsedKey.question_no) : NaN;
            const trimmedScore = String(score).trim();
            const numericScore = Number(trimmedScore);

            if (
              !Number.isFinite(slot_id) ||
              !Number.isFinite(question_no) ||
              !Number.isFinite(numericScore) ||
              !Number.isInteger(numericScore) ||
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


        const randomNums = draftScores
          .map((d) => Number(d.random_num))
          .filter((n) => Number.isFinite(n));
        const minRandom = randomNums.length > 0 ? Math.min(...randomNums) : null;
        const maxRandom = randomNums.length > 0 ? Math.max(...randomNums) : null;
        const rangeText =
          minRandom != null && maxRandom != null
            ? `${minRandom} - ${maxRandom}`
            : "-";

        const snapshotDraftScores = structuredClone(draftScores);
        const snapshotEditedScores = { ...editedScores };
        //const snapshotBagInfo = structuredClone(draftBagInfo);

        const scoreTableHtml = snapshotDraftScores
          .map((item, index) => {
            const key = JSON.stringify({
              booklet_id: Number(item.booklet_id),
              slot_id: item.slot_id ?? null,
              question_no: item.question_no ?? null,
            });

            const scoreValue =
              snapshotEditedScores[key] ??
              (item.score != null ? String(parseInt(String(item.score), 10)) : "-");

            return `
      <tr>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">${index + 1}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">${item.random_num ?? "-"}</td>
        <td style="border:1px solid #ddd; padding:6px; text-align:center;">${scoreValue}</td>
      </tr>
    `;
          })
          .join("");
        const ok = await Swal.fire({
          icon: "question",
          title: "ยืนยันการบันทึกคะแนนทั้งหมด?",
          html: `
    <div style="text-align:left; line-height:1.8;">  
      <div>วิชา: <strong>${draftBagInfo.subject_name ?? "-"}</strong></div>
      <div>ข้อ: <strong>${draftBagInfo.question_no ?? "-"}</strong></div>
      <div>หัวข้อสอบ: <strong>${draftBagInfo.question_label ?? "-"
            }</strong></div>
      <div>เลขประจำถุง: <strong>${draftBagInfo.bag_no ?? "-"}</strong></div>
      <div>ช่วงรหัสจัดเก็บในถุง: <strong>${rangeText}</strong></div>
    </div>

    <hr/>

    <div style="max-height:250px; overflow:auto;">
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="border:1px solid #ddd; padding:6px;">ลำดับ</th>
            <th style="border:1px solid #ddd; padding:6px;">ลำดับจัดเก็บ</th>
            <th style="border:1px solid #ddd; padding:6px;">คะแนน</th>
          </tr>
        </thead>
        <tbody>
          ${scoreTableHtml}
        </tbody>
      </table>
    </div>
  `,
          showCancelButton: true,
          confirmButtonText: "ยืนยัน",
          cancelButtonText: "ยกเลิก",
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
        });

        if (!ok.isConfirmed) {
          return;
        }
        console.log("Confirmed scores to submit:", currentBagId);



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
        setScannerEnabled(true);
      }
    },
    [fetchDraftScores, currentBagId, draftScores, draftBagInfo]
  );
  //Old [fetchDraftScores, currentBagId]

  const issueScoreFormPdf = useCallback(async () => {
  if (!currentBagId || !activeAssignment?.grader_id) {
    await Swal.fire({
      icon: "warning",
      title: "ไม่สามารถออกใบกรอกคะแนนได้",
      text: "ไม่พบถุงหรือผู้ตรวจที่ใช้งานอยู่",
      confirmButtonText: "ตกลง",
    });
    return;
  }
  Swal.fire({
    title: "กำลังสร้าง PDF...",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    const res = await axios.get(
      `/api/graders/bags/${currentBagId}/manual-payload/${activeAssignment.grader_id}/pdf`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (error: any) {
    let message = "เกิดข้อผิดพลาด";

    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        message = parsed?.message ?? message;
      } catch {}
    } else {
      message = error.response?.data?.message ?? error.message ?? message;
    }

    await Swal.fire({
      icon: "error",
      title: "ออกใบกรอกคะแนนไม่สำเร็จ",
      text: message,
      confirmButtonText: "ตกลง",
    });
  } finally {
    Swal.close();
  }
}, [currentBagId, activeAssignment?.grader_id]);

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
      // fetchRecords(activeAssignment.grader_id).catch(() => {});
      fetchDraftScores(activeAssignment.grader_id).catch(() => { });
    }
  }, [activeAssignment?.grader_id, fetchDraftScores]);
  //fetchRecords

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

    if (!activeAssignment || !graderProfile || !activeCampaign?.id) return;

    setScannerEnabled(false);
    setPause(true);

    const requestPayload: PayloadSlot = {
      qrPayload: value,
      campaignId: Number(DeleteCamp(activeCampaign.id)),
      graderId: graderProfile.grader_id,
      questionNo: questionNo,
    };

    try {
      const hasActiveDraft = currentBagId !== null && draftScores.length > 0;

      if (!hasActiveDraft) {
        const preview = await previewStart(requestPayload);
        setPreviewData(preview);

        const result = await Swal.fire({
          icon: "question",
          title: "ยืนยันเริ่มตรวจ",
          html: `
          <div style="text-align:left; line-height:1.8;">
            <div>ถุงที่: <strong>${preview.bagNo}</strong></div>
            <div>วิชา: <strong>${preview.subjectName}</strong></div>
            <div>ข้อที่: <strong>${preview.questionNo}</strong></div>
            <div>หัวข้อ: <strong>${preview.questionLabel ?? "-"}</strong></div>
            <div>จำนวนเล่มในถุง: <strong>${preview.totalBooklets}</strong></div>
            <div>รหัสจัดเก็บ: <strong>${preview.min_random} - ${preview.max_random}</strong></div>
          </div>
        `,
          showCancelButton: true,
          confirmButtonText: "เริ่มตรวจ",
          cancelButtonText: "ยกเลิก",
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
        });

        if (!result.isConfirmed) {
          setPause(false);
          setScannerEnabled(true);
          return;
        }

      }

      // มี draft อยู่แล้ว หรือเพิ่ง preview ผ่าน -> ค่อย confirm start
      const confirmed = await confirmStart(requestPayload);
      console.log("confirmStart result:", confirmed);

      setScanData(value ?? null);
      await fetchDraftScores(activeAssignment.grader_id);

      if (confirmed.isUpdate) {
        const result = await Swal.fire({
          icon: "warning",
          title: "คุณให้คะแนนข้อสอบเล่มนี้ไปแล้ว",
          text: "กรุณากด ยืนยัน เพื่อแก้ไขคะแนน หรือ ยกเลิก เพื่อสแกนเล่มอื่น",
          showCancelButton: true,
          confirmButtonText: "ยืนยัน",
          cancelButtonText: "ยกเลิก",
        })
        if (!result.isConfirmed) {
          setScanData(null);
          setScore("");
          setIsScanned(false);
          setManualPayload("");
          return;
        }

      }



      const scoreResult = await Swal.fire({
        icon: "question",
        title: "กรอกคะแนน",
        html: `
  <div style="text-align:left; font-size:16px; line-height:1.6;">
    
    <div style="margin-bottom:14px;">
      <div style="color:#666; font-size:14px;">Payload</div>
      <strong style="color:#222; font-size:18px;">
        ${value?.length > 25 ? value.slice(0, 25) + "..." : value ?? "-"}
      </strong>
    </div>

    <hr style="border:none; border-top:1px solid #eee; margin:12px 0;" />

    <div style="display:grid; grid-template-columns: 140px 1fr; row-gap:10px; column-gap:10px;">

      <div style="color:#666;">ข้อที่</div>
      <div><strong style="font-size:17px;">${questionNo}</strong></div>

      <div style="color:#666;">รายวิชา</div>
      <div><strong style="font-size:17px;">${activeAssignment.subject_name ?? "-"}</strong></div>

      <div style="color:#666;">หัวข้อ</div>
      <div><strong style="font-size:17px;">${activeAssignment.question_label ?? "-"}</strong></div>

      <div style="color:#666;">เลขประจำถุง</div>
      <div><strong style="font-size:17px;">${confirmed.bagNo ?? "-"}</strong></div>

      <div style="color:#666;">รหัสจัดเก็บ</div>
      <div><strong style="font-size:17px;">${confirmed.random_num ?? "-"}</strong></div>

      <div style="color:#666;">คะแนนเต็ม</div>
      <div>
        <strong style="font-size:18px; ">
          ${questionMaxScore ?? "-"}
        </strong>
      </div>
          <div style="margin-bottom:8px; font-weight:600;">
      กรุณากรอกคะแนน
    </div>

    </div>

  </div>
`,
        input: "number",
        inputAttributes: {
          min: "0",
          step: "1",
          inputmode: "numeric",
          style: "font-size:18px; padding:8px;"
        },
        inputValidator: (v) => {
          const raw = String(v ?? "").trim();
          if (raw === "") return "กรุณากรอกคะแนน";
          if (!/^\d+$/.test(raw))
            return "คะแนนต้องเป็นจำนวนเต็มบวก ห้ามมีเครื่องหมาย/จุดทศนิยม";
          const n = Number(raw);
          if (!Number.isFinite(n)) return "กรุณากรอกเป็นตัวเลข";
          if (questionMaxScore !== null && n > questionMaxScore)
            return `คะแนนต้องไม่เกินคะแนนเต็ม (${questionMaxScore})`;
          return null;
        },
        showCancelButton: true,
        confirmButtonText: "บันทึกคะแนน",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        allowOutsideClick: false,
      });

      if (!scoreResult.isConfirmed) {
        setPause(false);
        setScannerEnabled(true);
        return;
      }

      const enteredScore = Number(scoreResult.value);
      setScore(String(enteredScore));

      const payload: PayloadScore = {
        slotId: confirmed.slotId,
        qrPayload: value,
        campaignId: activeAssignment.campaign_id,
        graderId: activeAssignment.grader_id,
        score: enteredScore,
        question_no: questionNo,
      };

      try {
        await submitScore(payload);

        setScanData(null);
        setScore("");
        setIsScanned(false);
        setManualPayload("");

        await fetchDraftScores(activeAssignment.grader_id);

        await Swal.fire({
          icon: "success",
          title: "บันทึกคะแนนสำเร็จ!",
          html: `
            <div style="text-align:left; line-height:1.8;">
              <div>ข้อที่: <strong>${questionNo}</strong></div>
              <div>คะแนนที่บันทึก: <strong>${enteredScore}</strong> คะแนน</div>
              <div>รายวิชา: <strong>${activeAssignment.subject_name ?? "-"}</strong></div>
              <div>หัวข้อ: <strong>${activeAssignment.question_label ?? "-"}</strong></div>
              <div>เลขประจำถุง: <strong>${confirmed.bagNo ?? "-"}</strong></div>
              <div>รหัสจัดเก็บ: <strong>${confirmed.random_num ?? "-"}</strong></div>
            </div>
          `,
          timer: 1500,
          showConfirmButton: false,
        });

        setPause(false);
        setScannerEnabled(true);
      } catch (saveErr: any) {
        console.error("Failed to save score:", saveErr);
        await Swal.fire({
          icon: "error",
          title: "บันทึกคะแนนไม่สำเร็จ",
          text: saveErr.message || "เกิดข้อผิดพลาด",
        });
        setPause(false);
        setScannerEnabled(true);
      }
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "สแกนไม่สำเร็จ",
        text: err.message || "เกิดข้อผิดพลาดในการตรวจสอบ QR",
        confirmButtonText: "ตกลง",
      });

      setPause(false);
      // setScannerEnabled(true);
    }
    finally {
      setPause(false);
      setScannerEnabled(true);
      // lastScanRef.current = 0;
    }
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
    if (!/^\d+$/.test(String(score).trim())) {
      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถบันทึกคะแนนได้",
        text: "คะแนนต้องเป็นจำนวนเต็มบวก ห้ามมีเครื่องหมาย/จุดทศนิยม",
        confirmButtonText: "ตกลง",
      });
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

    if (!Number.isInteger(Number(score))) {
      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถบันทึกคะแนนได้",
        text: "กรุณากรอกคะแนนเป็นจำนวนเต็มเท่านั้น",
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


      // await fetchRecords(activeAssignment.grader_id);
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
    <div>เลขประจำถุง: <strong>${draftBagInfo.bag_no ?? "-"}</strong></div>
    <div>ลำดับจัดเก็บ: <strong>${random_number ?? "-"}</strong></div>

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
    questionMaxScore,

    bagNo,
    lastSlotId,
    QRActive,

    IsScanned,
    random_number,

    draftScores,
    draftBagInfo,
    isDraftLoading,
    confirmAllDraftScores,
    fetchDraftScores,


    IsHasbag,

    issueScoreFormPdf
  };
};