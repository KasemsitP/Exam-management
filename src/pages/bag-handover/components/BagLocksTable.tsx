// src/pages/bag-handover/components/BagLocksTable.tsx
import { ClipboardCheck } from "lucide-react";
import type { BagSummary, BagLock } from "../bagHandover.types";

interface Props {
  filteredBags: BagSummary[];
  locks: BagLock[];
  selectedBagId: string;
  onSelectBagId: (id: string) => void;
}

export default function BagLocksTable({
  filteredBags,
  locks,
  selectedBagId,
  onSelectBagId,
}: Props) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white d-flex align-items-center justify-content-between">
        <div>
          <h6 className="mb-1">สถานะการครอบครองถุง</h6>
          <small className="text-muted">
            แสดงรายการถุงทั้งหมดพร้อมผู้ตรวจ
          </small>
        </div>
        <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
          <ClipboardCheck size={14} /> {locks.length} ถุงที่กำลังตรวจ
        </span>
      </div>
      <div className="card-body table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-uppercase small">
            <tr>
              <th scope="col">รหัสถุง</th>
              <th scope="col">วันที่สอบ </th>
              <th scope="col">ผู้ตรวจ</th>
              <th scope="col" className="text-end">
                เจ้าหน้าที่ / เวลา
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBags.map((bag) => {
              const lock = locks.find(
                (item) => String(item.bagId) === String(bag.bag_no) // 👈 bagId = bag_no ตาม DTO ปัจจุบัน
              );
              const isSelected = String(bag.bag_no) === String(selectedBagId);

              return (
                <tr
                  key={`${bag.id}-${bag.bag_no}`}            // ✅ key ใช้ bag.id + bag_no ให้ unique
                  onClick={() => onSelectBagId(String(bag.bag_no))} // 👈 state ใช้ bag_no
                  style={{ cursor: "pointer" }}
                  className={isSelected ? "table-primary" : ""}
                >
                  <td className="fw-semibold">
                    {String(bag.bag_no).padStart(3, "0")}    {/* ✅ แสดง bag_no */}
                  </td>
                  {/* <p> {bag.id} adadad {bag.bag_no}</p> */}
                  <td>
                    <div className="fw-medium">
                      {bag.sessionLabel ?? "ไม่ระบุวิชา"}
                    </div>
                    {/* <div className="small text-muted">{bag.sessionLabel}</div> */}
                  </td>
                  <td>
                    {lock ? (
                      <span className="badge text-bg-light border border-1">
                        {lock.graderName}
                      </span>
                    ) : (
                      <span className="badge text-bg-secondary">ว่าง</span>
                    )}
                  </td>
                  <td className="text-end">
                    {lock ? (
                      <>
                        <div className="small">{lock.operatorName}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>
                          {new Date(lock.at).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredBags.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  ยังไม่มีถุงในแคมเปญ / รอบสอบนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
