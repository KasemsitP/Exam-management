// src/pages/grading/recheck/AdminResetScoresPage.tsx
import axios from "axios";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { Loader2, QrCode } from "lucide-react";
import { Scanner, boundingBox, IDetectedBarcode } from "@yudiel/react-qr-scanner";

import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectIsSystemLocked, selectQrActiveCampaign } from "@/store/slices/examData.slice";
import { DeleteCamp } from "@/utils/camp";
import type { DisputedQuestionDto } from "./types";
import { OverlayLoader } from "@/components/ui/Loading";

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

        return Number(a.random_num) - Number(b.random_num);
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
      try {
        await reloadRows();
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
        setIsInitialLoading(false);
      }
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

  // Show loading overlay while initial data is loading
  if (isInitialLoading) {
    return <OverlayLoader open={true} label="" />;
  }

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
      <div className="d-flex flex-column gap-4">
        <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
          <div className="card mb-3" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
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
            <div className="card" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle text-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">เลขถุง</th>
                        <th className="text-center">รหัสสอบ</th>
                        <th className="text-center">วิชา</th>
                        <th className="text-center">ข้อ</th>
                        <th className="text-center">หัวข้อ</th>
                        <th className="text-center">ผู้ตรวจ 1</th>
                        <th className="text-center">คะแนน 1</th>
                        <th className="text-center">ผู้ตรวจ 2</th>
                        <th className="text-center">คะแนน 2</th>
                        <th className="text-center">ผลต่าง</th>
                        <th className="text-center">จัดการ</th>
                        <th className="text-center">เช็คเล่มถุง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={`${row.bookletId}-${row.subjectId}-${row.questionNo}`}>
                          <td className="text-center">{row.bagNo ?? "-"}</td>
                          <td className="text-center">{row.random_num ?? "-"}</td>
                          <td className="text-center">
                            <div>{row.subjectName}</div>
                            <small className="text-muted">รหัสวิชา: {row.subjectCode}</small>
                          </td>
                          <td className="text-center">{row.questionNo}</td>
                          <td className="text-center">{row.questionLabel ?? "-"}</td>
                          <td className="text-center">{row.graderName1}</td>
                          <td className="text-center">{row.score1}</td>
                          <td className="text-center">{row.graderName2}</td>
                          <td className="text-center">{row.score2}</td>
                          <td className={row.diff >= 4 ? "text-danger fw-bold text-center" : "text-center"}>{row.diff}</td>

                          {/* ✅ แสดงเวลาที่บันทึก */}

                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-danger text-center"
                              disabled={resettingSlotId === row.slotId1}
                              onClick={() => handleReset(row)}
                            >
                              {resettingSlotId === row.slotId1 ? "..." : "รีเซ็ตคะแนน"}
                            </button>
                          </td>
                          <td className="text-center">
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
              </div>
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