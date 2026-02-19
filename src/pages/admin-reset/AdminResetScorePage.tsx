// src/pages/grading/recheck/AdminResetScoresPage.tsx
import axios from "axios";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { Loader2, QrCode } from "lucide-react";
import { Scanner, boundingBox, IDetectedBarcode } from "@yudiel/react-qr-scanner";

import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectIsSystemLocked , selectQrActiveCampaign} from "@/store/slices/examData.slice";
import { DeleteCamp } from "@/utils/camp";
import type { DisputedQuestionDto } from "./types";

import ScannerModal from "./components/VerificationScannerModal";

// ============================================================================
// Main Component
// ============================================================================
export default function AdminResetScoresPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const locked = useAppSelector(selectIsSystemLocked);
  const QRActive = useAppSelector(selectQrActiveCampaign);
  const [rows, setRows] = useState<DisputedQuestionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [resettingSlotId, setResettingSlotId] = useState<number | null>(null);
  
  // Scanner State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookletId, setSelectedBookletId] = useState<number | null>(null);

  const campaignNumericId = activeCampaign?.id
    ? Number(DeleteCamp(String(activeCampaign.id)))
    : null;

  const reloadRows = useCallback(async () => {
    if (!campaignNumericId) return;
    try {
      const { data } = await axios.get<DisputedQuestionDto[]>(`/api/recheck/disputed/${campaignNumericId}`);
      const sorted = data.sort((a, b) => {
        const bagDiff = Number(a.bagNo) - Number(b.bagNo);
        if (bagDiff !== 0) return bagDiff;
        return Number(a.bookletId) - Number(b.bookletId);
      });
      setRows(sorted);
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", "โหลดข้อมูลไม่สำเร็จ", "error");
    }
  }, [campaignNumericId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await reloadRows();
      setLoading(false);
    };
    init();
  }, [reloadRows]);

  const handleReset = async (row: DisputedQuestionDto) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการรีเซ็ตคะแนน",
      html: `
      <div style="text-align:left">
        <p>ต้องการรีเซ็ตคะแนนข้อนี้ใช่หรือไม่?</p>
        <p><strong>ผู้ตรวจ:</strong> ${row.graderName1} , ${row.graderName2}</p>
        <p><strong>ข้อ:</strong> ${row.questionNo} (Diff: ${row.diff})</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: "ยืนยันรีเซ็ต",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      setResettingSlotId(row.slotId1);
      await axios.post(`/api/recheck/reset/${row.slotId1}`);
      await Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "รีเซ็ตคะแนนเรียบร้อย",
        timer: 1500,
        showConfirmButton: false
      });
      await reloadRows();
    } catch (err: any) {
      Swal.fire("ผิดพลาด", err?.response?.data?.message ?? "เกิดข้อผิดพลาด", "error");
    } finally {
      setResettingSlotId(null);
    }
  };

  const handleOpenScanner = (bookletId: number | null) => {
    setSelectedBookletId(bookletId);
    setModalOpen(true);
  };

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
      <div className="d-flex flex-column gap-4">
        <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">จัดการคะแนนที่ต่างกันเกิน 4 คะแนน</h5>
                  <small className="text-muted">เพิ่ม ลบ แก้ไข และกำหนดข้อสำหรับผู้ตรวจ</small>
                </div>
                {/* <button
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  onClick={() => handleOpenScanner(null)}
                >
                  <QrCode size={18} /> สแกนตรวจสอบ
                </button> */}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center p-4"><Loader2 className="spin-animation" /> กำลังโหลด...</div>
          ) : rows.length === 0 ? (
            <p className="text-center p-4 text-muted">ยังไม่มีข้อที่คะแนนต่างกันเกินเกณฑ์</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th>ถุง</th>
                    <th>เล่มที่</th>
                    <th>วิชา</th>
                    <th>ข้อ</th>
                    <th>หัวข้อ</th>
                    <th>ผู้ตรวจ 1</th>
                    <th>คะแนน 1</th>
                    <th>ผู้ตรวจ 2</th>
                    <th>คะแนน 2</th>
                    <th>ผลต่าง</th>
                    <th>บันทึกล่าสุด</th> {/* ✅ เพิ่มคอลัมน์ */}
                    <th>จัดการ</th>
                    <th>เช็คเล่มถุง</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.bookletId}-${row.subjectId}-${row.questionNo}`}>
                      <td>{row.bagNo ?? "-"}</td>
                      <td>{row.bookletId ?? "-"}</td>
                      <td>
                        <div>{row.subjectCode}</div>
                        <small className="text-muted">{row.subjectName}</small>
                      </td>
                      <td>{row.questionNo}</td>
                      <td>{row.questionLabel ?? "-"}</td>
                      <td>{row.graderName1}</td>
                      <td>{row.score1}</td>
                      <td>{row.graderName2}</td>
                      <td>{row.score2}</td>
                      <td className={row.diff >= 4 ? "text-danger fw-bold" : ""}>{row.diff}</td>
                      
                      {/* ✅ แสดงเวลาที่บันทึก */}
                      <td>
                        <small className="text-muted d-flex align-items-center gap-1">
                          {row.lastEnteredAt ? (
                            <>
                              {new Date(row.lastEnteredAt).toLocaleString("th-TH", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </>
                          ) : "-"}
                        </small>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={resettingSlotId === row.slotId1}
                          onClick={() => handleReset(row)}
                        >
                          {resettingSlotId === row.slotId1 ? "..." : "รีเซ็ตคะแนน"}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpenScanner(row.bookletId)}
                        >
                          ตรวจสอบเล่ม
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modalOpen && (
          <>
            <div className="modal-backdrop show" style={{ zIndex: 1040 }} />
            <div className="modal d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
              <ScannerModal
                onClose={() => setModalOpen(false)}
                activeCampaignId={activeCampaign?.id ?? 0}
                initialCode={selectedBookletId}
              />
            </div>
          </>
        )}
      </div>
    </fieldset>
  );
}