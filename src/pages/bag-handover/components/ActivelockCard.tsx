import type { BagLock, BagSummary } from "../bagHandover.types";

interface Props {
  locks: BagLock[];
  bags: BagSummary[];
  selectedBagId: string;
  onSelectBagId: (id: string) => void;
}

export default function ActiveLocksCard({
  locks,
  bags,
  selectedBagId,
  onSelectBagId,
}: Props) {
  const bagMapByNo = bags.reduce<Record<string, BagSummary>>((map, b) => {
    map[String(b.bag_no)] = b;
    return map;
  }, {});

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between">
        <h6 className="mb-0">ถุงที่กำลังตรวจอยู่</h6>
        <span className="badge text-bg-primary">
          {locks.length} ถุง
        </span>
      </div>
      <div className="card-body d-flex flex-column gap-2">
        {locks.length === 0 && (
          <p className="text-muted small mb-0">
            ยังไม่มีถุงที่กำลังตรวจอยู่
          </p>
        )}
        {locks.map((lock) => {
          const bag = bagMapByNo[String(lock.bagId)];
          const isSelected =
            String(lock.bagId) === String(selectedBagId);

          return (
            <div
              key={lock.id}
              className={`border rounded p-2 ${
                isSelected ? "border-primary" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectBagId(String(lock.bagId))}
            >
              <div className="d-flex justify-content-between">
                <span className="fw-semibold">
                  ถุง {String(lock.bagId).padStart(3, "0")} •{" "}
                  {bag?.subjectName ?? "ไม่ระบุวิชา"}
                </span>
                <span className="badge text-bg-light">
                  {lock.graderName}
                </span>
              </div>
              <div className="small text-muted">
                รอบสอบ: {bag?.sessionLabel ?? "-"}
              </div>
              <div className="small text-muted">
                เจ้าหน้าที่: {lock.operatorName} •{" "}
                {new Date(lock.at).toLocaleString("th-TH")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}