
import { CrmGrader } from "@/store/slices/graders.slice";

interface GradingAssignmentRecord{
  recent :  CrmGrader[]
}

export default function RecentScoresCard({ recent }: GradingAssignmentRecord) {
    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white d-flex align-items-center gap-2">
                <h6 className="mb-0">รายวิชาที่สามารถตรวจได้</h6>
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
                                    <th>รอบสอบ</th>
                                    <th>วิชา</th>
                                    <th>ชื่อหัวข้อ</th>
                                    <th className="text-end">หมายเลขข้อ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((g, idx) => (
                                    <tr key={`${g.subject_id}-${idx}`}>
                                        <td>{g.session_code}</td>
                                        <td>{g.subject_name}</td>
                                        <td>{g.question_label}</td>
                                        <td className="text-end">{g.question_no}</td>
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





