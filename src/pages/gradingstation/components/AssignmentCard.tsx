
import { CrmGrader } from "@/store/slices/graders.slice";

interface GradingAssignmentRecord {
    recent: CrmGrader[]
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
                        {/* เพิ่ม text-nowrap เพื่อไม่ให้หัวตารางตัดบรรทัด และ align-middle จัดกลางแนวตั้ง */}
                        <table className="table align-middle table-hover">
                            <thead className="table-light text-nowrap">
                                <tr>
                                    {/* 1. รอบสอบ: ข้อความสั้น ใส่ width ฟิกซ์ไปเลย */}
                                    <th style={{ width: "100px" }}>รอบสอบ</th>

                                    {/* 2. วิชา: ข้อความยาว ใส่ minWidth เพื่อกันไม่ให้บี้จนเกินไป */}
                                    <th style={{ minWidth: "200px" }}>วิชา</th>

                                    {/* 3. ชื่อหัวข้อ: ยาวเหมือนกัน ให้พื้นที่เยอะหน่อย */}
                                    <th style={{ minWidth: "250px" }}>ชื่อหัวข้อ</th>

                                    {/* 4. หมายเลขข้อ: สั้นมาก */}
                                    <th className="text-center" style={{ width: "100px" }}>
                                        หมายเลขข้อ
                                    </th>

                                    {/* 5. คะแนนเต็ม: สั้นมาก */}
                                    <th className="text-end" style={{ width: "100px" }}>
                                        คะแนนเต็ม
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((g, idx) => (
                                    <tr key={`${g.subject_id}-${idx}`}>
                                        {/* ใส่ text-nowrap ให้รอบสอบ ถ้าไม่อยากให้ "วันที่ 1" ตัดบรรทัด */}
                                        <td className="text-nowrap">{g.session_code}</td>

                                        <td>{g.subject_name}</td>

                                        <td>{g.question_label}</td>

                                        <td className="text-center">{g.question_no}</td>

                                        <td className="text-end fw-bold">{g.max_score}</td>
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





