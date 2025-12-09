// src/pages/bag-handover/components/GradingHistoryCard.tsx
import type { GradingRecord } from "../bagHandover.types";

interface Props {
  graderIdForHistory: string | null;
  gradingRecords: GradingRecord[];
  gradingLoading: boolean;
  gradingError: string | null;
}

export default function GradingHistoryCard({
  graderIdForHistory,
  gradingRecords,
  gradingLoading,
  gradingError,
}: Props) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex align-items-center justify-content-between">
        <div>
          <h6 className="mb-1">ประวัติคะแนนล่าสุดของผู้ตรวจ</h6>
          <small className="text-muted">
            แสดงจากผู้ตรวจที่เลือกในฟอร์มหรือกำลังถือถุงอยู่
          </small>
        </div>
      </div>
      <div className="card-body">
        {!graderIdForHistory && (
          <p className="text-muted small mb-0">
            เลือกผู้ตรวจในฟอร์มหรือเลือกถุงที่มีผู้ตรวจอยู่
            เพื่อดูประวัติคะแนน
          </p>
        )}

        {graderIdForHistory && (
          <>
            {gradingLoading && (
              <p className="text-muted small">กำลังโหลดประวัติคะแนน...</p>
            )}
            {gradingError && (
              <p className="text-danger small mb-2">{gradingError}</p>
            )}

            {!gradingLoading &&
              !gradingError &&
              gradingRecords.length === 0 && (
                <p className="text-muted small mb-0">
                  ผู้ตรวจคนนี้ยังไม่มีประวัติการให้คะแนน
                </p>
              )}

            {gradingRecords.length > 0 && (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                  <thead className="table-light text-uppercase small">
                    <tr>
                      <th>Slot</th>
                      <th>คะแนน</th>
                      <th>เวลา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradingRecords.map((rec, idx) => (
                      <tr key={`${rec.slotId}-${idx}`}>
                        <td>{rec.slotId}</td>
                        <td className="fw-semibold">{rec.score}</td>
                        <td className="text-muted small">{rec.enteredAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
