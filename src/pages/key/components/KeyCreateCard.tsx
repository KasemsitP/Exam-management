import React from "react";
import { Loader2, Minus, Plus, ShieldCheck, Key, AlertCircle } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

interface KeyCreateCardProps {
  myKeyRef: React.RefObject<HTMLInputElement>; // รับเป็น Ref แทน String
  myKeyId: number | null;
  managerName: string;
  initialKeyValue: string;
  manager_order: number | null;

  onSaveKey: () => void;
  onDeleteKey: (id: number) => void;
  onForgetKey: (id: number) => void;

  canGenerate: boolean;
  isLoading: boolean;
  hasActiveCampaign: boolean;
  hasTwoKeys: boolean;
  onRunBulkEncryption: () => void;
  headerSummary: {
    keyStatus: any;
    EncryptedStatus: any[];
  };
}

export default function KeyCreateCard({
  myKeyRef,
  myKeyId,
  onSaveKey,
  onDeleteKey,
  onForgetKey,
  isLoading,
  hasActiveCampaign,
  hasTwoKeys,
  onRunBulkEncryption,
  managerName,
  headerSummary,
  initialKeyValue,
  manager_order
}: KeyCreateCardProps) {

  const [showPassword, setShowPassword] = React.useState(false);

  const allEncrypted =
    headerSummary.EncryptedStatus?.every(
      (s: any) => s.encryption_status === "ENCRYPTED_ALL"
    ) ?? false;

  const textitle = manager_order === 1 ? "กรุณากำหนดคีย์ลำดับที่ 1 สำหรับผู้จัดการอัยการพิเศษฝ่าย (คก.2) คณะกรรมการ 2"
    : "กรุณากำหนดคีย์ลำดับที่ 2 สำหรับรองอธิบดี";


  return (
    <div className="card mt-2" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-header bg-white">
        <h6 className="mb-0 text-nowrap">กำหนดคีย์เข้ารหัสของคุณ</h6>
      </div>

      <div className="card-body">
        <div className="row g-2 g-md-3">
          <div className="col-12 col-lg-8">
            <label className="form-label d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="text-nowrap">{textitle}</span>
              {managerName && (
                <span className="badge bg-light text-primary fw-normal text-nowrap" style={{ fontSize: "0.75rem" }}>
                  {managerName}
                </span>
              )}
            </label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control form-control-sm pe-5" // เพิ่ม padding ขวา
                ref={myKeyRef}
                defaultValue={initialKeyValue}
                disabled={!!myKeyId}
                maxLength={16}
                placeholder="กรอกคีย์ความยาว 16 ตัวอักษร"
              />

              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                disabled={!!myKeyId}
                className="btn  position-absolute top-50 end-0 translate-middle-y me-2 p-0"
                style={{ border: "none" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-4 d-flex align-items-end gap-1 gap-sm-2">
            <button
              className="btn btn-sm btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={ ()=>{
                  onSaveKey();
                  setShowPassword(false); // ซ่อนรหัสหลังบันทึก

              }}
              // เอาเงื่อนไข !myKey.trim() ออก เพราะปุ่มไม่สามารถรู้ state แบบ real-time ได้
              disabled={!!myKeyId || !hasActiveCampaign}
              title="สร้างคีย์"
            >
              {isLoading ? <Loader2 size={14} className="spin-animation" /> : <Plus size={14} />}
              <span className="d-none d-sm-inline">สร้าง</span>
            </button>

            <button
              className="btn btn-sm btn-danger w-100 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={() => myKeyId && onDeleteKey(myKeyId)}
              disabled={!myKeyId}
              title="ลบคีย์"
            >
              <Minus size={14} />
              <span className="d-none d-sm-inline">ลบ</span>
            </button>
            <button
              className="btn btn-sm btn-secondary w-100 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={() => myKeyId && onForgetKey(myKeyId)}
              disabled={!myKeyId}
              title="ลืมคีย์"
            >
              <Key size={14} />
              <span className="d-none d-sm-inline">ลืมคีย์</span>
            </button>
          </div>
        </div>

        <div className="mt-4">
          {hasTwoKeys ? (
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 p-2 p-sm-3 rounded border border-success bg-success bg-opacity-10 mb-3">
              <ShieldCheck size={16} className="text-success flex-shrink-0" />
              <div>
                {allEncrypted ? (
                  <>
                    <div className="fw-semibold text-success small">เข้ารหัสและสร้างคิวอาร์โค้ดแล้ว</div>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>ระบบได้สร้างคิวอาร์โค้ดครบถ้วนแล้ว</div>
                  </>
                ) : (
                  <>
                    <div className="fw-semibold text-primary small">ระบบพร้อมสำหรับการเข้ารหัส (มีคีย์ครบ 2 คีย์ในระบบ)</div>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>คุณสามารถเริ่มทำการเข้ารหัสได้ทันที</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 p-2 p-sm-3 rounded border border-warning bg-warning bg-opacity-10 mb-3">
              <AlertCircle size={16} className="text-warning flex-shrink-0" />
              <div>
                <div className="fw-semibold text-warning small">กำลังรอคีย์จากผู้จัดการคีย์ท่านอื่น</div>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>จำเป็นต้องมีคีย์ 2 คีย์ในระบบจึงจะเริ่มการเข้ารหัสได้</div>
              </div>
            </div>
          )}

          <button
            className="btn btn-sm btn-success"
            onClick={onRunBulkEncryption}
            disabled={!hasTwoKeys || allEncrypted || isLoading}
          >
            เริ่มการเข้ารหัส
          </button>
        </div>

      </div>
    </div>
  );
}