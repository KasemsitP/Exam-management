// components/RecentScoresCard.tsx
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { DraftScore } from "../hooks/useGradingStation";

interface RecentScoresCardProps {
  issueScoreFormPdf: () => void;
  draftScores: DraftScore[];
  bagInfo?: {
    subject_name: string | null;
    question_label: string | null;
    question_no: number | null;
    bag_no?: number | null;
    min_random?: number | null;
    max_random?: number | null;
  };
  isDraftLoading: boolean;
  onConfirmAll: (editedScores: Record<string, string>) => void;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function makeScoreKey(
  input: Pick<DraftScore, "booklet_id" | "slot_id" | "question_no">
): string {
  return JSON.stringify({
    booklet_id: Number(input.booklet_id),
    slot_id: input.slot_id ?? null,
    question_no: input.question_no ?? null,
  });
}

function makeRowKey(item: DraftScore): string {
  return [
    item.bag_id ?? "nobag",
    item.booklet_id ?? "nobooklet",
    item.slot_id ?? "noslot",
    item.question_no ?? "noq",
  ].join("-");
}

/* -------------------------------------------------------------------------- */
/*  Print: ใบกรอกคะแนน                                                         */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/*  Payload Cell                                                              */
/* -------------------------------------------------------------------------- */
function PayloadCell({ payload }: { payload: string }) {
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

  return (
    <td
      ref={cellRef}
      className="text-center"
      style={{
        maxWidth: 120,
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
        {payload.length > 20 ? `${payload.slice(0, 20)}...` : payload}
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

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */
export default function RecentScoresCard({
  draftScores,
  bagInfo,
  isDraftLoading,
  issueScoreFormPdf,
  onConfirmAll,
}: RecentScoresCardProps) {
  const [editedScores, setEditedScores] = useState<Record<string, string>>({});

  /* ------------------------- sync draft -> state ------------------------- */
  useEffect(() => {
    const initial: Record<string, string> = {};

    draftScores.forEach((item) => {
      if (item.score != null && item.slot_id != null && item.question_no != null) {
        initial[makeScoreKey(item)] = String(parseInt(String(item.score), 10));
      }
    });

    setEditedScores(initial);
  }, [draftScores]);

  const handleScoreChange = (key: string, value: string) => {
    setEditedScores((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ---------------------------- group by bag ---------------------------- */
  const groupedByBag = draftScores.reduce<Record<number, DraftScore[]>>(
    (acc, item) => {
      const bagKey = Number(item.bag_no);
      if (!acc[bagKey]) acc[bagKey] = [];
      acc[bagKey].push(item);
      return acc;
    },
    {}
  );

  const bagNos = Object.keys(groupedByBag)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div
      className="card h-100"
      style={{
        boxShadow:
          "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="card-header bg-white py-3 px-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <h6 className="mb-0 fw-semibold text-dark ">
            รายการคะแนนที่ตรวจในแต่ละถุง
          </h6>

          {draftScores.length > 0 && (
            <span className="small text-muted">
              {draftScores.length} รายการ
            </span>
          )}

          {!isDraftLoading && draftScores.length > 0 && (
            <button
              type="button"
              className="btn btn-success y ms-auto"
              onClick={issueScoreFormPdf}
              disabled={isDraftLoading}
            >
              ออกใบกรอกคะแนน
            </button>
          )}
        </div>

        {bagInfo &&
          (bagInfo.subject_name ||
            bagInfo.question_label ||
            bagInfo.question_no != null) && (
            <div className="mt-2 small text-muted">
              {bagInfo.bag_no && (
                <div className="mb-1">
                  <span className="text-secondary">ถุงที่:</span>{" "}
                  <span className="fw-medium text-dark">{bagInfo.bag_no}</span>
                </div>
              )}

              {bagInfo.question_no != null && (
                <div className="mb-1">
                  <span className="text-secondary">ข้อ:</span>{" "}
                  <span className="fw-medium text-dark">
                    {bagInfo.question_no} {bagInfo.question_label}
                  </span>
                </div>
              )}

              {bagInfo.subject_name && (
                <div className="mb-1">
                  <span className="text-secondary">วิชา:</span>{" "}
                  <span className="fw-medium text-dark">
                    {bagInfo.subject_name}
                  </span>
                </div>
              )}

              {bagInfo.min_random != null && bagInfo.max_random != null && (
                <div className="mb-1">
                  <span className="text-secondary">ลำดับจัดเก็บ:</span>{" "}
                  <span className="fw-medium text-dark">
                    {bagInfo.min_random} - {bagInfo.max_random}
                  </span>
                </div>
              )}
            </div>
          )}
      </div>

      <div
        className="card-body d-flex flex-column"
        style={{ minHeight: 0, overflow: "hidden" }}
      >
        {draftScores.length === 0 ? (
          <div className="text-muted small">
            ยังไม่มีรายการคะแนนที่ตรวจในแต่ละถุง กรุณาสแกนเพื่อตรวจข้อสอบ
          </div>
        ) : (
          <>
            <div
              className="flex-grow-1"
              style={{ overflowY: "auto", minHeight: 0 }}
            >
              {bagNos.map((bagNo) => {
                const randomNums = groupedByBag[bagNo]
                  .map((it) => Number(it.random_num))
                  .filter((n) => Number.isFinite(n));
                const minRandom =
                  randomNums.length > 0 ? Math.min(...randomNums) : null;
                const maxRandom =
                  randomNums.length > 0 ? Math.max(...randomNums) : null;

                return (
                  <div key={bagNo} className="mb-3">
                    <div
                      className="table-responsive"
                      style={{ overflow: "visible" }}
                    >
                      <table className="table table-sm table-striped table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-center" style={{ width: 60 }}>
                              ลำดับ
                            </th>
                            <th className="text-center">ลำดับจัดเก็บ</th>
                            <th className="text-center">Payload</th>
                            <th className="text-center" style={{ width: 100 }}>
                              คะแนน
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {groupedByBag[bagNo].map((item, index) => {
                            const scoreKey = makeScoreKey(item);
                            const rowKey = makeRowKey(item);

                            return (
                              <tr key={rowKey} style={{ height: 48 }}>
                                <td className="text-center">{index + 1}</td>

                                <td className="text-center">{item.random_num}</td>

                                <PayloadCell payload={item.payload} />

                                <td className="text-center">
                                  {item.score != null &&
                                    item.slot_id != null &&
                                    item.question_no != null ? (
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      max={99}
                                      min={0}
                                      step={1}
                                      value={
                                        editedScores[scoreKey] ??
                                        (item.score != null ? String(item.score) : "")
                                      }
                                      onChange={(e) => {
                                        let val = e.target.value;
                                        if (val === "") {
                                          handleScoreChange(scoreKey, "");
                                          return;
                                        }
                                        val = val.replace(/\D/g, "").slice(0, 2);
                                        handleScoreChange(scoreKey, val);
                                      }}
                                    />
                                  ) : (
                                    <span className="text-muted small">
                                      ยังไม่มีคะแนน
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="d-grid mt-3">
              <button
                className="btn btn-success btn-lg"
                onClick={() => onConfirmAll(editedScores)}
                disabled={isDraftLoading}
              >
                {/* {isDraftLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>ยืนยันคะแนนทั้งหมด</>
                )} */}
                ยืนยันคะแนนทั้งหมด
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}