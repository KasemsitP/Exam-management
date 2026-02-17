// src/pages/.../SignSheetsPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  FileDown,
  Users,
  Loader2,
  Search,
  Printer,
  Download,
  X,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import QRCodeLib from "qrcode";

import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";

/* -------------------------------------------------------------------------- */
/*  Helper: debounce                                                          */
/* -------------------------------------------------------------------------- */

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

const ITEMS_PER_PAGE = 5; // จำนวนแถวต่อหน้าใน table

type SignSheetRow = {
  user_session_id: number;
  user_id: number;
  userCode: string;
  firstName: string;
  lastName: string;
  roomName: string | null;
  seat_code: string | null;
  qr_payload: string | null;
  row_no: number
};

type SignSheetApiResponse = {
  data: SignSheetRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/* -------------------------------------------------------------------------- */
/*  QR Preview ด้วย lib `qrcode` (เหมือน backend มากที่สุด)                   */
/* -------------------------------------------------------------------------- */

type QrPreviewProps = {
  value: string;
  size?: number;
  onClick?: () => void;
};

const QrPreview: React.FC<QrPreviewProps> = ({ value, size = 56, onClick }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!value) {
      setSrc(null);
      return;
    }

    QRCodeLib.toDataURL(value, {
      width: 350, // ใช้ resolution สูง แล้วค่อย scale ลง
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch((err) => {
        console.error("QR generate error:", err);
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt="QR preview"
      style={{
        width: size,
        height: size,
        display: "block",
        margin: "0 auto",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    />
  );
};



/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function SignSheetsPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessionsUnSorted = useAppSelector(selectActiveCampaignSessions) as any[];

  // ฟอร์มด้านบน
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [course, setCourse] = useState("วิชา ABC123");
  const [sessionText, setSessionText] = useState("20/10/65 09:00–10:00");
  const [org, setOrg] = useState("สถาบันการศึกษา XXX");

  // Table state
  const [rows, setRows] = useState<SignSheetRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // สำหรับขยาย QR
  const [enlargedQr, setEnlargedQr] = useState<string | null>(null);

  const emptyRows = page > 0 ? Math.max(0, ITEMS_PER_PAGE - rows.length) : 0;

  const getDayNumber = (code: string): number => {
    const match = code.match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  };

  const sessions = [...sessionsUnSorted].sort((s1, s2) => {
    const date1 = getDayNumber(s1.session_code);
    const date2 = getDayNumber(s2.session_code);
    return date1 - date2;
  });
  console.log("sessionSorted", sessions)

  /* ------------------------------- Init session ---------------------------- */

  useEffect(() => {
    if (!sessions.length) return;

    // ตั้งค่า default เป็น session แรก
    if (!selectedSessionId) {
      setSelectedSessionId(String(sessions[0].id));
    }
  }, [sessions, selectedSessionId]);

  // sync course + sessionText เมื่อเปลี่ยน session
  useEffect(() => {
    const s = sessions.find((sess) => String(sess.id) === selectedSessionId);
    if (!s) return;

    setCourse((prev) => s.subjects?.[0]?.name ?? prev);
    setSessionText(
      `${new Date(s.examDate).toLocaleDateString("th-TH")} ${s.subjects?.[0]?.startTime ?? ""}–${s.subjects?.[0]?.endTime ?? ""}`
    );
  }, [sessions, selectedSessionId]);

  // sync org จาก campaign
  useEffect(() => {
    if (activeCampaign?.name) {
      console.log("session", sessions)
      setOrg(activeCampaign.name);
    }
  }, [activeCampaign]);

  /* -------------------------- Fetch table data ---------------------------- */

  const fetchData = useCallback(async () => {
    if (!activeCampaign?.id || !selectedSessionId) return;

    const numericSessionId = parseInt(
      String(selectedSessionId).replace("sess-", ""),
      10
    );
    if (Number.isNaN(numericSessionId)) return;

    // เริ่มโหลด แต่ *ไม่* ล้าง rows เพื่อไม่ให้ table แฟลชหาย
    setIsLoading(true);
    try {
      const res = await axios.get<SignSheetApiResponse>(
        `/api/signsheet/campaign/${activeCampaign.id}/session/${numericSessionId}`,
        {
          params: {
            page,
            limit: ITEMS_PER_PAGE,
            search: debouncedSearch || undefined,
          },
        }
      );
      console.log(res.data)
      setRows(res.data.data);
      setTotalCount(res.data.meta.total);
      setTotalPages(res.data.meta.totalPages || 1);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "โหลดรายชื่อผู้เข้าสอบไม่สำเร็จ",
        text: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeCampaign?.id, selectedSessionId, page, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ถ้าเปลี่ยน session หรือ คำค้น ให้กลับไปหน้า 1
  useEffect(() => {
    setPage(1);
  }, [selectedSessionId, debouncedSearch]);

  /* ------------------------------ Handlers -------------------------------- */

  const handleDownloadPdf = async () => {
    if (!activeCampaign?.id || !selectedSessionId) return;

    const numericSessionId = parseInt(
      String(selectedSessionId).replace("sess-", ""),
      10
    );
    if (Number.isNaN(numericSessionId)) return;

    setIsExportingPdf(true);

    try {
      Swal.fire({
        title: "กำลังสร้างไฟล์ PDF...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `/api/signsheet/campaign/${activeCampaign.id}/session/${numericSessionId}/pdf`,
        {
          params: { course, org, sessionText },
          responseType: "blob",
        }
      );

      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => URL.revokeObjectURL(url), 10000);

    } catch (error) {
      Swal.close();
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Export PDF ล้มเหลว",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadSeatPlan = async () => {
    if (!activeCampaign?.id || !selectedSessionId) return;

    const numericSessionId = parseInt(
      String(selectedSessionId).replace("sess-", ""),
      10
    );
    if (Number.isNaN(numericSessionId)) return;

    try {
      // ✅ เปิด loading modal
      Swal.fire({
        title: "กำลังสร้างผังที่นั่งสอบ...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `/api/seatplan/campaign/${activeCampaign.id}/session/${numericSessionId}/pdf`,
        { responseType: "blob" }
      );

      // ✅ ปิด loading
      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // (optional) แจ้งสำเร็จสั้น ๆ
      // Swal.fire({
      //   icon: "success",
      //   title: "ดาวน์โหลดสำเร็จ",
      //   timer: 1200,
      //   showConfirmButton: false,
      // });

    } catch (err) {
      Swal.close(); // ปิด loading ก่อน

      console.error(err);
      Swal.fire({
        icon: "error",
        title: "ดาวน์โหลดผังที่นั่งสอบไม่สำเร็จ",
      });
    }
  };


  const handleDownloadSeatPlanNameList = async () => {
    if (!activeCampaign?.id) return;

    try {
      //  เปิด loading ก่อน
      Swal.fire({
        title: "กำลังสร้างไฟล์ PDF...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `/api/seatplan/campaign/${activeCampaign.id}/name-list-pdf`,
        { responseType: "blob" }
      );

      // ✅ ปิด loading
      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

    } catch (err) {
      Swal.close(); // ปิด loading ก่อน

      console.error(err);
      Swal.fire({
        icon: "error",
        title: "ดาวน์โหลดรายชื่อผู้มีสิทธิ์สอบไม่สำเร็จ",
      });
    }
  };



  const handlePrint = () => {
    if (!rows.length) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูลผู้เข้าสอบ",
        text: "กรุณาเลือก session ที่มีข้อมูลก่อนพิมพ์",
      });
      return;
    }

    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 50);
  };

  const handleExportCsvCurrentPage = () => {
    if (!rows.length) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีข้อมูลในหน้านี้",
      });
      return;
    }

    const header = "รหัส,ชื่อ,นามสกุล,ห้อง,ที่นั่ง,qr_payload (Encrypted)";
    const lines = rows.map((r) =>
      [
        r.userCode,
        r.firstName,
        r.lastName,
        r.roomName ?? "-",
        r.seat_code ?? "-",
        r.qr_payload ?? "NULL",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signsheet_page${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: "success",
      title: "ส่งออก CSV สำเร็จ",
      text: `หน้าปัจจุบันหน้า ${page}`,
    });
  };

  /* ------------------------------------------------------------------------ */

  return (
    <ShowIfCan permission="view_sessions">
      <div className="container-fluid px-3 px-sm-4 py-4">
        {/* =========================
          Card A: Header + Exam Info
         ========================= */}
        <div className="card shadow-sm mb-4">
          {/* Header */}
          <div className="card-header bg-white">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              {/* Left */}
              <div>
                <h5 className="mb-1">รายชื่อผู้เข้าสอบและคิวอาร์โค้ด (QR-code)</h5>
                <small className="text-muted">
                  ในรอบสอบ {activeCampaign?.name ?? "-"}
                </small>
              </div>

              {/* Right */}
              <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mt-lg-0">
                <div className="input-group" style={{ width: 260 }}>
                  <span className="input-group-text bg-white border-end-0">
                    <Search size={16} className="text-muted" />
                  </span>
                  <input
                    className="form-control border-start-0"
                    placeholder="ค้นหา ชื่อ/รหัส/ห้อง"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-success d-inline-flex align-items-center gap-2"
                  onClick={handleDownloadSeatPlanNameList}
                  disabled={isExportingPdf || !selectedSessionId}
                >
                  {isExportingPdf ? (
                    <Loader2 size={16} className="spin-animation" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  ดาวน์โหลดรายชื่อผู้มีสิทธิ์สอบ
                </button>

                <button
                  className="btn btn-warning d-inline-flex align-items-center gap-2"
                  onClick={handleDownloadSeatPlan}
                  disabled={isExportingPdf || !selectedSessionId}
                >
                  {isExportingPdf ? (
                    <Loader2 size={16} className="spin-animation" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  ดาวน์โหลดผังที่นั่งสอบ
                </button>

                <button
                  className="btn btn-info d-inline-flex align-items-center gap-2 text-white"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf || !selectedSessionId}
                >
                  {isExportingPdf ? (
                    <Loader2 size={16} className="spin-animation" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  ดาวน์โหลดใบรายชื่อ
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="card-body">
            <div className="row g-3">
              {/* ===== Exam info (การ์ดย่อยแบบเรียบ เข้าธีม) ===== */}
              <div className="col-12">
                <div className="card shadow-none border">
                  <div className="card-body">
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                      <div>
                        <div className="text-uppercase mb-1">
                          ข้อมูลการสอบ
                        </div>
                        {/* <div className="fw-semibold">
                        {course || "—"}{" "}
                        <span className="text-muted fw-normal">
                          {org ? `• ${org}` : ""}
                        </span>
                      </div> */}
                        {/* <small className="text-muted">{sessionText || "—"}</small> */}
                      </div>

                      {/* <div>
                      {selectedSessionId ? (
                        <span className="badge bg-success-subtle text-success-emphasis">
                          เลือกรอบแล้ว
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis">
                          ยังไม่ได้เลือกรอบ
                        </span>
                      )}
                    </div> */}
                    </div>

                    <div className="row g-3">
                      <div className="col-12 col-md-6 col-lg-3">
                        <label className="form-label">วิชาที่สอบ</label>
                        <select
                          className="form-select"
                          value={selectedSessionId}
                          onChange={(e) => setSelectedSessionId(e.target.value)}
                        >
                          {sessions.map((s) => {
                            const subjectNames =
                              s.subjects?.map((sub) => sub.name).join(", ") ?? "-";

                            return (
                              <option key={s.id} value={s.id}>
                                {s.session_code} {subjectNames}
                                {/* {new Date(s.examDate).toLocaleDateString("th-TH")} */}
                              </option>
                            );
                          })}

                          {!sessions.length && (
                            <option value="">ไม่มีข้อมูลรอบการสอบ</option>
                          )}
                        </select>
                      </div>

                      <div className="col-12 col-md-6 col-lg-3">
                        <label className="form-label">วิชา</label>
                        <input
                          className="form-control"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          placeholder="เช่น วิชากฎหมาย..."
                          disabled={true}
                        />
                      </div>

                      <div className="col-12 col-md-6 col-lg-3">
                        <label className="form-label">วัน / เวลา</label>
                        <input
                          className="form-control"
                          value={sessionText}
                          onChange={(e) => setSessionText(e.target.value)}
                          placeholder="เช่น 31 ม.ค. 2569 09:00–12:00"
                          disabled={true}
                        />
                      </div>

                      <div className="col-12 col-md-6 col-lg-3">
                        <label className="form-label">รอบสอบ</label>
                        <input
                          className="form-control"
                          value={org}
                          onChange={(e) => setOrg(e.target.value)}
                          placeholder="เช่น สนามใหญ่อัยการ 2568"
                          disabled={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
          Card B: Table (no A4 split)
         ========================= */}
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-semibold">{course}</div>
              {/* <div className="small text-muted">
                {org} — {sessionText}
              </div> */}
            </div>

            <div className="small text-muted d-flex align-items-center gap-2">
              <span>
                พบ {totalCount} คน | หน้า {page}/{totalPages}
              </span>
              {isLoading && (
                <Loader2
                  size={16}
                  className="spin-animation"
                  style={{ marginTop: -2 }}
                />
              )}
            </div>
          </div>

          <div className="card-body p-0 position-relative"> {/* เพิ่ม position-relative เพื่อให้ Overlay ทำงานได้ */}

            {/* =========================================================
      Loading Overlay: แสดงตอนกำลังโหลดหน้าถัดไป (ข้อมูลเก่ามัวลง)
      ========================================================= */}
            {isLoading && rows.length > 0 && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.6)", // พื้นหลังสีขาวจางๆ
                  zIndex: 10,
                  backdropFilter: "blur(1px)" // (Optional) เบลอข้อมูลเก่าเล็กน้อย
                }}
              >
                <div className="bg-white p-2 rounded shadow-sm border d-flex align-items-center gap-2">
                  <Loader2 size={20} className="spin-animation text-primary" />
                  <span className="small fw-medium text-muted">กำลังโหลด...</span>
                </div>
              </div>
            )}

            <div className="table-responsive" style={{ minHeight: "300px" }}> {/* กำหนด minHeight กันตารางยุบ */}
              <table className="table table-hover align-middle mb-0 table-striped">
                <thead className="table-light sticky-top">
                  <tr>
                    {/* ... หัวตารางเหมือนเดิม ... */}
                    <th style={{ width: 60 }} className="text-center text-nowrap">ลำดับ</th>
                    <th style={{ width: 140 }} className="text-nowrap">รหัสผู้เข้าสอบ</th>
                    <th>ชื่อ - นามสกุล</th>
                    <th style={{ width: 50 }} className="text-center">แถว</th>
                    <th style={{ width: 180 }}>ห้อง / ที่นั่ง</th>
                    <th style={{ width: 140 }} className="text-center">QR</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Case 1: Loading ครั้งแรก (ยังไม่มีข้อมูลเลย) */}
                  {rows.length === 0 && isLoading && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted" style={{ height: "300px" }}>
                        <Loader2 size={30} className="mb-2 spin-animation text-primary" />
                        <div>กำลังโหลดข้อมูล...</div>
                      </td>
                    </tr>
                  )}

                  {/* Case 2: ไม่มีข้อมูล (Empty State) */}
                  {rows.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted" style={{ height: "300px" }}>
                        <div className="mb-2">🚫</div>
                        ไม่พบข้อมูลผู้เข้าสอบในหน้านี้
                      </td>
                    </tr>
                  )}

                  {/* Case 3: มีข้อมูล (Render Rows) */}
                  {rows.map((r, idx) => (
                    <tr
                      key={r.user_session_id}
                      style={{
                        height: "65px",
                        opacity: isLoading ? 0.4 : 1,   // <--- จุดสำคัญที่ช่วยลดการกระพริบ
                        transition: "opacity 0.2s ease" // <--- ช่วยให้นุ่มนวลขึ้น
                      }}
                    >
                      <td className="text-center text-muted small">
                        {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="fw-semibold text-nowrap">{r.userCode}</td>
                      <td>
                        <div className="fw-medium">
                          {r.firstName} {r.lastName}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark">{r.row_no ?? "-"}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span className="badge bg-secondary-subtle text-secondary-emphasis align-self-start">
                            ห้อง {r.roomName ?? "-"}
                          </span>
                          {r.seat_code && (
                            <small className="text-muted">ที่นั่ง: {r.seat_code}</small>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {r.qr_payload ? (
                          <QrPreview
                            value={r.qr_payload}
                            size={52}
                            onClick={() => setEnlargedQr(r.qr_payload)}
                          />
                        ) : (
                          <span className="badge bg-danger-subtle text-danger-emphasis">
                            ไม่มี QR
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* =========================================================
            Spacer Rows: เติมแถวว่างให้เต็มหน้า เพื่อดัน Pagination ให้ไม่ขยับ
            ========================================================= */}
                  {emptyRows > 0 && rows.length > 0 && (
                    Array.from({ length: emptyRows }).map((_, index) => (
                      <tr key={`empty-${index}`} style={{ height: "65px" }}> {/* ความสูงต้องเท่ากับ Row ปกติ */}
                        <td colSpan={6} />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer d-flex justify-content-between align-items-center">
              <div className="small text-muted">
                แสดง {rows.length} รายการ / หน้า — ทั้งหมด {totalCount} รายการ
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ก่อนหน้า
                </button>
                <span className="small">
                  หน้า {page} / {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Overlay ขยาย QR */}
        {enlargedQr && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}
            onClick={() => setEnlargedQr(null)}
          >
            <div
              className="bg-white p-4 rounded shadow-lg position-relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="btn btn-sm btn-light position-absolute"
                style={{ top: 8, right: 8 }}
                onClick={() => setEnlargedQr(null)}
              >
                <X size={16} />
              </button>

              <h6 className="mb-3 text-center">QR code ผู้เข้าสอบ</h6>
              <QrPreview value={enlargedQr} size={240} />
              <div className="text-center text-muted small mt-2">
                คลิกปิดเพื่อกลับไปหน้าหลัก
              </div>
            </div>
          </div>
        )}
      </div>
    </ShowIfCan>
  );
}
