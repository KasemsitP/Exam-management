// src/pages/proctor-scan/hooks/useProctorScan.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { useToast } from "@/components/ui/use-toast";

import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  verifyQrCodeThunk,
  selectProctorScanState,
  clearScanResult,
} from "@/store/slices/qrscanner.slice";

export function useProctorScan() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const { status, error, scannedUser } = useAppSelector(selectProctorScanState);

  // กล้อง & สถานะสแกน
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [pauseAfterSuccess, setPauseAfterSuccess] = useState(true);
  const [pause, setPause] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [cooldownMs, setCooldownMs] = useState(1200);
  const lastScanRef = useRef<number>(0);

  const [manualPayload, setManualPayload] = useState("");

  const campaignLabel = activeCampaign?.name ?? "N/A";

  const canScan = useMemo(
    () => scannerEnabled && !pause && status !== "loading",
    [scannerEnabled, pause, status]
  );

  // จัดการ pause / resume ตาม status
  useEffect(() => {
    if (status === "loading") {
      setPause(true);
    }

    if (status === "succeeded") {
      setPause(pauseAfterSuccess);
      if (pauseAfterSuccess) setScannerEnabled(false);
    }

    if (status === "failed") {
      setTimeout(() => {
        setPause(false);
        setScannerEnabled(true);
      }, 600);
    }
  }, [status, pauseAfterSuccess]);

  const verifyPayload = async (payload: string) => {
    if (!activeCampaign) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือก Campaign ก่อน",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        verifyQrCodeThunk({
          qrPayload: payload,
          campaignId: activeCampaign.id,
        })
      ).unwrap();
    } catch (err: any) {
      toast({
        title: "สแกนล้มเหลว",
        description: err?.message ?? "ไม่สามารถตรวจสอบ QR ได้",
        variant: "destructive",
      });
    }
  };

  const handleScan = async (data: string) => {
    const now = Date.now();
    if (!canScan) return;
    if (now - lastScanRef.current < cooldownMs) return; // กันยิงรัว ๆ
    lastScanRef.current = now;

    setScannerEnabled(false);
    setPause(true);
    await verifyPayload(data);

    if (!pauseAfterSuccess) {
      setTimeout(() => {
        setPause(false);
        setScannerEnabled(true);
      }, cooldownMs);
    }
  };

  const handleManualSubmit = async () => {
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
    await verifyPayload(value);
  };

  const handleClear = () => {
    dispatch(clearScanResult());
    setManualPayload("");
    setPause(false);
    setScannerEnabled(true);
  };

  const toggleScanner = () => {
    const next = !scannerEnabled;
    setScannerEnabled(next);
    setPause(!next ? true : false);
  };

  const toggleFacingMode = () => {
    setFacingMode((m) => (m === "environment" ? "user" : "environment"));
  };

  return {
    // data
    campaignLabel,
    status,
    error,
    scannedUser,

    // scanner state
    scannerEnabled,
    pauseAfterSuccess,
    setPauseAfterSuccess,
    pause,
    facingMode,
    cooldownMs,
    setCooldownMs,
    manualPayload,
    setManualPayload,

    // handlers
    handleScan,
    handleManualSubmit,
    handleClear,
    toggleScanner,
    toggleFacingMode,
  };
}
