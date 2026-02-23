import axios from "axios";
import { useState, useCallback, useRef } from "react";
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
  const QRactive = useAppSelector(selectQrActiveCampaign);  
  const isProcessing = useRef(false);

  const handleVerify = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || !activeCampaignId || isProcessing.current) return;

    isProcessing.current = true; // บล็อคไม่ให้สแกนโค้ดอื่นจนกว่า API จะทำงานเสร็จ
    // ❌ เอา setScannerEnabled(false) ออก กล้องจะได้ไม่ค้าง

    try {
      const result = await axios.post("/api/verify/check-booklets-orders", {
        campaignId: activeCampaignId,
        qrPayload: code,
        innitialCode: initialCode ? String(initialCode) : undefined,
      });

      const data = result.data;
      console.log("Verify response:", data);

      if (data.success) {
        // 💡 แนะนำ: ถ้าอยากสแกนรัวๆ ควรเปลี่ยน popup เป็นแบบ Toast (แจ้งเตือนมุมจอ)
        // เพราะ Swal.fire แบบนี้จะบล็อคหน้าจอ 2 วินาที ทำให้สแกนเล่มต่อไปไม่ต่อเนื่อง
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
          timer: 1500, // ลดเวลาลงนิดนึงจะได้สแกนต่อได้เร็วขึ้น
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error("Verify error:", error);
      await Swal.fire({
        icon: "error",
        title: "ไม่พบข้อมูล",
        text: error?.response?.data?.message ?? "ไม่พบข้อมูลในระบบ",
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      // ❌ เอา setScannerEnabled(true) ออก
      isProcessing.current = false; // ปลดล็อคให้สแกนรอบต่อไปได้
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
          <div className="card" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
            <div className="card-header bg-white">
              <h6 className="mb-0">สแกนสมุดคำตอบจากคิวอาร์โค้ด</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label small text-uppercase text-muted fw-bold">สแกนด้วยกล้อง</label>
                <CustomQrScanner
                  onResult={handleVerify}
                  isLoading={isProcessing.current} // ใช้ isProcessing เพื่อเช็คว่ากำลังโหลดอยู่ไหม
                  minHeight={360} 
                  allowMultipleScans={true} // ✅ 1. เพิ่ม Prop นี้เข้าไปเพื่ออนุญาตให้สแกนซ้ำได้
                  cooldownMs={500} // ✅ 2. (ตัวเลือก) ปรับความไวของการพ่นข้อมูลซ้ำ
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
                    disabled={isProcessing.current}
                    onKeyDown={(e) => e.key === 'Enter' && onManualSubmit()}
                  />
                  <button className="btn btn-primary" onClick={onManualSubmit} disabled={isProcessing.current || !manualCode}>
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