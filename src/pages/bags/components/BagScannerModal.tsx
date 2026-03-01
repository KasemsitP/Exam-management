// src/pages/bags/components/ComposeBagModal.tsx
// ✅ Import CustomQrScanner เข้ามา (แก้ path ให้ตรงกับที่เก็บไฟล์ในโปรเจกต์ของคุณ)
import { CustomQrScanner } from "@/lib/Scanner"; 
import { Loader2, DatabaseZap } from "lucide-react";

interface ComposeBagModalProps {
  open: boolean;
  onClose: () => void;
  canScan: boolean;
  isSealed: boolean;
  scannerEnabled: boolean;
  deviceId?: string; // หมายเหตุ: CustomQrScanner ปัจจุบันใช้ facingMode แทน deviceId
  manualCode: string;
  onManualCodeChange: (v: string) => void;
  onManualAdd: () => void;
  onScan: (raw: string) => void;
  onCapacityChange?: (value: number) => void;
  onRemoveCode?: (code: string) => void;
  onClearCodes: () => void;
  onFinalize: () => void;
  scannedPayloads: string[];
  scannedDate: Date[];
  bagStatus: string;
  bookletsInBag?: any[];
  mode?: "existing" | "draft";
  isLoading?: boolean;
}

export default function ComposeBagModal({
  open,
  onClose,
  canScan,
  scannerEnabled,
  manualCode,
  onManualCodeChange,
  onManualAdd,
  onScan,
  scannedPayloads,
  onClearCodes,
  onFinalize,
  bagStatus,
  scannedDate,
  isLoading = false
}: ComposeBagModalProps) {

  if (!open) return null;

  return (
    <div
      className={`modal ${open ? "show" : ""}`}
      style={{ display: open ? "block" : "none", backgroundColor: "rgba(0,0,0,0.5)" }}
      aria-modal={open}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">สแกนสมุดคำตอบ</h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="row g-3">
              {/* Left: List */}
              <div className="col-lg-7 order-2 order-lg-1">
                <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      รายการที่สแกนแล้ว ({scannedPayloads.length} ชุด)
                    </h6>
                    {scannedPayloads.length > 0 && (
                      <button className="btn btn-link btn-sm text-decoration-none text-danger" onClick={onClearCodes}>
                        ล้างทั้งหมด
                      </button>
                    )}
                  </div>

                  <div className="card-body p-0">
                    <div className="overflow-auto" style={{ maxHeight: 400 }}>
                      <table className="table table-sm table-striped table-hover align-middle mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{ width: 60 }} className="text-center">ลำดับ</th>
                            <th>Payload</th>
                            <th style={{ width: 150 }} className="text-end pe-3">วัน-เวลา</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scannedPayloads.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="text-center text-muted py-5">
                                ยังไม่มีรายการสแกน
                              </td>
                            </tr>
                          ) : (
                            scannedPayloads.map((code, index) => (
                              <tr key={`${code}-${index}`}>
                                <td className="text-center">{index + 1}</td>
                                <td className="text-truncate" style={{ maxWidth: 250 }}>
                                  <span className="font-monospace">{code}</span>
                                </td>
                                <td className="text-muted text-end pe-3">
                                  {scannedDate[index] ? (
                                    new Date(scannedDate[index]).toLocaleString("th-TH", {
                                      day: "numeric", month: "short", year: "2-digit",
                                      hour: "2-digit", minute: "2-digit",
                                    })
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Scanner */}
              <div className="col-lg-5 order-1 order-lg-2">
                <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
                  <div className="card-header bg-white">
                    <h6 className="mb-0">สแกนสมุดคำตอบจากคิวอาร์โค้ด</h6>
                  </div>

                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label small text-uppercase text-muted fw-bold">
                        สแกนด้วยกล้อง
                      </label>

                      {/* ✅ เรียกใช้ CustomQrScanner ตรงนี้ */}
                      <div className="w-100 d-flex justify-content-center">
                        {canScan ? (
                          <CustomQrScanner
                            onResult={onScan}
                            isPaused={!scannerEnabled}
                            isLoading={bagStatus === "loading" || isLoading}
                            aspectRatio="1/1"
                            minHeight={350}
                            cooldownMs={500}
                          />
                        ) : (
                          <div
                            className="d-flex flex-column align-items-center justify-content-center text-muted rounded border bg-black w-100"
                            style={{ minHeight: "350px", aspectRatio: "1/1" }}
                          >
                            <span style={{ color: '#ffffff' }}>ไม่สามารถสแกนได้ (ปิดถุงแล้ว)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="form-label small text-uppercase text-muted fw-bold">
                        เพิ่มรหัสด้วยตนเอง
                      </label>

                      <div className="input-group">
                        <input
                          className="form-control font-monospace"
                          value={manualCode}
                          onChange={(e) => onManualCodeChange(e.target.value)}
                          placeholder="กรอกคิวอาร์โค้ดด้วยตนเอง"
                          disabled={!canScan}
                          onKeyDown={(e) => e.key === 'Enter' && onManualAdd()}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          onClick={onManualAdd}
                          disabled={!canScan || !manualCode}
                        >
                          เพิ่ม
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              onClick={onFinalize}
              disabled={!canScan || bagStatus === "loading" || isLoading}
            >
              {(bagStatus === "loading" || isLoading) ? (
                <Loader2 size={16} className="spin-animation" />
              ) : (
                <DatabaseZap size={16} />
              )}
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}