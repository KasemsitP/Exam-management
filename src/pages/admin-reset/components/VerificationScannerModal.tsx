import axios from "axios";
import { useState, useCallback, useRef, use } from "react";
import Swal from "sweetalert2";

import { CustomQrScanner } from "@/lib/Scanner";
import { selectQrActiveCampaign } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";

interface ScannerModalProps {
  onClose: () => void;
  activeCampaignId: number | string;
  initialCode?: string | number | null;
}

export default function ScannerModal({ onClose, activeCampaignId, initialCode = "" }: ScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const QRactive = useAppSelector(selectQrActiveCampaign);  
  const isProcessing = useRef(false);

  const handleVerify = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || !activeCampaignId || isProcessing.current) return;

    isProcessing.current = true;
    setScannerEnabled(false);

    try {
      const result = await axios.post("/api/verify/check-booklets-orders", {
        campaignId: activeCampaignId,
        qrPayload: code,
        innitialCode: initialCode ? String(initialCode) : undefined,
      });

      const data = result.data;
      console.log("Verify response:", data);

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: "สแกนสำเร็จ",
          html: `
            <div style="text-align:left">  
              <div><strong>รหัสเล่มข้อสอบ:</strong> ${data.data.booklets_id}</div>
              <div><strong>วิชา:</strong> ${data.data.subject_name}</div>
              <div><strong>หมายเลขถุง:</strong> ${data.data.bag_no}</div>
            </div>
          `,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error("Verify error:", error);
      await Swal.fire({
        icon: "error",
        title: "ไม่พบข้อมูล",
        text: error?.response?.data?.message ?? "ไม่พบข้อมูลในระบบ",
        timer: 2000,
        showConfirmButton: false
      });
    } finally {
      setScannerEnabled(true);
      isProcessing.current = false;
    }
  }, [activeCampaignId, initialCode]);

  const onManualSubmit = () => handleVerify(manualCode);

  return (
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h6 className="modal-title">สแกนสมุดคำตอบ</h6>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">สแกนสมุดคำตอบจากคิวอาร์โค้ด</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label small text-uppercase text-muted fw-bold">สแกนด้วยกล้อง</label>
                <CustomQrScanner
                  onResult={handleVerify}
                  isLoading={!scannerEnabled} 
                  minHeight={360} 
                  // qrActive={QRactive}
                />
              </div>

              <div className="mb-2">
                <label className="form-label small text-uppercase text-muted fw-bold">เพิ่มรหัสด้วยตนเอง</label>
                <div className="input-group">
                  <input
                    className="form-control font-monospace"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="กรอกคิวอาร์โค้ด"
                    disabled={!scannerEnabled}
                    onKeyDown={(e) => e.key === 'Enter' && onManualSubmit()}
                  />
                  <button className="btn btn-primary" onClick={onManualSubmit} disabled={!scannerEnabled || !manualCode}>
                    ตรวจสอบ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer bg-light">
          <button className="btn btn-outline-secondary" onClick={onClose}>ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}