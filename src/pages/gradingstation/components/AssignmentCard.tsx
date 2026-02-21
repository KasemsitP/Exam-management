import type { CrmGrader } from "@/store/slices/graders.slice";

interface GradingAssignmentRecord {
  recent: CrmGrader[];
}

export default function RecentScoresCard({ recent }: GradingAssignmentRecord) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex align-items-center gap-2">
        <h6 className="mb-0">รายวิชาที่สามารถตรวจได้</h6>
      </div>

      <div className="card-body p-3">
        <div className="table-responsive">
          <table className="table table-sm table-striped table-hover align-middle mb-0 text-nowrap">
            <thead className="table-light sticky-top">
              <tr>
                <th style={{ width: 60 }} className="text-center">
                  ลำดับ
                </th>
                <th style={{ minWidth: 200 }} className="text-center">วิชา</th>
                <th style={{ minWidth: 250 }} className="text-center">ชื่อหัวข้อ</th>
                <th style={{ width: 100 }} className="text-center">
                  หมายเลขข้อ
                </th>
                <th style={{ width: 100 }} className="text-end">
                  คะแนนเต็ม
                </th>
              </tr>
            </thead>

            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    ยังไม่มีรายการที่สามารถตรวจได้
                  </td>
                </tr>
              ) : (
                recent.map((g, idx) => (
                  <tr key={`${g.subject_id}-${idx}`}>
                    <td className="text-center">{idx + 1}</td>
                    <td className="text-center">{g.session_code} {g.subject_name}</td>
                    <td className="text-center">{g.question_label}</td>
                    <td className="text-center">{g.question_no}</td>
                    <td className="text-center">{g.max_score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}