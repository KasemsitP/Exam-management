// src/pages/bag-handover/components/BagLogsCard.tsx
import { History } from "lucide-react";
import type { BagLogRecord, BagSummary } from "../bagHandover.types";

interface Props {
  logs: BagLogRecord[];
  bagMap: Record<string, BagSummary>;
  onSelectBagId: (id: string) => void;
}

export default function BagLogsCard({ logs, bagMap, onSelectBagId }: Props) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex align-items-center justify-content-between">
        <div>
          <h6 className="mb-1">บันทึกการส่งมอบล่าสุด</h6>
          {/* <small className="text-muted">
            ติดตามประวัติ Check-in / Check-out แยกตามถุง
          </small> */}
        </div>
        <History size={16} className="text-muted" />
      </div>
      <div className="card-body d-flex flex-column gap-2">
        {logs.slice(0, 8).map((log) => {
          const logBag = bagMap[String(log.bagId)];
          const displayBagNo =
            logBag?.bag_no ?? (log as any).bagNo ?? log.bagId;

          const logGraderName =
            (log as any).graderName ??
            (log.graderId ? `ID ${log.graderId}` : "-");

          const logOperatorName =
            (log as any).operatorName ??
            (log.operatorId ? `ID ${log.operatorId}` : "ไม่ระบุ/ระบบ");

          return (
            <div className="border rounded p-2">
              <div className="d-flex align-items-center justify-content-between">
                <p className="fw-semibold mb-0">
                  {String(displayBagNo).padStart(3, "0")}
                </p>
                <span
                  className={`badge ${log.action === "CHECK_OUT"
                      ? "text-bg-primary"
                      : "text-bg-secondary"
                    }`}
                >
                  {log.action === "CHECK_OUT" ? "ส่งมอบ" : "รับคืน"}
                </span>
              </div>

              <div className="small text-muted">
                วิชา: {logBag?.subjectName ?? "ไม่ระบุ"} (
                {logBag?.sessionLabel ?? "ไม่ระบุรอบ"})
              </div>

              <div className="small text-muted">
                ผู้ตรวจ: {logGraderName} • เจ้าหน้าที่: {logOperatorName}
              </div>

              <div className="small text-muted">
                {new Date(log.timestamp).toLocaleString("th-TH")}
              </div>

              {log.note && (
                <div className="small text-muted">หมายเหตุ: {log.note}</div>
              )}
            </div>
          );
        })}
        {logs.length === 0 && (
          <p className="text-center text-muted small mb-0">
            ยังไม่มีประวัติการส่งมอบ
          </p>
        )}
      </div>
    </div>
  );
}
