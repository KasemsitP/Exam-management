// components/RecentScoresCard.tsx
import type { RecordedScore } from "../hooks/useGradingStation";

interface RecentScoresCardProps {
  recent: RecordedScore[];
}
const parseThaiDate = (dateStr) => {
  // สมมติ dateStr คือ "22/02/2569 07:12:03"
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, yearBE] = datePart.split('/');
  
  // ลบ 543 เพื่อเปลี่ยนเป็น ค.ศ.
  const yearAD = parseInt(yearBE) - 543;
  
  // สร้าง ISO format: YYYY-MM-DDTHH:mm:ss
  return `${yearAD}-${month}-${day}T${timePart}`;
};

export default function RecentScoresCard({ recent }: RecentScoresCardProps) {
  return (
    <div className="card" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
      <div className="card-header bg-white d-flex align-items-center gap-2">
        {/* <Timer className="text-primary" size={16} /> */}
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
            <table className="table table-sm table-striped table-hover align-middle mb-0 text-nowrap">
              <thead className="table-light sticky-top">
                <tr>
                  <th style={{ width: 60 }} className="text-center">ลำดับ</th>
                  <th className="text-center">เลขรหัส</th>
                  <th className="text-center">คะแนน</th>
                  <th className="text-center">Payload</th>
                  <th className="text-center" style={{ width: 150 }}>เวลา</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      ยังไม่มีรายการบันทึกคะแนน
                    </td>
                  </tr>
                ) : (
                  recent.map((r, index) => (
                    <tr key={`${r.slotId}-${index}`}>
                      <td className="text-center">{index + 1}</td>
                      <td className="text-center">{r.random_num}</td>
                      <td className="text-center fw-semibold">{r.score}</td>
                      <td className="text-truncate" style={{ maxWidth: 250 }}>
                        <span className="font-monospace">{r.qr_payload}</span>
                      </td>
                      <td className="text-center">
                        {new Date(parseThaiDate(r.enteredAt)).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
