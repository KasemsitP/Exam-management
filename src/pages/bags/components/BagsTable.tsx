// src/pages/bags/components/BagsTable.tsx
import { Trash2, QrCode } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useMemo } from "react";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";

type BagStatusKey = "draft" | "ready" | "incomplete";

const STATUS_STYLE: Record<
  BagStatusKey,
  { badge: string; label: string }
> = {
  draft: { badge: "text-bg-primary", label: "รอประกอบ" },
  ready: { badge: "text-bg-success", label: "พร้อมใช้งาน" },
  incomplete: { badge: "text-bg-warning", label: "ไม่ครบ 30" },
};

const getStatusStyle = (status: string | undefined) => {
  if (!status)
    return { badge: "text-bg-secondary", label: "ไม่ทราบ" as const };
  const m = STATUS_STYLE[status as BagStatusKey];
  return m ?? { badge: "text-bg-secondary", label: status };
};

interface BagsTableProps {
  filteredBags: any[];
  bagStatus: string;
  onOpenCompose: (bagId: string) => void;
  onDeleteBag: (bagId: string) => void;
}

export default function BagsTable({
  filteredBags,
  bagStatus,
  onOpenCompose,
  onDeleteBag,
}: BagsTableProps) {
  const sortedBags = useMemo(() => {
    return [...filteredBags].sort(
      (a, b) => Number(a.bag_no) - Number(b.bag_no)
    );
  }, [filteredBags]);
  const locked = useAppSelector(selectIsSystemLocked);
  return (
    <div className="card shadow-sm">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-striped">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>หมายเลขถุง</th>
                <th>รอบสอบ</th>
                <th className="text-center">จำนวนเล่ม</th>
                <th className="text-center">สแกนแล้ว</th>
                <th className="text-center">สถานะ</th>
                <th className="text-end">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedBags.map((bag) => (
                <tr key={bag.id} className="text-sm">
                  <td className="fw-semibold">
                    {String(bag.bag_no).padStart(3, "0")}
                  </td>
                  <td>{bag.sessionLabel}</td>
                  <td className="text-center">{bag.capacity}</td>
                  <td className="text-center">{bag.scannedCount ?? 0}</td>
                  <td className="text-center">
                    {(() => {
                      const st = getStatusStyle((bag as any).status);
                      return (
                        <span className={`badge ${st.badge}`}>
                          {st.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={() => onOpenCompose(bag.id)}
                        disabled={
                          bag.status === "ready" ||
                          bag.status === "incomplete"
                        }
                      >
                        <QrCode size={14} />{" "}
                        {bag.status === "draft"
                          ? "สแกน/จัดถุง"
                          : "ดูรายการ"}
                      </button>
                      <ShowIfCan permission="manage_bags">
                        <button
                          className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 "
                          onClick={() => onDeleteBag(bag.id)}
                          title="ลบถุง"
                          disabled={locked}
                        >
                          <Trash2 size={16} />
                          ลบถุง
                        </button>
                      </ShowIfCan>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBags.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    {bagStatus === "loading"
                      ? "Loading..."
                      : "ยังไม่มีถุงข้อสอบสำหรับสนามสอบนี้"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
