// components/RecentScoresCard.tsx
import { useState, useEffect } from "react";
import type { DraftScore } from "../hooks/useGradingStation";

interface RecentScoresCardProps {
  draftScores: DraftScore[];
  bagInfo?: {
    subject_name: string | null;
    question_label: string | null;
    question_no: number | null;
  };
  isDraftLoading: boolean;
  onConfirmAll: (editedScores: Record<string, string>) => void;
}



/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function makeScoreKey(input: Pick<DraftScore, "slot_id" | "question_no">): string {
  return JSON.stringify({
    slot_id: Number(input.slot_id),
    question_no: Number(input.question_no),
  });
}

/* -------------------------------------------------------------------------- */
/*  Payload Cell                                                              */
/* -------------------------------------------------------------------------- */
function PayloadCell({ payload }: { payload: string }) {
  const [hover, setHover] = useState(false);

  return (
    <td
      className="text-center"
      style={{
        maxWidth: 120,
        position: "relative",
        overflow: "visible",
        cursor: "pointer",
        wordBreak: "break-all",
        whiteSpace: "normal",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        className="font-monospace small d-inline-block text-truncate"
        style={{ maxWidth: "100%" }}
      >
        {payload.length > 20 ? `${payload.slice(0, 20)}...` : payload}
      </span>

      {hover && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: "auto",
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

          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 16,
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #1e293b",
            }}
          />
        </div>
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
  onConfirmAll,
}: RecentScoresCardProps) {
  const [editedScores, setEditedScores] = useState<Record<string, string>>({});

  /* ------------------------- sync draft -> state ------------------------- */
  useEffect(() => {
    const initial: Record<string, string> = {};

    draftScores.forEach((item) => {
      if (item.score != null) {
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
      className="card"
      style={{
        boxShadow:
          "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="card-header bg-white">
        <div className="d-flex align-items-center gap-2">
          <h6 className="mb-0">รายการคะแนนที่ตรวจ</h6>
          {draftScores.length > 0 && (
            <span className="badge bg-warning text-dark ms-auto">
              {draftScores.length} รายการ
            </span>
          )}
        </div>

        {bagInfo && (bagInfo.subject_name || bagInfo.question_label || bagInfo.question_no != null) && (
          <div className="mt-2 d-flex flex-wrap gap-2 align-items-center">
            {bagInfo.subject_name && (
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                วิชา: {bagInfo.subject_name}
              </span>
            )}
            {bagInfo.question_no != null && (
              <span className="badge bg-info-subtle text-info border border-info-subtle">
                ข้อ {bagInfo.question_no}
              </span>
            )}
            {bagInfo.question_label && (
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                {bagInfo.question_label}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="card-body">
        {/* {isDraftLoading ? (
          <div className="text-center py-4">
            <div
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            />
            <span className="ms-2 text-muted small">กำลังโหลด...</span>
          </div> */}
        {/* ) : draftScores.length === 0 ? ( */}
        {draftScores.length === 0 ? (
          <div className="text-muted small">ยังไม่มีรายการคะแนน Draft</div>
        ) : (
          <>
            {bagNos.map((bagNo) => {
              const randomNums = groupedByBag[bagNo]
                .map((it) => Number(it.random_num))
                .filter((n) => Number.isFinite(n));
              const minRandom = randomNums.length > 0 ? Math.min(...randomNums) : null;
              const maxRandom = randomNums.length > 0 ? Math.max(...randomNums) : null;

              return (
              <div key={bagNo} className="mb-3">
                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                  <h6 className="fw-bold text-primary mb-0">
                    <i className="bi bi-bag-fill me-1" />
                    ถุงที่ {bagNo}
                  </h6>
                  {minRandom != null && maxRandom != null && (
                    <span className="badge bg-light text-dark border">
                      รหัสจัดเก็บ: {minRandom} - {maxRandom}
                    </span>
                  )}
                </div>

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

                        return (
                          <tr key={scoreKey}>
                            <td className="text-center">{index + 1}</td>

                            <td className="text-center">{item.random_num}</td>

                            <PayloadCell payload={item.payload} />

                            <td className="text-center">
                              {item.score != null ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm text-center fw-semibold"
                                  style={{
                                    width: 70,
                                    minWidth: 60,
                                    margin: "0 auto",
                                  }}
                                  value={
                                    editedScores[scoreKey] ??
                                    (item.score != null
                                      ? String(parseInt(String(item.score), 10))
                                      : "")
                                  }
                                  onChange={(e) =>
                                    handleScoreChange(scoreKey, e.target.value)
                                  }
                                  min={0}
                                  step={1}
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

            <div className="d-grid mt-3">
              <button
                className="btn btn-success btn-lg"
                onClick={() => onConfirmAll(editedScores)}
                disabled={isDraftLoading}
              >
                {isDraftLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>ยืนยันคะแนนทั้งหมด ({draftScores.length} รายการ)</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}