// src/pages/bags/components/ComposeBagModal.tsx
import { CustomQrScanner } from "@/lib/Scanner"; 
import { Loader2, DatabaseZap, X } from "lucide-react";
import {useState} from "react";
import Swal from "sweetalert2";
import axios from "axios";

interface ComposeBagModalProps {
  open: boolean;
  composeBag: any | null;
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
  onRemoveCode: (code: string) => void;
  onClearCodes: () => void;
  onFinalize: () => void;
  bagStatus: string;
  bookletsInBag: any[];
  isLoading: boolean;
}

export default function ComposeBagModalOnlyViews({
  open,
  composeBag,
  onClose,
  canScan,
  isSealed,
  scannerEnabled,
  manualCode,
  onManualCodeChange,
  onManualAdd,
  onScan,
  onRemoveCode,
  onClearCodes,
  onFinalize,
  bagStatus,
  bookletsInBag,
  isLoading,
}: ComposeBagModalProps) {
  
  // ป้องกันการเรนเดอร์ถ้า modal ปิดอยู่ หรือไม่มีข้อมูล composeBag
  if (!open || !composeBag) return null;
 // const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
  
      //setIsExportingPdf(true);
      try {
        Swal.fire({
          title: "กำลังสร้างไฟล์ PDF...",
          text: "กรุณารอสักครู่",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
  
        const res = await axios.get(
          `/api/bags/createpdf/${composeBag.id}`,
          {
            responseType: "blob",
          }
        );
  
        Swal.close();
  
        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
  
        setTimeout(() => URL.revokeObjectURL(url), 10000);
  
      } catch (error) {
        Swal.close();
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Export PDF ล้มเหลว",
        });
      } finally {
       // setIsExportingPdf(false);
      }
    };

  // คำนวณจำนวนที่สแกนแล้ว
  const scannedCount = isSealed ? bookletsInBag.length : composeBag.scanned.length;
  const isFull = scannedCount >= composeBag.capacity;

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
            <h6 className="modal-title">
              สแกนสมุดคำตอบ: {composeBag.sessionLabel} ถุงที่ {composeBag.bag_no}
            </h6>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose} 
              disabled={isLoading || bagStatus === "loading"} 
            />
          </div>

          <div className="modal-body">
            <div className="row g-3">
              
              {/* Left Side: List (รูปแบบตาราง) */}
              <div className="col-lg-7 order-2 order-lg-1">
                <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
                  <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">
                        รายการที่สแกนแล้ว ({scannedCount} ชุด)
                      </h6>
                      <small className="text-muted">
                        รอบ {composeBag.sessionLabel}
                      </small>
                    </div>
                  <button className="btn btn-success"  onClick={handleDownloadPdf} disabled={isLoading || bagStatus === "loading"}>
                      ดาวน์โหลด PDF
                    </button>
                    {(!isSealed && composeBag.scanned.length > 0) && (
                      <button 
                        className="btn btn-link btn-sm text-decoration-none text-danger" 
                        onClick={onClearCodes}
                      >
                        ล้างทั้งหมด
                      </button>
                    )}
                  </div>

                  <div className="card-body p-0">
                    <div className="overflow-auto" style={{ maxHeight: 400 }}>
                      <table className="table table-sm table-striped table-hover align-middle mb-0 text-nowrap">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{ width: 60 }} className="text-center">ลำดับ</th>
                            <th  className="text-center">ลำดับจัดเก็บ</th>
                            <th className="text-center">Payload</th>
                            <th style={{ width: 150 }} className="text-end pe-3">วัน-เวลา</th>
                            {!isSealed && <th style={{ width: 50 }}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {scannedCount === 0 ? (
                            <tr>
                              <td colSpan={isSealed ? 4 : 5} className="text-center text-muted py-5">
                                ยังไม่มีรายการสแกน
                              </td>
                            </tr>
                          ) : (
                            isSealed 
                              ? bookletsInBag.map((bk: any, index: number) => (
                                  <tr key={bk.id}>
                                    <td className="text-center">{index+1}</td>
                                    <td className="text-center">{bk.random_num}</td>
                                    <td className="text-truncate" style={{ maxWidth: 250 }}>
                                      <span className="font-monospace">{bk.qrPayload}</span>
                                    </td>
                                    <td className="text-muted text-end pe-3">
                                      {new Date(bk.created_at).toLocaleString("th-TH", {
                                        day: "numeric", month: "short", year: "2-digit",
                                        hour: "2-digit", minute: "2-digit",
                                      })}
                                    </td>
                                  </tr>
                                ))
                              : composeBag.scanned.map((code: string, index: number) => (
                                  <tr key={`${code}-${index}`}>
                                    <td className="text-center">{index + 1}</td>
                                    <td className="text-truncate" style={{ maxWidth: 250 }}>
                                      <span className="font-monospace">{code}</span>
                                    </td>
                                    <td className="text-muted text-end pe-3">-</td>
                                    <td className="text-center">
                                      <button
                                        className="btn btn-link text-danger p-0"
                                        onClick={() => onRemoveCode(code)}
                                        title="ลบ"
                                      >
                                        <X size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Capacity Info (ดึงมาจากโค้ดล่าง) */}
                  <div className="card-footer bg-white border-top-0 pt-2 pb-3">
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">
                        ครบ {composeBag.capacity} เล่มหรือไม่
                      </span>
                      <span className={isFull ? "text-success fw-bold" : "text-warning fw-bold"}>
                        {isFull ? "ครบแล้ว" : "ยังไม่ครบ"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Scanner (รูปแบบโค้ดบน) */}
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

                      {/* ✅ เรียกใช้ CustomQrScanner */}
                      <div className="w-100 d-flex justify-content-center">
                        {canScan ? (
                          <CustomQrScanner
                            onResult={onScan}
                            isPaused={!scannerEnabled}
                            isLoading={bagStatus === "loading" || isLoading}
                            aspectRatio="1/1"
                            minHeight={350}
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
            <button 
              className="btn btn-outline-secondary" 
              onClick={onClose}
            >
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
              {(bagStatus === "loading" || isLoading) ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}