// components/EncryptionCard.tsx
import {
  CheckCircle2,
  Loader2,
  Rocket,
  ShieldCheck,
  XCircle,
} from "lucide-react";

interface EncryptionCardProps {
  activeKeysCount: number;
  prerequisites: {
    hasTwoKeys: boolean;
    hasImportedUsers: boolean;
  };
  sessions: any[];
  selectedSessionId: string;
  onSessionChange: (value: string) => void;
  canEncrypt: boolean;
  isEncryptionLoading: boolean;
  encryptionStatus: string;
  lastBulkEncryptionStats: { usersEncrypted: number } | null;
  keyManagementError: string | null;
  onRunBulkEncryption: () => void;
}

export default function EncryptionCard({
  activeKeysCount,
  prerequisites,
  sessions,
  selectedSessionId,
  onSessionChange,
  canEncrypt,
  isEncryptionLoading,
  encryptionStatus,
  lastBulkEncryptionStats,
  keyManagementError,
  onRunBulkEncryption,
}: EncryptionCardProps) {
  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-header bg-white">
        <h6 className="mb-0">3. เข้ารหัสข้อมูล </h6>
      </div>
      <div className="card-body">
        {/* Status Check */}
        {/* <div className="mb-3">
          <label className="form-label small text-muted">
            ตรวจสอบเงื่อนไข:
          </label>
          <div className="d-flex flex-column flex-sm-row gap-3">
            <div
              className={`p-3 rounded border w-100 ${
                prerequisites.hasTwoKeys
                  ? "border-success bg-success-subtle"
                  : "border-danger bg-danger-subtle"
              }`}
            >
              {prerequisites.hasTwoKeys ? (
                <CheckCircle2 size={16} className="text-success me-2" />
              ) : (
                <XCircle size={16} className="text-danger me-2" />
              )}
              <span>คีย์ 2 อัน ({activeKeysCount} / 2)</span>
            </div>
            <div
              className={`p-3 rounded border w-100 ${
                prerequisites.hasImportedUsers
                  ? "border-success bg-success-subtle"
                  : "border-danger bg-danger-subtle"
              }`}
            >
              {prerequisites.hasImportedUsers ? (
                <CheckCircle2 size={16} className="text-success me-2" />
              ) : (
                <XCircle size={16} className="text-danger me-2" />
              )}
              <span>นำเข้าข้อมูลผู้สอบ (Users) แล้ว</span>
            </div>
          </div>
        </div> */}

        {/* Session select */}
        <div className="row g-3">
          <div className="col-12">
            {/* <label htmlFor="enc-session" className="form-label">
              เลือก Session ที่จะเข้ารหัส
            </label> */}
            {/* <select
              id="enc-session"
              className="form-select"
              value={selectedSessionId}
              onChange={(e) => {
                     console.log("lnwza",e.target.value);
                onSessionChange(e.target.value);
           
              }}
              disabled={!sessions.length || isEncryptionLoading}
            >
              {sessions.length === 0 && (
                <option value="">ไม่มี Session</option>
              )}
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.id} {s.label}
                </option>
              ))}
            </select> */}
          </div>
        </div>

        {/* Run button */}
        <button
          className="btn btn-primary w-100 mt-3 d-inline-flex align-items-center justify-content-center gap-2"
          onClick={onRunBulkEncryption}
          disabled={!canEncrypt || isEncryptionLoading || !selectedSessionId}
        >
          {isEncryptionLoading ? (
            <Loader2 size={16} className="spin-animation" />
          ) : (
            <></>
          )}
          เข้ารหัส
        </button>

        {/* Result */}
        {/* {encryptionStatus === "succeeded" && lastBulkEncryptionStats && (
          <div className="alert alert-success small py-2 mt-3 mb-0">
            <ShieldCheck size={16} className="me-2" />
            เข้ารหัสสำเร็จ! จำนวน {lastBulkEncryptionStats.usersEncrypted} รายการ
          </div>
        )}

        {encryptionStatus === "failed" && (
          <div className="alert alert-danger small py-2 mt-3 mb-0">
            {keyManagementError}
          </div>
        )} */}
      </div>
      {/* <div className="d-flex justify-content-center mb-4">
        <button
          className="btn btn-primary w-50 mt-3 d-inline-flex align-items-center justify-content-center gap-2"
          onClick={onRunBulkEncryption}
          disabled={!canEncrypt || isEncryptionLoading || !selectedSessionId}
        >
          {isEncryptionLoading ? (
            <Loader2 size={16} className="spin-animation" />
          ) : (
            <></>
          )}
          เข้ารหัสทั้งทั้ง session
        </button>
      </div> */}
    </div>
  );
}
