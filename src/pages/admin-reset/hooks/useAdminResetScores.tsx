// src/pages/grading/recheck/hooks/useAdminResetScores.ts
// src/pages/grading/recheck/hooks/useAdminResetScores.ts
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useToast } from "@/components/ui/use-toast";
import type { DisputedQuestionDto } from "../types";





export const useAdminResetScores = () => {
  const { toast } = useToast();

  const [rows, setRows] = useState<DisputedQuestionDto[]>([]);
  const [loading, setLoading] = useState(false);

  // เก็บ slotId ที่กำลัง reset อยู่ (จะใช้ slotId1 เป็นตัวแทน)
  const [resettingId, setResettingId] = useState<number | null>(null);

  const fetchRows = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get<DisputedQuestionDto[]>(
        "/api/recheck/disputed"
      );

      
      setRows(
        data.map((r) => ({
          ...r,
          lastEnteredAt: r.lastEnteredAt
            ? new Date(r.lastEnteredAt).toISOString()
            : undefined,
        }))
      );
    } catch (err: any) {
      console.error(err);
      toast({
        title: "ดึงข้อมูลไม่สำเร็จ",
        description:
          err?.response?.data?.message ?? err.message ?? "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRows();
  }, []);

  /**
   * resetRow: รับทั้งแถวเลย จะได้รู้ context (bookletId/subjectId/questionNo)
   * แล้วเรียก API โดยใช้ slotId1 เป็นตัวแทนกลุ่มนี้
   */
  const resetRow = async (row: DisputedQuestionDto) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการรีเซ็ตคะแนน",
      text:
        "ระบบจะลบคะแนนของผู้ตรวจทุกคนในข้อนี้ และต้องตรวจใหม่ทั้งหมด",
      showCancelButton: true,
      confirmButtonText: "ยืนยันรีเซ็ต",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      setResettingId(row.slotId1);

      // backend เราออกแบบให้รับ slotId ใดก็ได้ในคู่
      await axios.post(`/api/grading-recheck/reset/${row.slotId1}`);

      await Swal.fire({
        icon: "success",
        title: "รีเซ็ตคะแนนสำเร็จ",
        text: `ข้อที่ ${row.questionNo} | วิชา ${row.subjectCode} ถูกรีเซ็ตแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      });

      // ลบแถวนี้ออกจาก list โดยใช้ key (booklet+subject+question)
      setRows((prev) =>
        prev.filter(
          (r) =>
            !(
              r.bookletId === row.bookletId &&
              r.subjectId === row.subjectId &&
              r.questionNo === row.questionNo
            )
        )
      );
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "รีเซ็ตคะแนนไม่สำเร็จ",
        text:
          err?.response?.data?.message ?? err.message ?? "เกิดข้อผิดพลาด",
      });
    } finally {
      setResettingId(null);
    }
  };

  return {
    rows,
    loading,
    resettingId,
    resetRow,
    refetch: fetchRows,
  };
};
