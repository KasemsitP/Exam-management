import axios from "axios";
import { useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";

import { CustomSyncQrScanner } from "./SyncQrScanner";
import { useAppSelector } from "@/store/hook";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { DisputedQuestionDto } from "../types";

interface ScannerModalProps {
  onClose: () => void;
  activeCampaignId: number | string;
  row: DisputedQuestionDto;
  onSuccess?: () => void;
}

export default function ScannerModal({ onClose, activeCampaignId, row, onSuccess }: ScannerModalProps) {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.roles?.includes("admin") ? true : false;

  const [manualCode, setManualCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<{ booklets_id: number | string; subject_name: string; bag_no: number | string } | null>(null);
  const [score1, setScore1] = useState<string>(String(row.score1 ?? ""));
  const [score2, setScore2] = useState<string>(String(row.score2 ?? ""));
  const [newScore1, setNewScore1] = useState<string>(String(""));
  const [newScore2, setNewScore2] = useState<string>(String(""));
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const isProcessing = useRef(false);

  const handleVerify = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || !activeCampaignId || isProcessing.current) return;

    isProcessing.current = true;
    try {
      const result = await axios.post("/api/verify/check-booklets-orders", {
        campaignId: activeCampaignId,
        qrPayload: code,
        innitialCode: row.bookletId ? String(row.bookletId) : undefined,
      });

      const data = result.data;
      if (data.success) {
        setVerifiedInfo(data.data);
        setVerified(true);
        await Swal.fire({
          icon: "success",
          title: "สแกนสำเร็จ",
          text: "พบเล่มที่สามารถแก้ไขคะแนนได้แล้ว",
          timer: 1200,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "สแกนไม่สำเร็จ",
        text: error?.response?.data?.message ?? "ไม่ใช้เล่มที่ถูกต้อง",
        timer: 1500,
        showConfirmButton: false,
      });
    } finally {
      isProcessing.current = false;
    }
  }, [activeCampaignId, row.bookletId]);

  const onManualSubmit = () => handleVerify(manualCode);

  const handleSaveScores = async () => {
    if (!isAdmin) {
      Swal.fire({ icon: "error", title: "สิทธิ์ไม่เพียงพอ", text: "คุณไม่มีสิทธิ์ในการแก้ไขคะแนน" });
      return;
    }
    if(newScore1 === "" || newScore2 === "") {
      Swal.fire("ไม่สามารถบันทึกคะแนนได้", "กรุณากรอกคะแนนใหม่ให้ครบทั้งสองช่อง", "error");
      return;
    }
    const s1 = Number(newScore1);
    const s2 = Number(newScore2);
    if (Number.isNaN(s1) || Number.isNaN(s2)) {
      Swal.fire("ไม่สามารถบันทึกคะแนนได้", "กรุณากรอกคะแนนเป็นตัวเลข", "error");
      return;
    }
    if (!Number.isInteger(s1) || !Number.isInteger(s2)) {
      Swal.fire("ไม่สามารถบันทึกคะแนนได้", "กรุณากรอกคะแนนเป็นจำนวนเต็ม", "error");
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการแก้ไขคะแนน",
      html: `
        <div style="text-align:left">
          <p><strong>ข้อ:</strong> ${row.questionNo}</p>
          <p><strong>วิชา:</strong> ${row.subjectName}</p>
          <p><strong>หัวข้อ:</strong> ${row.questionLabel ?? "-"}</p>
          <p><strong>${row.graderName1}:</strong> คะแนนเดิม ${row.score1} คะแนน</p>
          <p><strong>${row.graderName2}:</strong> คะแนนเดิม ${row.score2} คะแนน</p>
          <p><strong>${row.graderName1}:</strong>  แก้ไขเป็น <strong style="color: #d32f2f">${s1}</strong> คะแนน</p>
          <p><strong>${row.graderName2}:</strong>  แก้ไขเป็น <strong style="color: #d32f2f">${s2}</strong> คะแนน</p>
        </div>`,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
    });
    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      // TODO: backend endpoint — คุณแก้เอง
      await axios.post(`/api/recheck/reset-score`, {
        slotId1: row.slotId1,
        slotId2: row.slotId2,
        score1: s1,
        score2: s2,
        userId: user?.id,
      });
      await Swal.fire({ icon: "success", title: "แก้ไขคะแนนสำเร็จ", 
      html: `
        <div style="text-align:left">
          <p><strong>ข้อ:</strong> ${row.questionNo}</p>
          <p><strong>วิชา:</strong> ${row.subjectName}</p>
          <p><strong>${row.graderName1}:</strong> คะแนนใหม่ <strong style="color: #d32f2f">${s1}</strong> คะแนน</p>
          <p><strong>${row.graderName2}:</strong> คะแนนใหม่ <strong style="color: #d32f2f">${s2}</strong> คะแนน</p>
        </div>`,
        showConfirmButton: true,

      }
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      Swal.fire("ไม่สามารถบันทึกคะแนนได้", err?.response?.data?.message ?? "เกิดข้อผิดพลาด", "error");
    } finally {
      setSaving(false);
    }
  };

  // const handleReset = async () => {
  //   if (!isAdmin) {
  //     Swal.fire({ icon: "error", title: "สิทธิ์ไม่เพียงพอ", text: "คุณไม่มีสิทธิ์ในการรีเซ็ตคะแนน" });
  //     return;
  //   }
  //   const confirm = await Swal.fire({
  //     icon: "warning",
  //     title: "ยืนยันการรีเซ็ตคะแนน",
  //     html: `
  //       <div style="text-align:left">
  //         <p>ต้องการรีเซ็ตคะแนนข้อนี้ใช่หรือไม่?</p>
  //         <p><strong>ข้อ:</strong> ${row.questionNo}</p>
  //         <p><strong>ผู้ตรวจ:</strong> ${row.graderName1} และ ${row.graderName2}</p>
  //         <p><strong>ผลต่าง:</strong> ${row.diff} คะแนน</p>
  //       </div>`,
  //     showCancelButton: true,
  //     confirmButtonText: "ยืนยันรีเซ็ต",
  //     confirmButtonColor: "#d33",
  //   });
  //   if (!confirm.isConfirmed) return;

  //   try {
  //     setResetting(true);
  //     await axios.post(`/api/recheck/reset/${row.slotId1}/${user?.id}`);
  //     await Swal.fire({ icon: "success", title: "รีเซ็ตสำเร็จ", timer: 1200, showConfirmButton: false });
  //     onSuccess?.();
  //     onClose();
  //   } catch (err: any) {
  //     Swal.fire("ผิดพลาด", err?.response?.data?.message ?? "เกิดข้อผิดพลาด", "error");
  //   } finally {
  //     setResetting(false);
  //   }
  // };

  return (
    <div className="modal-dialog modal-dialog-centered modal-lg">
      <div className="modal-content">
        <div className="modal-header">
          <h6 className="modal-title">สแกนเพื่อปลดล็อคการแก้ไขคะแนน</h6>
          <button type="button" className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body">
          {!verified ? (
            <div className="card" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
              <div className="card-header bg-white">
                <h6 className="mb-0">สแกนสมุดคำตอบจากคิวอาร์โค้ด</h6>
                <small className="text-muted">
                  ลำดับจัดเก็บ: {row.random_num} | ถุง: {row.bagNo ?? "-"} | วิชา: {row.subjectName}
                </small>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small text-uppercase text-muted fw-bold">สแกนด้วยกล้อง</label>
                  <CustomSyncQrScanner
                    onScan={handleVerify}
                    minHeight={360}
                    cooldownMs={1600}
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
          ) : (
            <div className="card border-success" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' }}>
              <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">✓ ยืนยันเล่มสำเร็จ — แก้ไขคะแนนได้</h6>
                <button className="btn btn-sm btn-outline-light" onClick={() => { setVerified(false); setVerifiedInfo(null); }}>
                  สแกนใหม่
                </button>
              </div>
              <div className="card-body">
<div className="card-body">
  <div className="mb-2"><strong>ลำดับจัดเก็บ:</strong> {verifiedInfo?.booklets_id ?? row.bookletId}</div>
  <div className="mb-2"><strong>วิชา:</strong> {verifiedInfo?.subject_name ?? row.subjectName}</div>
  <div className="mb-2"><strong>หมายเลขถุง:</strong> {verifiedInfo?.bag_no ?? row.bagNo ?? "-"}</div>
  <div className="mb-2"><strong>ข้อ:</strong> {row.questionNo}</div>
  <div className="mb-2"><strong>หัวข้อ:</strong> {row.questionLabel ?? "-"}</div>
</div>

                <hr />

                <h6 className="mb-3">แก้ไขคะแนน</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      ผู้ตรวจ 1: <strong>{row.graderName1}</strong>
                      <span className="text-muted ms-2">(คะแนนเดิม: {row.score1})</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      className="form-control"
                      placeholder={`แก้ไขคะแนน ${row.graderName1}`}
                      onChange={(e) => setNewScore1(e.target.value)}
                      disabled={saving || resetting}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      ผู้ตรวจ 2: <strong>{row.graderName2}</strong>
                      <span className="text-muted ms-2">(คะแนนเดิม: {row.score2})</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      className="form-control"
                      placeholder={`แก้ไขคะแนน ${row.graderName2}`}
                      onChange={(e) => setNewScore2(e.target.value)}
                      disabled={saving || resetting}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4 justify-content-end">
                  {/* <button
                    className="btn btn-danger"
                    onClick={handleReset}
                    disabled={saving || resetting}
                  >
                    {resetting ? "กำลังรีเซ็ต..." : "รีเซ็ตคะแนน"}
                  </button> */}
                  <button
                    className="btn btn-success"
                    onClick={handleSaveScores}
                    disabled={saving || resetting}
                  >
                    {saving ? "กำลังบันทึก..." : "บันทึกคะแนนใหม่"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer bg-light">
          <button className="btn btn-outline-secondary" onClick={onClose}>ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}
