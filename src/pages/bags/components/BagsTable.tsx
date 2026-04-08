// src/pages/bags/components/BagsTable.tsx
import { Trash2, QrCode } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useMemo, useRef } from "react";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableSkeleton } from "@/components/ui/Skeleton";

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
  isInitialLoading: boolean;
  onOpenCompose: (bagId: string) => void;
  onDeleteBag: (bagId: string) => void;
}

const ROW_HEIGHT = 53;

export default function BagsTable({
  filteredBags,
  isInitialLoading,
  onOpenCompose,
  onDeleteBag,
}: BagsTableProps) {
  const sortedBags = useMemo(() => {
    return [...filteredBags].sort(
      (a, b) => Number(a.bag_no) - Number(b.bag_no)
    );
  }, [filteredBags]);
  const locked = useAppSelector(selectIsSystemLocked);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sortedBags.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)", overflow: "hidden" }}>
      <div className="card-body p-0">
        <div
          ref={scrollRef}
          style={{ maxHeight: 520, overflow: "auto", WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
        >
          
          <table className="table table-hover align-middle mb-0 table-striped text-nowrap">
            <thead className="table-light text-uppercase small">
              <tr>
                <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 2 }}>หมายเลขถุง</th>
                <th style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 2 }}>รอบสอบ</th>
                <th className="text-center" style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 2 }}>จำนวนเล่ม</th>
                <th className="text-center" style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 2 }}>สแกนแล้ว</th>
                <th className="text-center" style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 2 }}>สถานะ</th>
                <th className="text-end" style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 2 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading ? (
                <TableSkeleton rows={8} cols={6} />
              ) : sortedBags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    ยังไม่มีถุงข้อสอบสำหรับสนามสอบนี้
                  </td>
                </tr>
              ) : (
                <>
                  {/* spacer ด้านบน */}
                  {virtualItems[0]?.start > 0 && (
                    <tr style={{ height: virtualItems[0].start }}>
                      <td colSpan={6} style={{ padding: 0, border: 0 }} />
                    </tr>
                  )}
                  {virtualItems.map((vRow) => {
                    const bag = sortedBags[vRow.index];
                    const st = getStatusStyle((bag as any).status);
                    return (
                      <tr key={bag.id} className="text-sm" style={{ height: ROW_HEIGHT }}>
                        <td className="fw-semibold text-start">
                          &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{String(bag.bag_no)}
                        </td>
                        <td>{bag.sessionLabel}</td>
                        <td className="text-center">{bag.capacity}</td>
                        <td className="text-center">{bag.scannedCount ?? 0}</td>
                        <td className="text-center">
                          <span className={`badge ${st.badge}`}>
                            {st.label === "SEALED" ? "ปิดผนึก" : st.label}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                              onClick={() => onOpenCompose(bag.id)}
                              disabled={bag.status === "ready" || bag.status === "incomplete"}
                            >
                              <QrCode size={14} />{" "}
                              {bag.status === "draft" ? "สแกน/จัดถุง" : "ดูรายการ"}
                            </button>
                            <ShowIfCan permission="manage_bags">
                              <button
                                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
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
                    );
                  })}
                  {/* spacer ด้านล่าง */}
                  {totalHeight - (virtualItems.at(-1)?.end ?? 0) > 0 && (
                    <tr style={{ height: totalHeight - (virtualItems.at(-1)?.end ?? 0) }}>
                      <td colSpan={6} style={{ padding: 0, border: 0 }} />
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
