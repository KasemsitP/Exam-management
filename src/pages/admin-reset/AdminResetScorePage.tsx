// src/pages/grading/recheck/AdminResetScoresPage.tsx
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { Loader2, QrCode } from "lucide-react";

import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectIsSystemLocked } from "@/store/slices/examData.slice";
import { DeleteCamp } from "@/utils/camp";
import type { DisputedQuestionDto } from "./types";

import ScannerModal from "./components/VerificationScannerModal";

// ============================================================================
// Main Component
// ============================================================================
export default function AdminResetScoresPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const locked = useAppSelector(selectIsSystemLocked);
  const [rows, setRows] = useState<DisputedQuestionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedBag, setSelectedBag] = useState<string>("");

  const bagOptions = Array.from(
    new Set(rows.map((r) => String(r.bagNo ?? "")).filter((v) => v !== ""))
  ).sort((a, b) => Number(a) - Number(b));

  const sortedRows = [...rows]
    .filter((r) => (selectedBag ? String(r.bagNo) === selectedBag : true))
    .sort((a, b) => {
      const bagDiff = Number(a.bagNo) - Number(b.bagNo);
      if (bagDiff !== 0) return bagDiff;
      const randDiff = Number(a.random_num) - Number(b.random_num);
      if (randDiff !== 0) return randDiff;
      return Number(a.questionNo) - Number(b.questionNo);
    });

  // Scanner State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DisputedQuestionDto | null>(null);


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
        }
    };
    init();
  }, [reloadRows]);

  const handleOpenScanner = (row: DisputedQuestionDto) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
      <div className="d-flex flex-column gap-4">
        <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
          <div className="card mb-3" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center admin-reset-header-row">
                <div>
                  <h5 className="mb-1">จัดการคะแนนที่ต่างกันเกิน 4 คะแนน</h5>
                  <small className="text-muted">สแกนหาที่เล่มข้อสอบและรีเซ็ตคะแนน</small>
                </div>
                <div className="d-flex align-items-center gap-2 admin-reset-filter-wrap">
                 <label className="small text-muted mb-0" style={{ whiteSpace: "nowrap" }}>เลือกถุง:</label>
                  <select
                    className="form-select form-select-sm admin-reset-bag-select"
                    style={{ minWidth: 160 }}
                    value={selectedBag}
                    onChange={(e) => setSelectedBag(e.target.value)}
                  >
                    <option value="">ทั้งหมด</option>
                    {bagOptions.map((b) => (
                      <option key={b} value={b}>
                        ถุง {b}
                      </option>
                    ))}
                  </select>
                  {selectedBag && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                      onClick={() => setSelectedBag("")}
                    >
                      ล้าง
                    </button>
                  )}
                </div>
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
                        <th className="text-center">ลำดับจัดเก็บ</th>
                        <th className="text-center">วิชา</th>
                        <th className="text-center">ข้อ</th>
                        <th className="text-center">หัวข้อ</th>
                        <th className="text-center">ผู้ตรวจ 1</th>
                        <th className="text-center">คะแนน 1</th>
                        <th className="text-center">ผู้ตรวจ 2</th>
                        <th className="text-center">คะแนน 2</th>
                        <th className="text-center">ผลต่าง</th>
                        <th className="text-center">สแกน/แก้ไข</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
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

                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                              onClick={() => handleOpenScanner(row)}
                            >
                              <QrCode size={14} /> สแกนเพื่อแก้ไข
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
              {selectedRow && (
                <ScannerModal
                  onClose={() => setModalOpen(false)}
                  activeCampaignId={activeCampaign?.id ?? 0}
                  row={selectedRow}
                  onSuccess={reloadRows}
                />
              )}
            </div>
          </>
        )}
      </div>
    </fieldset>
  );
}