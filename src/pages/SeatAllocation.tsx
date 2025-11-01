import { useMemo, useState } from "react";
import { DownloadCloud, PlayCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectCurrentSession } from "@/store/slices/sessions.slice";
import {
  runSeatAllocation,
  seatAssignmentsCleared,
  seatExportFinished,
  seatExportStarted,
  selectSeatAllocationMeta,
  selectSeatAssignments,
  selectSeatViolations,
} from "@/store/slices/seats.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

export default function SeatAllocationPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const currentSession = useAppSelector(selectCurrentSession);
  const assignments = useAppSelector(selectSeatAssignments);
  const violations = useAppSelector(selectSeatViolations);
  const meta = useAppSelector(selectSeatAllocationMeta);

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10_000));

  const seatsAssigned = useMemo(
    () => assignments.filter((a) => a.participantId !== null).length,
    [assignments]
  );

  const handleAllocate = () => {
    if (!currentSession) {
      toast({
        title: "กรุณาเลือกรอบสอบ",
        description: "การจัดที่นั่งต้องมีรอบสอบที่เลือกอยู่ก่อน",
        variant: "destructive",
      });
      return;
    }
    dispatch(runSeatAllocation({ seed: Number(seed), sessionId: currentSession.id }));
    toast({ title: "กำลังจัดที่นั่ง", description: `ดำเนินการด้วยค่า seed ${seed}` });
  };

  const handleReset = () => {
    dispatch(seatAssignmentsCleared());
    toast({ title: "ล้างการจัดที่นั่งแล้ว", description: "รีเซ็ตการจัดที่นั่งทั้งหมดเรียบร้อย" });
  };

  const handleExport = () => {
    dispatch(seatExportStarted());
    setTimeout(() => {
      dispatch(seatExportFinished());
      toast({ title: "พร้อมให้ดาวน์โหลด", description: "สร้างไฟล์ CSV เรียบร้อยแล้ว (จำลอง)" });
    }, 600);
  };

  return (
    <div className="container py-4">
      {/* Header Card */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-lg-between">
            <div>
              <h5 className="card-title mb-1">การจัดที่นั่ง</h5>
              <p className="card-text text-muted mb-0">
                ตั้งค่า seed สุ่มเพื่อให้ได้ผลลัพธ์ซ้ำได้ และตรวจสอบข้อผิดพลาดที่เกิดขึ้น
              </p>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2 small">
              <span className="badge text-bg-light">ซีด {meta.lastSeed ?? "—"}</span>
              <span className="badge text-bg-light">
                จัดที่นั่งแล้ว {seatsAssigned}/{assignments.length}
              </span>
              <span className={`badge ${violations.length ? "text-bg-danger" : "text-bg-light"}`}>
                {violations.length} ข้อผิดพลาด
              </span>
            </div>
          </div>
        </div>

        <div className="card-body d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-lg-between">
          {/* Seed input */}
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="seed" className="form-label mb-0 small text-muted">
              ค่า seed สุ่ม
            </label>
            <input
              id="seed"
              type="number"
              className="form-control"
              style={{ width: "8rem" }}
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
            <button
              type="button"
              className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center"
              onClick={() => setSeed(Math.floor(Math.random() * 9999))}
              aria-label="สุ่มค่า seed"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="d-flex flex-wrap gap-2">
            <ShowIfCan permission="allocate_seats">
              <button
                type="button"
                onClick={handleAllocate}
                disabled={meta.allocating}
                className="btn btn-primary d-inline-flex align-items-center gap-2"
              >
                <PlayCircle size={16} />
                {meta.allocating ? "กำลังจัดที่นั่ง..." : "เริ่มจัดที่นั่ง"}
              </button>
            </ShowIfCan>

            <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
              รีเซ็ต
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
              onClick={handleExport}
              disabled={meta.exporting}
            >
              <DownloadCloud size={16} />
              {meta.exporting ? "กำลังส่งออก..." : "ส่งออก CSV"}
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
