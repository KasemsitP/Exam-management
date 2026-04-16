import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { Loader2, ArrowUpDown } from "lucide-react";

import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectIsSystemLocked } from "@/store/slices/examData.slice";
import { DeleteCamp } from "@/utils/camp";

// ============================================================================
// Types
// ============================================================================
interface ActiveBagDto {
  lock_id: number;
  grader_id: number;
  bag_id: number;
  question_no: number;
  status: string;
  bag_no: string;
  session_id: number;
  session_code: string;
  total_booklets: number;
  min_random: number;
  max_random: number;
  subject_name: string;
  grader_name: string;
}

type SortDirection = "asc" | "desc";

// ============================================================================
// Main Component
// ============================================================================
export default function ActiveBagsPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const locked = useAppSelector(selectIsSystemLocked);
  const [rows, setRows] = useState<ActiveBagDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSession, setSelectedSession] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const campaignNumericId = activeCampaign?.id
    ? Number(DeleteCamp(String(activeCampaign.id)))
    : null;

  const sessionOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => r.session_code).filter(Boolean))
    ).sort();
  }, [rows]);

  const sortedRows = useMemo(() => {
    return [...rows]
      .filter((r) => (selectedSession ? r.session_code === selectedSession : true))
      .sort((a, b) => {
        const cmp = (a.session_code ?? "").localeCompare(b.session_code ?? "");
        return sortDirection === "asc" ? cmp : -cmp;
      });
  }, [rows, selectedSession, sortDirection]);

  useEffect(() => {
    if (!campaignNumericId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `/api/bags/grader/active/${campaignNumericId}`
        );
        const list = Array.isArray(data) ? data : data ? [data] : [];
        setRows(list);
      } catch (err: any) {
        console.error(err);
        Swal.fire("Error", "โหลดข้อมูลไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignNumericId]);

  const toggleSort = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
      <div className="d-flex flex-column gap-4">
        <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
          <div className="card mb-3" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
            <div className="card-header bg-white">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="mb-1">รายการถุงที่ใช้งาน</h5>
                  <small className="text-muted">แสดงรายการถุงข้อสอบที่กำลังตรวจอยู่ในขณะนี้</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <label className="small text-muted mb-0" style={{ whiteSpace: "nowrap" }}>เลือกวันที่สอบ:</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: 160 }}
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                  >
                    <option value="">ทั้งหมด</option>
                    {sessionOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {/* {selectedSession && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                      onClick={() => setSelectedSession("")}
                    >
                      ล้าง
                    </button>
                  )} */}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center p-4"><Loader2 className="spin-animation" /> กำลังโหลด...</div>
          ) : rows.length === 0 ? (
            <p className="text-center p-4 text-muted">ยังไม่มีถุงที่ใช้งานอยู่</p>
          ) : (
            <div className="card" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle text-nowrap mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">หมายเลขเลขถุง</th>
                        <th className="text-center">วิชา</th>
                        <th className="text-center">ลำดับจัดเก็บ</th>
                        <th className="text-center">ชื่อผู้ตรวจ</th>
                        
                        <th className="text-center">ตรวจข้อที่</th>
                        <th className="text-center">จำนวนเล่ม</th>
                        <th className="text-center">สถานะ</th>
                        {/* <th
                          className="text-center"
                          style={{ cursor: "pointer", userSelect: "none" }}
                          onClick={toggleSort}
                        >
                          <span className="d-inline-flex align-items-center gap-1">
                            รอบสอบ
                            <ArrowUpDown size={14} />
                          </span>
                        </th> */}
                        
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.lock_id}>
                           <td className="text-center">{row.bag_no ?? "-"}</td>
                          <td className="text-center">{row.subject_name ?? "-"}</td>
                           <td className="text-center">{row.min_random} - {row.max_random}</td>
                          <td className="text-center">{row.grader_name}</td>
                         
                         
                          <td className="text-center">{row.question_no}</td>
                          <td className="text-center">{row.total_booklets}</td>
                          <td className="text-center">
                            <span className={`badge ${row.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                              {row.status === "ACTIVE" ? "กำลังใช้งานถุงนี้อยู่" : row.status}
                            </span>
                          </td>
                          {/* <td className="text-center">{row.session_code}</td> */}
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </fieldset>
  );
}
