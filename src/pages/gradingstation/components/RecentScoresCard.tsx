// components/RecentScoresCard.tsx
import { Timer } from "lucide-react";
import type { RecordedScore } from "../hooks/useGradingStation";

interface RecentScoresCardProps {
  recent: RecordedScore[];
}

export default function RecentScoresCard({ recent }: RecentScoresCardProps) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex align-items-center gap-2">
        <Timer className="text-primary" size={16} />
        <h6 className="mb-0">รายการล่าสุด</h6>
      </div>
      <div className="card-body">
        {recent.length === 0 ? (
          <div className="text-muted small">
            ยังไม่มีรายการบันทึกคะแนน
            จะปรากฏที่นี่หลังจากบันทึกสำเร็จ
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>เวลา</th>
                  <th>รหัสผู้เข้าสอบ</th>
                  <th className="text-end">คะแนน</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, idx) => (
                  <tr key={`${r.slotId}-${idx}`}>
                    <td>{r.enteredAt}</td>
                    <td>{r.slotId}</td>
                    <td className="text-end fw-semibold">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
