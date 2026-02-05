// src/pages/.../BagScoresPage.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { useForm } from "react-hook-form";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import axios from "axios";
import { fetchBagsForCampaignThunk } from "@/store/slices/bags.slice";

import type {
  BagScoreBagSummary,
  BagScoresApiResponse,
  BagBookletScore,
  BagQuestionScoreRow,
} from "./types";

import Swal from "sweetalert2";

interface FormValues {
  firstKey: string;
  secondKey: string;
  otpCode?: string;
}

type ViewMode = "score" | "grader";
type DecryptStep = "keys" | "otp";

export default function BagScoresPage() {
  const dispatch = useAppDispatch();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  useAppSelector(selectActiveCampaignSessions); // แค่ให้ selector run

  const [bags, setBags] = useState<BagScoreBagSummary[]>([]);
  const [loadingBags, setLoadingBags] = useState(false);
  const [errorBags, setErrorBags] = useState<string | null>(null);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("all");
  const [selectedBagId, setSelectedBagId] = useState<number | null>(null);

  const [bagScores, setBagScores] = useState<BagScoresApiResponse | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [errorScores, setErrorScores] = useState<string | null>(null);

  const [opendecrypt, setopendecrypt] = useState<boolean>(false);

  // โหมดแสดงผลคะแนน / ชื่อผู้ตรวจ
  const [viewMode, setViewMode] = useState<ViewMode>("score");

  // ---------- form 2-FA ----------
  const { handleSubmit, register, reset, getValues } = useForm<FormValues>({
    defaultValues: { firstKey: "", secondKey: "", otpCode: "" },
  });

  const [decryptStep, setDecryptStep] = useState<DecryptStep>("keys");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number | null>(null); // seconds
  const [isDecrypted, setIsdecrypted] = useState<boolean>(false)

  const OTP_LENGTH = 6;
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // countdown เวลา OTP
  useEffect(() => {
    if (decryptStep !== "otp") return;
    if (otpExpiresIn == null) return;

    const timer = setInterval(() => {
      setOtpExpiresIn((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [decryptStep, otpExpiresIn]);

  useEffect(() => {
    if (!activeCampaign?.id) return;

    const fetchIsUnlock = async () => {
      try {
        const result = await axios.get(
          `/api/campaigns/${activeCampaign.id}/is-unlock`
        );

        console.log(result.data);
        setIsdecrypted(result.data.isUnlock)
        console.log(isDecrypted)
      } catch (err) {
        console.error(err);
      }
    };

    fetchIsUnlock();
  }, [activeCampaign?.id]);


  const formatOtpTime = (sec: number | null) => {
    if (sec == null) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  // -----------------------------
  // 1) โหลดถุงทั้งหมดของ campaign
  // -----------------------------



  const loadBagsForCampaign = async (campaignId: String) => {
    try {
      setLoadingBags(true);
      setErrorBags(null);

      const rawBags = await dispatch(
        fetchBagsForCampaignThunk(String(campaignId))
      ).unwrap();

      const mapped: BagScoreBagSummary[] = rawBags.map((b: any) => ({
        bagId: Number(b.id),
        bagNo: Number(b.bag_no),
        campaignId: Number(b.campaignId),
        sessionId: Number(b.sessionId),
        sessionLabel: b.sessionLabel,
        subjectId: b.subjectId ?? 0,
        subjectName: b.subjectName ?? "",
        status: b.status,
        scannedCount: Number(b.scannedCount ?? 0),
      }));

      setBags(mapped);
    } catch (err: any) {
      console.error(err);
      setErrorBags(err?.message ?? "โหลดข้อมูลถุงไม่สำเร็จ");
      setBags([]);
    } finally {
      setLoadingBags(false);
    }
  };

  useEffect(() => {
    if (!activeCampaign) return;
    loadBagsForCampaign((activeCampaign.id));
  }, [activeCampaign]);


  // -----------------------------
  // 2) Filter ตาม session + เลือกถุง
  // -----------------------------
  const sessionOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of bags) {
      if (!map.has(b.sessionId)) map.set(b.sessionId, b.sessionLabel);
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [bags]);

  const filteredBags = useMemo(() => {
    if (selectedSessionId === "all") return bags;
    const sid = Number(selectedSessionId);
    return bags.filter((b) => b.sessionId === sid);
  }, [bags, selectedSessionId]);

  const currentBagIndex = useMemo(() => {
    if (!selectedBagId) return -1;
    return filteredBags.findIndex((b) => b.bagId === selectedBagId);
  }, [filteredBags, selectedBagId]);

  const selectedBag =
    currentBagIndex >= 0 ? filteredBags[currentBagIndex] : null;

  // auto เลือกถุงแรกของ filter นั้น ๆ
  useEffect(() => {
    if (filteredBags.length === 0) {
      setSelectedBagId(null);
      return;
    }
    const stillExists = filteredBags.some((b) => b.bagId === selectedBagId);
    if (!selectedBagId || !stillExists) {
      setSelectedBagId(filteredBags[0].bagId);
    }
  }, [filteredBags, selectedBagId]);

  const handleNavigateBag = (direction: "prev" | "next") => {
    if (currentBagIndex === -1) return;
    let newIndex = currentBagIndex;
    if (direction === "prev") newIndex = Math.max(0, currentBagIndex - 1);
    if (direction === "next")
      newIndex = Math.min(filteredBags.length - 1, currentBagIndex + 1);

    if (newIndex !== currentBagIndex) {
      setSelectedBagId(filteredBags[newIndex].bagId);
    }
  };

  const calcDiff = (a: number | string | null | undefined, b: number | string | null | undefined) => {
    const n1 = Number(a);
    const n2 = Number(b);
    if (!Number.isFinite(n1) || !Number.isFinite(n2)) return null;
    return Math.abs(n1 - n2); // ถ้าอยากได้ signed ใช้ (n1 - n2)
  };
  // -----------------------------
  // 3) โหลดคะแนนของถุงที่เลือก
  // -----------------------------
  useEffect(() => {
    if (!selectedBagId || !activeCampaign) return;

    let cancelled = false;

    const fetchScores = async () => {
      setLoadingScores(true);
      setErrorScores(null);
      setBagScores(null);

      try {
        const res = await axios.get<BagScoresApiResponse>(
          `http://localhost:8000/api/reports/bags/${selectedBagId}/scores`,
          { params: { campaignId: activeCampaign.id } }
        );
        if (cancelled) return;
        setBagScores(res.data);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setErrorScores(
          err?.response?.data?.message ?? "โหลดคะแนนของถุงนี้ไม่สำเร็จ"
        );
        setBagScores(null);
      } finally {
        if (!cancelled) setLoadingScores(false);
      }
    };

    fetchScores();
    return () => {
      cancelled = true;
    };
  }, [selectedBagId, activeCampaign?.id]);

  // -----------------------------
  // 4) header ข้อสอบ + helper
  // -----------------------------
  const headerQuestions: { questionNo: number; label: string }[] = useMemo(() => {
    if (!bagScores || !bagScores.booklets.length) return [];
    const first = bagScores.booklets[0];

    const byNo = new Map<number, BagQuestionScoreRow>();
    for (const q of first.questions) byNo.set(q.questionNo, q);

    const maxQ =
      bagScores.questionCount || first.questionCount || first.questions.length;

    const arr: { questionNo: number; label: string }[] = [];
    for (let q = 1; q <= maxQ; q++) {
      const qRow = byNo.get(q);
      arr.push({
        questionNo: q,
        label: qRow?.label ?? `ข้อ ${q}`,
      });
    }
    return arr;
  }, [bagScores]);

  const formatScore = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return "-";
    const num = Number(v);
    if (Number.isNaN(num)) return String(v);
    return num.toFixed(2);
  };

  const calcTotalForBooklet = (bk: BagBookletScore) => {
    return bk.questions.reduce((sum, q) => {
      const v = q.finalScore;
      return sum + (v == null ? 0 : Number(v));
    }, 0);
  };

  // -----------------------------
  // 5) Logic 2-FA decrypt
  // -----------------------------
  const openDecryptModal = () => {
    setopendecrypt(true);
    setDecryptStep("keys");
    setOtpToken(null);
    setOtpEmail(null);
    setOtpExpiresIn(null);
    reset({ firstKey: "", secondKey: "", otpCode: "" });
  };

  const onSubmitDecrypt = async (values: FormValues) => {
    // console.log(values)
    if (decryptStep === "keys") {
      const { firstKey: FirstKey, secondKey: SecondKey } = values;
      if (FirstKey.length !== 16 || SecondKey.length !== 16) {
        Swal.fire({
          icon: "error",
          title: "คีย์ไม่ถูกต้อง",
          text: "กรุณากรอกคีย์ให้ครบ 16 ตัวอักษรเท่านั้น",
        });
        return;
      }

      setRequestingOtp(true);
      try {
        // NOTE: แก้ URL/field ให้ตรง backend ของคุณ
        console.log(FirstKey, SecondKey)
        const result = await axios.post(`/api/campaigns/${activeCampaign.id}/decrypt/request-otp`, {
          FirstKey,
          SecondKey,
        });

        if (result.data?.success) {
          setDecryptStep("otp");
          setOtpToken(result.data.otpToken || null);
          setOtpEmail(result.data.email || null);
          setOtpExpiresIn(result.data.expiresInSeconds ?? 300); // fallback 5 นาที
          console.log(result.data)

          Swal.fire({
            icon: "success",
            title: "ส่งรหัสยืนยันแล้ว",
            text:
              result.data.message ||
              "กรุณาตรวจสอบรหัสจากอีเมลของคุณ แล้วกรอกด้านล่าง",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "ขอรหัสยืนยันไม่สำเร็จ",
            text: result.data?.message || "ไม่สามารถสร้างรหัสได้",
          });
        }
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Request failed",
          text:
            error?.response?.data?.message ||
            "Backend error. กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        setRequestingOtp(false);
      }

      return;
    }
    console.log()
    // step === "otp"
    const otpCode = otpDigits.join("");

    if (otpCode.length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัสยืนยันให้ครบ 6 หลัก",
      });
      return;
    }

    if (!otpToken) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบ token สำหรับยืนยัน",
        text: "กรุณาขอรหัสใหม่อีกครั้ง",
      });
      return;
    }


    setVerifyingOtp(true);
    try {
      // NOTE: แก้ URL/field ให้ตรง backend ของคุณ
      const result = await axios.post(`/api/campaigns/${activeCampaign.id}/decrypt/verify-otp`, {
        otpToken,
        otpCode,
      });

      if (result.data?.success) {
        await Swal.fire({
          icon: "success",
          title: "ถอดรหัสสำเร็จ",
          text: result.data.message || "ปลดล็อกข้อมูลเรียบร้อย",
        });
        setopendecrypt(false);
        loadBagsForCampaign((activeCampaign.id));
        // ถ้าถอดรหัสแล้วมีผลกับคะแนน/ข้อมูล ค่อย trigger reload เพิ่มตรงนี้
        // เช่น: fetchScores(); หรือ dispatch อะไรบางอย่าง
      } else {
        Swal.fire({
          icon: "error",
          title: "ยืนยันรหัสไม่สำเร็จ",
          text: result.data?.message || "รหัสไม่ถูกต้องหรือหมดอายุ",
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Request failed",
        text:
          error?.response?.data?.message ||
          "Backend error. กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    // ใช้ key เดิมจาก form มา request ใหม่
    const { firstKey, secondKey } = getValues();
    await onSubmitDecrypt({ firstKey, secondKey });
  };



  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value;
    setOtpDigits(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePDFperBags = async () => {
    console.log(selectedBagId)
    if (!selectedBagId) {
      Swal.fire({
        icon: "error",
        title: "ยังไม่ได้เลือกถุง",
        text: "กรุณาเลือกถุงก่อน"
      })
    }
    try {
      const res = await axios.get(`/api/reports/bags/${selectedBagId}/scores/pdf`,
        {
          responseType: "blob",
        }
      )
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถ export ใบคะแนนได้",
        text:
          error?.response?.data?.message ||
          "Backend error. กรุณาลองใหม่อีกครั้ง",
      });
    }

  }

  const handlePDFAllBags = async () => {
    if (!activeCampaign.id) {
      Swal.fire({
        icon: "error",
        title: "ยังไม่มีรอบสอบ",
        text: "กรุณาเช็ครอบสอบ"
      })
      return;
    }
    if (!selectedBagId) {
      Swal.fire({
        icon: "error",
        title: "ยังไม่ได้เลือกถุง",
        text: "กรุณาเลือกถุงก่อน"
      })
    }
    try {
      const res = await axios.get(`/api/reports/campaigns/${activeCampaign.id}/scoreall/pdf`,
        {
          responseType: "blob",
        }
      )
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถ export ใบคะแนนได้",
        text:
          error?.response?.data?.message ||
          "Backend error. กรุณาลองใหม่อีกครั้ง",
      });
    }

  }




  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="container-fluid px-3 px-sm-4 py-3">

      <div className="card shadow-sm mb-3">
        <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h5 className="mb-1 d-flex align-items-center gap-2">
              จัดการเข้ารหัส
            </h5>
            <small className="text-muted">
              การเข้ารหัสใน {activeCampaign?.name ?? "-"}
            </small>
          </div>

          <div className="d-flex flex-row align-items-center gap-2">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={!selectedBagId}
              onClick={handlePDFAllBags}
            >
              ดาวน์โหลดใบคะแนนรายถุงทั้งหมด
            </button>

            <button
              type="button"
              className="btn btn-outline-primary btn-lg"
              disabled={!selectedBagId}
              onClick={handlePDFperBags}
            >
              ดาวน์โหลดใบคะแนนรายถุง
            </button>

            <button
              type="button"
              className="btn btn-danger btn-lg"
              disabled={filteredBags.length === 0 || isDecrypted}
              onClick={openDecryptModal}
            >
              ถอดรหัส
            </button>
          </div>

        </div>

        <div className="card-body">
          <div className="row g-3">
            {/* Card 1: สถานะการสร้างรอบสอบ */}
            <div className="col-sm-6 col-lg-12">
              <div className="card shadow-none border">
                <div className="card-body">
                  <div className="text-uppercase small text-muted mb-1">
                    สถานะการถอดรหัส
                  </div>
                  <div
                    className={`h3 mb-0 ${isDecrypted ? "text-success" : "text-danger"
                      }`}
                  >
                    {isDecrypted ? "ถอดรหัสแล้ว" : "ยังไม่ถอดรหัส"}
                  </div>
                  <small className="text-muted">
                    ถอดรหัสเพื่อเข้าถึงคะแนนและเลขจริงทั้งหมด
                  </small>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
      {/* BAR ด้านบน: filter + เปลี่ยนถุง */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">

            {/* ========== ซ้าย: Session filter ========== */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="text-muted small">Session</span>

              <select
                className="form-select form-select-sm"
                style={{ width: 220 }}
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                <option value="all">ทุก session</option>
                {sessionOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label || `Session ${s.id}`}
                  </option>
                ))}
              </select>

              <span className="small text-muted ms-1">
                ถุงทั้งหมด {filteredBags.length} ใบ
              </span>
            </div>

            {/* ========== ขวา: Bag navigation + view mode ========== */}
            <div className="d-flex flex-wrap align-items-center gap-2">

              {/* Pagination แบบกลุ่มเดียว */}
              <div className="btn-group" role="group" aria-label="Bag navigation">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentBagIndex <= 0}
                  onClick={() => handleNavigateBag("prev")}
                >
                  <ChevronLeft size={16} />
                </button>

                <select
                  className="form-select form-select-sm"
                  style={{ minWidth: 260 }}
                  value={selectedBagId ?? ""}
                  onChange={(e) => setSelectedBagId(Number(e.target.value))}
                  disabled={filteredBags.length === 0}
                >
                  {filteredBags.map((b, idx) => (
                    <option key={b.bagId} value={b.bagId}>
                      {idx + 1}. BAG{String(b.bagNo).padStart(3, "0")} – {b.sessionLabel}
                    </option>
                  ))}
                  {filteredBags.length === 0 && <option value="">ไม่มีถุง</option>}
                </select>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={
                    currentBagIndex === -1 ||
                    currentBagIndex >= filteredBags.length - 1
                  }
                  onClick={() => handleNavigateBag("next")}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* toggle view mode */}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() =>
                  setViewMode((m) => (m === "score" ? "grader" : "score"))
                }
              >
                <Users size={14} />
                <span className="small">
                  {viewMode === "score" ? "ชื่อผู้ตรวจ" : "คะแนนตัวเลข"}
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* เนื้อหาหลัก (เดิม) */}
      {loadingBags && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <Loader2 className="spinner-border mb-2" />
            <div className="text-muted small">กำลังโหลดข้อมูลถุง...</div>
          </div>
        </div>
      )}

      {errorBags && (
        <div className="alert alert-danger shadow-sm">{errorBags}</div>
      )}

      {!loadingBags && !errorBags && filteredBags.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <FileText className="text-muted mb-2" size={32} />
            <div className="text-muted">ไม่พบถุงข้อสอบในเงื่อนไขนี้</div>
          </div>
        </div>
      )}

      {!loadingBags && selectedBag && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 border-bottom">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <h5 className="mb-0">
                  คะแนนตามรหัสสอบ – BAG
                  {String(selectedBag.bagNo).padStart(3, "0")}
                </h5>
                <div className="text-muted small mt-1 d-flex flex-wrap gap-3">
                  <span>รอบสอบ: {selectedBag.sessionLabel}</span>
                  <span>จำนวนชุดข้อสอบ: {selectedBag.scannedCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {loadingScores && (
              <div className="text-center py-5">
                <Loader2 className="spinner-border mb-2" />
                <div className="text-muted small">กำลังโหลดคะแนน...</div>
              </div>
            )}

            {errorScores && !loadingScores && (
              <div className="text-center text-danger py-4">
                <div className="fw-semibold mb-1">โหลดคะแนนไม่สำเร็จ</div>
                <small>{errorScores}</small>
              </div>
            )}

            {!loadingScores &&
              !errorScores &&
              (!bagScores || !bagScores.booklets.length) && (
                <div className="text-center text-muted py-5">
                  ยังไม่มีคะแนนสำหรับถุงนี้
                </div>
              )}

            {!loadingScores &&
              !errorScores &&
              bagScores &&
              bagScores.booklets.length > 0 && (
                <div
                  className="table-responsive"
                  style={{
                    maxHeight: "calc(100vh - 260px)",
                    overflowX: "auto",
                  }}
                >
                  <table
                    className="table table-sm mb-0"
                    style={{
                      borderCollapse: "collapse",
                      fontSize: "0.8rem",
                      width: "max-content",
                      minWidth: "100%",
                    }}
                  >
                    <thead>
                      {/* แถวที่ 1 : หัวข้อข้อสอบ + label */}
                      <tr>
                        <th
                          rowSpan={2}
                          className="align-middle text-center"
                          style={{
                            border: "1px solid #dee2e6",
                            backgroundColor: "#f8fafc",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          รหัสสอบ
                        </th>

                        {headerQuestions.map((hq) => (
                          <th
                            key={hq.questionNo}
                            colSpan={viewMode === "score" ? 4 : 2}  // ✅ 4 คอลัมน์ต่อข้อ
                            className="text-center"
                            style={{ border: "1px solid #dee2e6", backgroundColor: "#f8fafc" }}
                          >
                            <div className="fw-semibold">ข้อ {hq.questionNo}</div>
                            <div className="text-muted" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                              {hq.label}
                            </div>
                          </th>
                        ))}


                        <th
                          rowSpan={2}
                          className="align-middle text-center"
                          style={{
                            border: "1px solid #dee2e6",
                            backgroundColor: "#e5f0ff",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          คะแนนรวม
                        </th>
                      </tr>

                      {/* แถวที่ 2 : หัวคอลัมน์ย่อย */}
                      <tr>
                        {headerQuestions.map((hq) => (
                          <React.Fragment key={`subhead-${hq.questionNo}`}>
                            <th className="text-center" style={{ border: "1px solid #dee2e6", backgroundColor: "#fdfdfd" }}>
                              {viewMode === "score" ? "คะแนน 1" : "ผู้ตรวจ 1"}
                            </th>

                            <th className="text-center" style={{ border: "1px solid #dee2e6", backgroundColor: "#fdfdfd" }}>
                              {viewMode === "score" ? "คะแนน 2" : "ผู้ตรวจ 2"}
                            </th>

                            {/* ✅ เพิ่มหัวผลต่าง */}
                            {viewMode === "score" && (
                              <th className="text-center" style={{ border: "1px solid #dee2e6", backgroundColor: "#fdfdfd" }}>
                                ผลต่าง
                              </th>
                            )}

                            {viewMode === "score" && (
                              <th className="text-center" style={{ border: "1px solid #dee2e6", backgroundColor: "#fdfdfd" }}>
                                รวม(ข้อ)
                              </th>
                            )}
                          </React.Fragment>
                        ))}
                      </tr>

                    </thead>

                    <tbody>
                      {bagScores.booklets.map((bk) => (
                        <tr key={bk.bookletId}>
                          {/* รหัสสอบ */}
                          <td
                            className="text-start"
                            style={{
                              border: "1px solid #dee2e6",
                              fontWeight: 600,
                              backgroundColor: "#ffffff",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {bk.examCode}
                          </td>

                          {/* รายข้อของเล่มนี้ */}
                          {headerQuestions.map((hq) => {
                            const q = bk.questions.find(
                              (qq) => qq.questionNo === hq.questionNo
                            );

                            const score1 = q?.grader1Score ?? null;
                            const score2 = q?.grader2Score ?? null;
                            const diff = calcDiff(score1, score2);

                            const score1Text = formatScore(score1);
                            const score2Text = formatScore(score2);
                            const diffText = diff == null ? "-" : formatScore(diff);
                            const totalText = formatScore(q?.finalScore ?? null);

                            const name1 = q?.grader1Name || "-";
                            const name2 = q?.grader2Name || "-";

                            if (viewMode === "grader") {
                              return (
                                <React.Fragment
                                  key={`${bk.bookletId}-${hq.questionNo}`}
                                >
                                  <td
                                    className="text-start"
                                    style={{
                                      border: "1px solid #edeff2",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {name1}
                                  </td>
                                  <td
                                    className="text-start"
                                    style={{
                                      border: "1px solid #edeff2",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {name2}
                                  </td>
                                </React.Fragment>
                              );
                            }

                            return (
                              <React.Fragment key={`${bk.bookletId}-${hq.questionNo}`}>
                                <td className="text-end" style={{ border: "1px solid #edeff2" }}>
                                  {score1Text}
                                </td>

                                <td className="text-end" style={{ border: "1px solid #edeff2" }}>
                                  {score2Text}
                                </td>

                                {/* ✅ ผลต่าง อยู่ขวาคะแนน2 */}
                                <td
                                  className="text-end"
                                  style={{
                                    border: "1px solid #edeff2",
                                    backgroundColor: diff != null && diff >= 3 ? "#fff5f5" : undefined, // optional highlight
                                  }}
                                >
                                  {diffText}
                                </td>

                                <td
                                  className="text-end fw-semibold"
                                  style={{
                                    border: "1px solid #edeff2",
                                    backgroundColor: "#fafbff",
                                  }}
                                >
                                  {totalText}
                                </td>
                              </React.Fragment>
                            );

                          })}

                          {/* คะแนนรวมทั้งเล่ม */}
                          <td
                            className="text-end fw-bold"
                            style={{
                              border: "1px solid #dee2e6",
                              backgroundColor: "#e5f0ff",
                            }}
                          >
                            {formatScore(calcTotalForBooklet(bk))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* -------- Modal ถอดรหัส 2-FA -------- */}
            {opendecrypt && (
              <>
                {/* Backdrop */}
                <div
                  className="modal-backdrop fade show"
                  onClick={() => setopendecrypt(false)}
                />

                {/* Modal */}
                <div
                  className="modal fade show"
                  style={{ display: "block" }}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h6 className="modal-title">การถอดรหัส (2 ขั้นตอน)</h6>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setopendecrypt(false)}
                        />
                      </div>

                      <form onSubmit={handleSubmit(onSubmitDecrypt)}>
                        <div className="modal-body">
                          {/* Step 1: กรอก Key 2 ดอก */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              คีย์เข้ารหัสที่ 1
                            </label>
                            <input
                              type="password"
                              className="form-control"
                              placeholder="คีย์ที่ 1 (16 ตัวอักษร)"
                              maxLength={16}
                              {...register("firstKey", { required: true })}
                              disabled={
                                decryptStep === "otp" || requestingOtp
                              }
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              คีย์เข้ารหัสที่ 2
                            </label>
                            <input
                              type="password"
                              className="form-control"
                              placeholder="คีย์ที่ 2 (16 ตัวอักษร)"
                              maxLength={16}

                              {...register("secondKey", { required: true })}
                              disabled={
                                decryptStep === "otp" || requestingOtp
                              }
                            />
                          </div>

                          {/* Step 2: OTP จาก Gmail */}
                          {decryptStep === "otp" && (
                            <>
                              <hr />
                              <div className="mb-2 small text-muted">
                                เราได้ส่งรหัสยืนยันไปที่{" "}
                                <span className="fw-semibold">
                                  {otpEmail || "อีเมลที่กำหนด"}
                                </span>{" "}
                                แล้ว
                              </div>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="small">
                                  เวลาคงเหลือ:{" "}
                                  <span className="fw-semibold text-danger">
                                    {formatOtpTime(otpExpiresIn)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0"
                                  onClick={handleResendOtp}
                                  disabled={requestingOtp}
                                >
                                  ขอรหัสใหม่
                                </button>
                              </div>
                              <div className="mb-3">
                                <label className="form-label fw-semibold">
                                  รหัสยืนยันจากอีเมล
                                </label>
                                <div className="d-flex gap-2 justify-content-center mb-3">
                                  {otpDigits.map((digit, index) => (
                                    <input
                                      key={index}
                                      ref={(el) => {
                                        inputsRef.current[index] = el;
                                      }}
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={1}
                                      className="form-control text-center fw-bold"
                                      style={{ width: 48, height: 48, fontSize: 20 }}
                                      value={digit}
                                      onChange={(e) => handleOtpChange(index, e.target.value)}
                                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    />
                                  ))}
                                </div>

                              </div>
                            </>
                          )}
                        </div>

                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setopendecrypt(false)}
                          >
                            ปิด
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={requestingOtp || verifyingOtp}
                          >
                            {decryptStep === "keys" ? (
                              <>
                                {requestingOtp && (
                                  <Loader2
                                    size={16}
                                    className="me-1 spin-animation"
                                  />
                                )}
                                ขอรหัสยืนยันทางอีเมล
                              </>
                            ) : (
                              <>
                                {verifyingOtp && (
                                  <Loader2
                                    size={16}
                                    className="me-1 spin-animation"
                                  />
                                )}
                                ยืนยันการถอดรหัส
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
