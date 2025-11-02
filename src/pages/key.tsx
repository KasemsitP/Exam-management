import React, { useEffect, useState, useMemo } from "react";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Hash,
  Shield,
  Loader2,
  AlertTriangle,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Rocket,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

// [ ⭐️ 1. Imports ⭐️ ]
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
} from "@/store/slices/key.slice"; 

import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";

const parseCampaignId = (id: string): number => Number(id.replace("camp-", ""));
const parseSessionId = (id: string): number => Number(id.replace("sess-", ""));


export default function KeyManagementPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const activeKeys = useAppSelector(selectAllActiveKeys);
  const keyStatus = useAppSelector(selectKeyManagementStatus);
  const sessions = useAppSelector(selectActiveCampaignSessions) as any[]; // (ใช้ any ชั่วคราว)
  const prerequisites = useAppSelector(selectPrerequisites);
  const encryptionStatus = useAppSelector(selectEncryptionStatus);
  const lastBulkEncryptionStats = useAppSelector(selectLastBulkEncryptionStats);
  const keyManagementError = useAppSelector(selectKeyManagementError);

  // (State ภายใน)
  const [keyInput, setKeyInput] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const isLoading = keyStatus === "loading";
  const canGenerate = !isLoading && activeKeys.length < 2;
  const isEncryptionLoading = encryptionStatus === "loading";
  const numericCampaignId = activeCampaign
    ? parseCampaignId(activeCampaign.id)
    : null;
  const canEncrypt =
    prerequisites?.hasTwoKeys && prerequisites?.hasImportedUsers;

  // (useEffect ดึงข้อมูล)
  useEffect(() => {
    if (activeCampaign && numericCampaignId) {
      dispatch(fetchKeysForCampaign(numericCampaignId));
      dispatch(checkEncryptionPrerequisites(numericCampaignId));
    }
    return () => {
      dispatch(clearActiveKeys());
    };
  }, [activeCampaign, dispatch, numericCampaignId]);

  // (useEffect สำหรับตั้งค่า Session เริ่มต้น)
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  // (Handlers: handleSaveKey, handleDelete - เหมือนเดิม)
  const handleSaveKey = () => {
    if (!numericCampaignId) {
      toast({ title: "กรุณาเลือก Campaign ก่อน", variant: "destructive" });
      return;
    }
    if (!keyInput.trim()) {
      toast({ title: "กรุณากรอกคีย์ (Secret)", variant: "destructive" });
      return;
    }
    if (!canGenerate) {
      toast({
        title: "Campaign นี้มีคีย์ครบ 2 อันแล้ว",
        variant: "destructive",
      });
      return;
    }
    dispatch(
      saveNewKey({
        campaignId: numericCampaignId,
        key: keyInput.trim(),
      })
    ).then(() => {
      dispatch(checkEncryptionPrerequisites(numericCampaignId));
    });
    setKeyInput("");
  };

  const handleDelete = (keyId: number) => {
    if (!window.confirm(`ยืนยันการลบคีย์ ID: ${keyId} ?`)) return;
    dispatch(deleteKey(keyId)).then(() => {
      if (numericCampaignId) {
        dispatch(checkEncryptionPrerequisites(numericCampaignId));
      }
    });
  };

  // [ ⭐️ Handler: handleRunBulkEncryption (แก้ไข) ⭐️ ]
  const handleRunBulkEncryption = () => {
    if (!numericCampaignId || !selectedSessionId || !canEncrypt) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาเลือก Session และตรวจสอบว่าคีย์/ข้อมูล พร้อม",
        variant: "destructive",
      });
      return;
    }
    dispatch(clearEncryptionResult());
    dispatch(
      runBulkEncryptionForSession({
        campaignId: numericCampaignId,
        sessionId: parseSessionId(selectedSessionId),
      })
    ).then((result: any) => {
      if (result.meta.requestStatus === "fulfilled") {
        toast({
          title: "เข้ารหัสสำเร็จ!",
          description: `เข้ารหัสผู้สอบ ${result.payload.usersEncrypted} คน ใน Session นี้`,
        });
      } else {
        toast({
          title: "เข้ารหัสล้มเหลว",
          description: result.payload as string,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <ShowIfCan anyOf={["manage_keys"]}>
      <div className="container-fluid px-3 px-sm-4 py-4">
        {/* Header (เหมือนเดิม) */}
        <div className="d-flex align-items-start gap-3 mb-4">
          <div className="rounded-circle bg-primary-subtle p-2 text-primary d-inline-flex">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="h4 mb-1">Key & Encryption Management</h1>
            {activeCampaign && (
              <div className="small text-muted">
                สนามสอบ:{" "}
                <span className="fw-semibold text-body">
                  {activeCampaign.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card: "สร้าง" คีย์ (เหมือนเดิม) */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <h6 className="mb-0">1. เพิ่มคีย์ (สูงสุด 2 คีย์)</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-8">
                <label htmlFor="key-input" className="form-label">
                  คีย์ลับ (Key / Secret)
                </label>
                <input
                  id="key-input"
                  type="password"
                  className="form-control"
                  placeholder="กรอกคีย์ลับที่ต้องการบันทึก"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  disabled={!canGenerate}
                />
              </div>
              <div className="col-lg-4 d-flex align-items-end">
                <button
                  className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
                  onClick={handleSaveKey}
                  disabled={
                    !canGenerate || !activeCampaign || !keyInput.trim()
                  }
                >
                  {isLoading ? (
                    <Loader2 size={16} className="spin-animation" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Save New Key
                </button>
              </div>
            </div>
            {!canGenerate && activeKeys.length >= 2 && (
              <div className="alert alert-success small py-2 mt-3 mb-0">
                <ShieldCheck size={16} className="me-2" />
                Campaign นี้มีคีย์ครบ 2 อันแล้ว (ไม่สามารถเพิ่มได้)
              </div>
            )}
          </div>
        </div>

        {/* Card: แสดงคีย์ที่ดึงมา (เหมือนเดิม) */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <h6 className="mb-0">
              2. คีย์ที่ใช้งาน (Active Keys) ({activeKeys.length} / 2)
            </h6>
          </div>
          <div className="card-body">
            {isLoading && (
              <div className="text-center text-muted">Loading keys...</div>
            )}
            {keyStatus === "failed" && (
              <div className="alert alert-danger mb-0">
                Failed to fetch keys
              </div>
            )}
            {keyStatus === "succeeded" && activeKeys.length === 0 && (
              <div className="text-center text-muted">
                Campaign นี้ยังไม่มีคีย์
              </div>
            )}
            {activeKeys.length > 0 && (
              <ul className="list-group">
                {activeKeys.map((key: any) => (
                  <li
                    key={key.id}
                    className="list-group-item d-flex align-items-center justify-content-between"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <Hash size={16} className="text-muted" />
                      <div className="d-flex flex-column">
                        <span className="fw-semibold text-monospace">
                          {key.key}
                        </span>
                        <small className="text-muted">
                          ID: {key.id} | IV:{" "}
                          {key.iv ? key.iv.slice(0, 16) : "N/A"}...
                        </small>
                      </div>
                    </div>
                    <button
                      className="btn btn-link text-danger p-1"
                      onClick={() => handleDelete(key.id)}
                      disabled={isLoading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* [ ⭐️ Card: เข้ารหัส (Official) (แก้ไข) ⭐️ ] */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0">3. เข้ารหัสข้อมูล (Official Bulk Run)</h6>
          </div>
          <div className="card-body">
            {/* Status Check (เหมือนเดิม) */}
            <div className="mb-3">
              <label className="form-label small text-muted">
                ตรวจสอบเงื่อนไข:
              </label>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <div
                  className={`p-3 rounded border w-100 ${
                    prerequisites?.hasTwoKeys
                      ? "border-success bg-success-subtle"
                      : "border-danger bg-danger-subtle"
                  }`}
                >
                  {prerequisites?.hasTwoKeys ? (
                    <CheckCircle2 size={16} className="text-success me-2" />
                  ) : (
                    <XCircle size={16} className="text-danger me-2" />
                  )}
                  <span>คีย์ 2 อัน ({activeKeys.length} / 2)</span>
                </div>
                <div
                  className={`p-3 rounded border w-100 ${
                    prerequisites?.hasImportedUsers
                      ? "border-success bg-success-subtle"
                      : "border-danger bg-danger-subtle"
                  }`}
                >
                  {prerequisites?.hasImportedUsers ? (
                    <CheckCircle2 size={16} className="text-success me-2" />
                  ) : (
                    <XCircle size={16} className="text-danger me-2" />
                  )}
                  <span>นำเข้าข้อมูลผู้สอบ (Users) แล้ว</span>
                </div>
              </div>
            </div>

            {/* Form (แก้ไข: ลบ User Code Input) */}
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="enc-session" className="form-label">
                  เลือก Session ที่จะเข้ารหัส
                </label>
                <select
                  id="enc-session"
                  className="form-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  disabled={!sessions.length || isEncryptionLoading}
                >
                  {sessions.length === 0 && (
                    <option value="">ไม่มี Session</option>
                  )}
                  {sessions.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary w-100 mt-3 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={handleRunBulkEncryption}
              disabled={
                !canEncrypt || isEncryptionLoading || !selectedSessionId
              }
            >
              {isEncryptionLoading ? (
                <Loader2 size={16} className="spin-animation" />
              ) : (
                <Rocket size={16} />
              )}
              เข้ารหัสทั้ง Session (Run Bulk Encryption)
            </button>

            {/* Result (แก้ไข: แสดงสถิติ) */}
            {encryptionStatus === "succeeded" && lastBulkEncryptionStats && (
              <div className="alert alert-success small py-2 mt-3 mb-0">
                <ShieldCheck size={16} className="me-2" />
                เข้ารหัสสำเร็จ! จำนวน {lastBulkEncryptionStats.usersEncrypted}{" "}
                รายการ
              </div>
            )}

            {encryptionStatus === "failed" && (
              <div className="alert alert-danger small py-2 mt-3 mb-0">
                {keyManagementError}
              </div>
            )}
          </div>
        </div>
      </div>
    </ShowIfCan>
  );
}

