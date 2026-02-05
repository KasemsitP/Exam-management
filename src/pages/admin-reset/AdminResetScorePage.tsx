// src/pages/grading/recheck/AdminResetScoresPage.tsx
import axios from "axios";
import { useEffect, useState } from "react";
import type { DisputedQuestionDto } from "./types";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";
import { DeleteCamp } from "@/utils/camp";
import Swal from "sweetalert2";


export default function AdminResetScoresPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);

  const [rows, setRows] = useState<DisputedQuestionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [resettingSlotId, setResettingSlotId] = useState<number | null>(null);

  // แปลง campaign ให้เป็นตัวเลข เหมือน endpoint อื่นๆ
  const campaignNumericId = activeCampaign?.id
    ? Number(DeleteCamp(String(activeCampaign.id)))
    : null;

  // โหลดรายการข้อที่คะแนนต่างกันเยอะ
  useEffect(() => {
    if (!campaignNumericId) return; // ยังไม่รู้แคมเปญ อย่าพึ่งยิง

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<DisputedQuestionDto[]>(
          `/api/recheck/disputed/${campaignNumericId}`
        );
        setRows(data);
      } catch (err: any) {
        console.error(err);
        alert(
          err?.response?.data?.message ??
          "โหลดข้อมูลข้อที่คะแนนต่างกันเกิน threshold ไม่สำเร็จ"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [campaignNumericId]); // 👈 ต้องใส่ dep ด้วย ไม่งั้น campaign มาใหม่ effect ไม่ยิง

  const reloadRows = async () => {
    if (!campaignNumericId) return;
    try {
      const { data } = await axios.get<DisputedQuestionDto[]>(
        `/api/recheck/disputed/${campaignNumericId}`
      );
      setRows(data);
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
        "โหลดข้อมูลข้อที่คะแนนต่างกันเกิน threshold ไม่สำเร็จ"
      );
    }
  };

  const handleReset = async (row: DisputedQuestionDto) => {
    const slotId = row.slotId1;

    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการรีเซ็ตคะแนน",
      html: `
      <div style="text-align:left">
        <p>ต้องการรีเซ็ตคะแนนข้อนี้ใช่หรือไม่?</p>
        <p><strong>ผู้ตรวจ:</strong> ${row.graderName1} , ${row.graderName2}</p>
        <p><strong>ข้อ:</strong> ${row.questionNo}</p>
        <p><strong>ผลต่าง:</strong> ${row.diff}</p>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: "ยืนยันรีเซ็ต",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      setResettingSlotId(slotId);

      await axios.post(`/api/recheck/reset/${slotId}`);

      await Swal.fire({
        icon: "success",
        title: "รีเซ็ตคะแนนสำเร็จ",
        text: `ให้ผู้ตรวจ (${row.graderName1}, ${row.graderName2}) ตรวจใหม่`,
        timer: 1500,
        showConfirmButton: false,
      });

      await reloadRows();
    } catch (err: any) {
      console.error(err);

      await Swal.fire({
        icon: "error",
        title: "รีเซ็ตคะแนนไม่สำเร็จ",
        text: err?.response?.data?.message ?? "เกิดข้อผิดพลาด",
      });
    } finally {
      setResettingSlotId(null);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="container-fluid px-3 px-sm-4 py-4">
        <div className="card shadow-sm mb-3 ">
          <div className="card-header bg-white">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h5 className="mb-1">จัดการบัญชีผู้ใช้</h5>
                <small className="text-muted">
                  เพิ่ม ลบ แก้ไข และกำหนดข้อสำหรับผู้ตรวจ
                </small>
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <p>กำลังโหลด...</p>
        ) : rows.length === 0 ? (
          <p>ยังไม่มีข้อที่คะแนนต่างกันเกินเกณฑ์</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle">
              <thead>
                <tr>
                  <th>ถุง</th>
                  <th>วิชา</th>
                  <th>ข้อ</th>
                  <th>หัวข้อ</th>
                  <th>ผู้ตรวจ 1</th>
                  <th>คะแนน 1</th>
                  <th>ผู้ตรวจ 2</th>
                  <th>คะแนน 2</th>
                  <th>ผลต่าง</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.bookletId}-${row.subjectId}-${row.questionNo}`}
                  >
                    <td>{row.bagNo ?? "-"}</td>

                    <td>
                      <div>{row.subjectCode}</div>
                      <small className="text-muted">{row.subjectName}</small>
                    </td>

                    <td>{row.questionNo}</td>
                    <td>{row.questionLabel ?? "-"}</td>

                    <td>{row.graderName1}</td>
                    <td>{row.score1}</td>

                    <td>{row.graderName2}</td>
                    <td>{row.score2}</td>

                    <td className={row.diff >= 4 ? "text-danger fw-bold" : ""}>
                      {row.diff}
                    </td>

                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={resettingSlotId === row.slotId1}
                        onClick={() => handleReset(row)}
                      >
                        {resettingSlotId === row.slotId1
                          ? "กำลังรีเซ็ต..."
                          : "รีเซ็ตคะแนน"}
                      </button>
                    </td>
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
