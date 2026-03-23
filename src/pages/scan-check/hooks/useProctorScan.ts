// src/pages/proctor-scan/hooks/useProctorScan.ts
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import Swal from "sweetalert2";

import { selectActiveCampaign , selectQrActiveCampaign } from "@/store/slices/examData.slice";
import {
  verifyQrCodeThunk,
  selectProctorScanState,
  clearScanResult,
} from "@/store/slices/qrscanner.slice";

export function useProctorScan() {
  const dispatch = useAppDispatch();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const QRActive = useAppSelector(selectQrActiveCampaign);
  
  const { status, error, scannedUser } = useAppSelector(selectProctorScanState);

  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [pauseAfterSuccess, setPauseAfterSuccess] = useState(true);
  const [pause, setPause] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cooldownMs, setCooldownMs] = useState(1200);

  const lastScanRef = useRef<number>(0);
  const [manualPayload, setManualPayload] = useState("");

  const campaignLabel = activeCampaign?.name ?? "N/A";

  const canScan = useMemo(
    () => scannerEnabled && !pause && status !== "loading" && QRActive,
    [scannerEnabled, pause, status]
  );
  console.log("QRActive:", QRActive, " | canScan:", canScan);

  const scanConfigRef = useRef({ canScan, cooldownMs, pauseAfterSuccess, activeCampaign });
  useEffect(() => {
    scanConfigRef.current = { canScan, cooldownMs, pauseAfterSuccess, activeCampaign };
  }, [canScan, cooldownMs, pauseAfterSuccess, activeCampaign]);

  useEffect(() => {
    dispatch(clearScanResult()); // ล้างค่าตอนเข้ามา
    return () => {
      dispatch(clearScanResult()); // ล้างค่าตอนออกไปหน้าอื่น
    };
  }, [dispatch]);
  // จัดการกล้องเมื่อสถานะเปลี่ยน
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === "loading") {
      setPause(true);
    }

    if (status === "succeeded") {
      setPause(pauseAfterSuccess);
      if (pauseAfterSuccess) setScannerEnabled(false);
    }

    if (status === "failed") {
      timeoutId = setTimeout(() => {
        setPause(false);
        setScannerEnabled(true);
      }, 600);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, pauseAfterSuccess]);

  // ✅ รวมการแจ้งเตือน Swal.fire ผลการสแกนไว้ใน Hook 
  useEffect(() => {
    if (status === "succeeded" && scannedUser) {
      Swal.fire({
        icon: "success",
        title: "ยืนยันตัวตนสำเร็จ",
        html: `
          <div class="mt-2">
            <div class="fs-5 fw-bold text-primary">${scannedUser.title} ${scannedUser.firstName} ${scannedUser.lastName}</div>
            <div class="text-muted mt-1 font-monospace">รหัส: ${scannedUser.userCode}</div>
          </div>
        `,
        timer: 1500,
        showConfirmButton: false,
      });
    } else if (status === "failed") {
      Swal.fire({
        icon: "error",
        title: "สแกนล้มเหลว",
        text: error ?? "QR Code ไม่ถูกต้องหรือไม่พบข้อมูล",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#d33",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }, [status, scannedUser, error]);

  const verifyPayload = useCallback(async (payload: string, campaign: typeof activeCampaign) => {
    if (!campaign) {
      Swal.fire({
        icon: "warning",
        title: "ข้อผิดพลาด",
        text: "กรุณาเลือกรอบสอบ (Campaign) ก่อนเริ่มสแกน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    try {
      await dispatch(
        verifyQrCodeThunk({
          qrPayload: payload,
          campaignId: campaign.id,
        })
      ).unwrap();
    } catch (err: any) {
    }
  }, [dispatch]);

  const handleScan = useCallback(async (data: string) => {
    const now = Date.now();
    const { canScan, cooldownMs, pauseAfterSuccess, activeCampaign } = scanConfigRef.current;

    if (!canScan) return;
    if (now - lastScanRef.current < cooldownMs) return;
    lastScanRef.current = now;

    setScannerEnabled(false);
    setPause(true);
    await verifyPayload(data, activeCampaign);

    if (!pauseAfterSuccess) {
      setTimeout(() => {
        setPause(false);
        setScannerEnabled(true);
      }, cooldownMs);
    }
  }, [verifyPayload]);

  const handleManualSubmit = useCallback(async () => {
    const value = manualPayload.trim();
    if (!value) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูล",
        text: "กรุณาวางหรือพิมพ์ QR payload ก่อนกดยืนยัน",
        confirmButtonText: "ตกลง",
      });
      return;
    }
    setScannerEnabled(false);
    setPause(true);
    await verifyPayload(value, scanConfigRef.current.activeCampaign);
  }, [manualPayload, verifyPayload]);

  const handleClear = useCallback(() => {
    dispatch(clearScanResult());
    setManualPayload("");
    setPause(false);
    setScannerEnabled(true);
  }, [dispatch]);

  const toggleScanner = useCallback(() => {
    setScannerEnabled((prev) => {
      const next = !prev;
      setPause(!next ? true : false);
      return next;
    });
  }, []);

  const toggleFacingMode = useCallback(() => {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  }, []);

  return {
    campaignLabel,
    status,
    error,
    scannedUser,
    scannerEnabled,
    pauseAfterSuccess,
    setPauseAfterSuccess,
    pause,
    facingMode,
    cooldownMs,
    setCooldownMs,
    manualPayload,
    setManualPayload,
    handleScan,
    handleManualSubmit,
    handleClear,
    toggleScanner,
    toggleFacingMode,
    QRActive
  };
}