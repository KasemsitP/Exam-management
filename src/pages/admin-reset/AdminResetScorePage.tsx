// src/pages/grading/recheck/AdminResetScoresPage.tsx
import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { Loader2, QrCode } from "lucide-react";

import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectIsSystemLocked } from "@/store/slices/examData.slice";
import { DeleteCamp } from "@/utils/camp";
import type { DisputedQuestionDto } from "./types";

import ScannerModal from "./components/VerificationScannerModal";

// ============================================================================
// Payload Cell (hover -> full payload tooltip via portal)
// ============================================================================
function PayloadCell({ payload }: { payload: string | null | undefined }) {
  const cellRef = useRef<HTMLTableCellElement>(null);
  const [hover, setHover] = useState(false);
  const [tipPos, setTipPos] = useState<{
    top: number;
    left: number;
    placeAbove: boolean;
  } | null>(null);

  const updatePos = () => {
    const rect = cellRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = 140;
    const placeAbove = rect.top > estimatedHeight + 16;
    setTipPos({
      top: placeAbove ? rect.top : rect.bottom,
      left: rect.left + rect.width / 2,
      placeAbove,
    });
  };

  if (!payload) {
    return <td className="text-center">-</td>;
  }

  const preview =
    payload.length > 12
      ? `${payload.slice(0, 5)} .... ${payload.slice(-5)}`
      : payload;

  return (
    <td
      ref={cellRef}
      className="text-center"
      style={{
        maxWidth: 160,
        cursor: "pointer",
        wordBreak: "break-all",
        whiteSpace: "normal",
      }}
      onMouseEnter={() => {
        updatePos();
        setHover(true);
      }}
      onMouseLeave={() => setHover(false)}
    >
      <span
        className="font-monospace small d-inline-block text-truncate"
        style={{ maxWidth: "100%" }}
      >
        {preview}
      </span>

      {hover &&
        tipPos &&
        createPortal(
          <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              position: "fixed",
              top: tipPos.top,
              left: tipPos.left,
              transform: tipPos.placeAbove
                ? "translate(-50%, -100%)"
                : "translate(-50%, 0)",
              zIndex: 9999,
              background: "#1e293b",
              color: "#f1f5f9",
              borderRadius: 8,
              padding: "10px 14px",
              minWidth: 220,
              maxWidth: "80vw",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              wordBreak: "break-all",
              whiteSpace: "normal",
              textAlign: "left",
              fontSize: 12,
              userSelect: "text",
              cursor: "text",
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                color: "#94a3b8",
                marginBottom: 4,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Payload
            </div>

            <div className="font-monospace">{payload}</div>
          </div>,
          document.body
        )}
    </td>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function AdminResetScoresPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const locked = useAppSelector(selectIsSystemLocked);
  const [rows, setRows] = useState<DisputedQuestionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedBag, setSelectedBag] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [selectedGrader, setSelectedGrader] = useState<string>("");

  const bagOptions = Array.from(
    new Set(rows.map((r) => String(r.bagNo ?? "")).filter((v) => v !== ""))
  ).sort((a, b) => Number(a) - Number(b));

  const questionOptions = Array.from(
    new Set(rows.map((r) => String(r.questionNo ?? "")).filter((v) => v !== ""))
  ).sort((a, b) => Number(a) - Number(b));

  const graderOptions = Array.from(
    new Set(
      rows
        .flatMap((r) => [r.graderName1, r.graderName2])
        .filter((v): v is string => !!v && v.trim() !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

  const hasAnyFilter = !!selectedBag || !!selectedQuestion || !!selectedGrader;

  const sortedRows = [...rows]
    .filter((r) => (selectedBag ? String(r.bagNo) === selectedBag : true))
    .filter((r) =>
      selectedQuestion ? String(r.questionNo) === selectedQuestion : true
    )
    .filter((r) =>
      selectedGrader
        ? r.graderName1 === selectedGrader || r.graderName2 === selectedGrader
        : true
    )
    .sort((a, b) => {
      const bagDiff = Number(a.bagNo) - Number(b.bagNo);
      if (bagDiff !== 0) return bagDiff;
      const randDiff = Number(a.random_num) - Number(b.random_num);
      if (randDiff !== 0) return randDiff;
      return Number(a.questionNo) - Number(b.questionNo);
    });

  const clearAllFilters = () => {
    setSelectedBag("");
    setSelectedQuestion("");
    setSelectedGrader("");
  };

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
                <div className="d-flex flex-wrap align-items-center gap-3 admin-reset-filter-wrap">
                  <div className="d-flex align-items-center gap-2 admin-reset-filter-item">
                    <label className="small text-muted mb-0" style={{ whiteSpace: "nowrap" }}>เลือกถุง:</label>
                    <select
                      className="form-select form-select-sm admin-reset-select"
                      style={{ minWidth: 140 }}
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
                  </div>

                  <div className="d-flex align-items-center gap-2 admin-reset-filter-item">
                    <label className="small text-muted mb-0" style={{ whiteSpace: "nowrap" }}>เลือกข้อ:</label>
                    <select
                      className="form-select form-select-sm admin-reset-select"
                      style={{ minWidth: 120 }}
                      value={selectedQuestion}
                      onChange={(e) => setSelectedQuestion(e.target.value)}
                    >
                      <option value="">ทั้งหมด</option>
                      {questionOptions.map((q) => (
                        <option key={q} value={q}>
                          ข้อ {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex align-items-center gap-2 admin-reset-filter-item">
                    <label className="small text-muted mb-0" style={{ whiteSpace: "nowrap" }}>ผู้ตรวจ:</label>
                    <select
                      className="form-select form-select-sm admin-reset-select"
                      style={{ minWidth: 180 }}
                      value={selectedGrader}
                      onChange={(e) => setSelectedGrader(e.target.value)}
                    >
                      <option value="">ทั้งหมด</option>
                      {graderOptions.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasAnyFilter && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-muted text-decoration-none admin-reset-filter-clear"
                      onClick={clearAllFilters}
                    >
                      ล้างทั้งหมด
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
                         <th className="text-center">payload</th>
                        <th className="text-center">วิชา</th>
                        <th className="text-center">ข้อ</th>
                        {/* <th className="text-center">หัวข้อ</th> */}
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
                           <PayloadCell payload={row.qr_payload} />
                          <td className="text-center">
                            <div>{row.subjectName}</div>
                            <small className="text-muted">รหัสวิชา: {row.subjectCode}</small>
                          </td>
                          <td className="text-center">{row.questionNo}</td>
                          {/* <td className="text-center">{row.questionLabel ?? "-"}</td> */}
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