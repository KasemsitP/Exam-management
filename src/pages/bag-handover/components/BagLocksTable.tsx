import { ClipboardCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import type { BagSummary, BagLock } from "../bagHandover.types";
// import types ที่เราสร้างไว้ใน slice
import type { BagProgressData, GraderHistoryCheckResult } from "@/store/slices/bagHandover.slice";

interface Props {
  filteredBags: BagSummary[];
  locks: BagLock[];
  selectedBagId: string;
  onSelectBagId: (id: string) => void;
  bagProgress?: BagProgressData | null;
  graderCheck?: GraderHistoryCheckResult | null;
}

export default function BagLocksTable({
  filteredBags,
  locks,
  selectedBagId,
  onSelectBagId,
  bagProgress,
  graderCheck,
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
      <div className="card-body table-responsive p-0">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-uppercase small">
            <tr>
              <th scope="col" className="ps-3">รหัสถุง</th>
              <th scope="col">วิชา / รอบ</th>
              <th scope="col">ผู้ตรวจ</th>
              <th scope="col" className="text-end pe-3">
                เจ้าหน้าที่ / เวลา
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBags.map((bag) => {
              const lock = locks.find(
                (item) => String(item.bagId) === String(bag.bag_no)
              );
              const isSelected = String(bag.bag_no) === String(selectedBagId);

              return (
                <>
                  {/* --- แถวหลัก --- */}
                  <tr
                    key={`${bag.id}-${bag.bag_no}`}
                    onClick={() => onSelectBagId(String(bag.bag_no))}
                    style={{ cursor: "pointer" }}
                    className={isSelected ? "table-primary border-bottom-0" : ""}
                  >
                    <td className="fw-semibold ps-3">
                      {String(bag.bag_no).padStart(3, "0")}
                    </td>
                    <td>
                      <div className="fw-medium">
                        {bag.subjectName ?? "ไม่ระบุวิชา"}
                      </div>
                      <div className="small text-muted">{bag.sessionLabel}</div>
                    </td>
                    <td>
                      {lock ? (
                        <span className="badge text-bg-light border border-1 text-dark">
                          {lock.graderName}
                        </span>
                      ) : (
                        <span className="badge text-bg-secondary opacity-50">ว่าง</span>
                      )}
                    </td>
                    <td className="text-end pe-3">
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

                  {/* --- แถวรายละเอียด (แสดงเฉพาะตอนเลือก) --- */}
                  {isSelected && (
                    <tr className="table-primary border-top-0">
                      <td colSpan={4} className="ps-3 pe-3 pb-3 pt-0">
                        <div className="card border-0 bg-white bg-opacity-50 p-3 rounded-3 shadow-sm">
                          <div className="row g-3">
                            
                            {/* ส่วนที่ 1: แจ้งเตือนผู้ตรวจซ้ำ */}
                            <div className="col-md-6">
                              <h6 className="small text-muted mb-2 text-uppercase fw-bold">
                                การตรวจสอบสิทธิ์
                              </h6>
                              {graderCheck ? (
                                graderCheck.hasGraded ? (
                                  <div className="alert alert-warning d-flex align-items-start gap-2 mb-0 py-2 px-3 small">
                                    <AlertCircle size={16} className="mt-1 flex-shrink-0" />
                                    <div>
                                      <strong>เคยตรวจแล้ว!</strong> ผู้ตรวจคนนี้เคยให้คะแนนในถุงนี้ไปแล้ว{" "}
                                      <u>{graderCheck.scoredCount} ข้อ</u>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="alert alert-success d-flex align-items-center gap-2 mb-0 py-2 px-3 small">
                                    <CheckCircle2 size={16} />
                                    <div>
                                      <strong>ผ่าน:</strong> ผู้ตรวจคนนี้ยังไม่เคยตรวจถุงนี้
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="text-muted small fst-italic">
                                  กรุณาเลือกผู้ตรวจเพื่อตรวจสอบสิทธิ์...
                                </div>
                              )}
                            </div>

                            {/* ส่วนที่ 2: ความคืบหน้าของถุง */}
                            <div className="col-md-6 border-start">
                              <h6 className="small text-muted mb-2 text-uppercase fw-bold">
                                ความคืบหน้าการตรวจ
                              </h6>
                              {bagProgress ? (
                                <div className="small">
                                  <div className="d-flex justify-content-between mb-1">
                                    <span>จำนวนข้อสอบทั้งหมด:</span>
                                    <strong>{bagProgress.totalItems}</strong>
                                  </div>
                                  <div className="d-flex justify-content-between mb-1 text-success">
                                    <span>ตรวจครบ 2 คนแล้ว:</span>
                                    <strong>{bagProgress.fullyAssigned}</strong>
                                  </div>
                                  <div className="d-flex justify-content-between mb-1 text-warning">
                                    <span>รอตรวจไม้ 2:</span>
                                    <strong>{bagProgress.halfAssigned}</strong>
                                  </div>
                                  <div className="d-flex justify-content-between text-danger">
                                    <span>ยังไม่มีคนตรวจ:</span>
                                    <strong>{bagProgress.unassigned}</strong>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-muted small">กำลังโหลดข้อมูล...</div>
                              )}
                            </div>

                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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