// src/pages/signsheets/SignSheetsPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import { Printer, FileDown, Users, Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import axios from "axios";

const ITEMS_PER_PAGE = 20; // จำนวนแถวต่อหน้าในตาราง

type SignSheetRow = {
  user_id: number;
  userCode: string;
  firstName: string;
  lastName: string;
  roomName: string | null;
  seat_code: string | null;
  qr_payload: string | null;
};

export default function SignSheetsPage() {
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [course, setCourse] = useState("วิชา 101");
  const [sessionText, setSessionText] = useState("");
  const [org, setOrg] = useState(activeCampaign?.name || "");

  const [rows, setRows] = useState<SignSheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // --- ตั้งค่า session เริ่มต้น ---
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(String(sessions[0].id));
    }
  }, [sessions, selectedSessionId]);

  // --- เปลี่ยนชื่อวิชา/เวลา ตาม session ---
  useEffect(() => {
    const session = sessions.find((s) => String(s.id) === selectedSessionId);
    if (session) {
      setCourse(session.subjects?.[0]?.name ?? course);
      setSessionText(
        `${new Date(session.examDate).toLocaleDateString("th-TH")} ${session.label
        }`
      );
    }
  }, [selectedSessionId, sessions]);

  // --- เซ็ต org ตาม campaign ---
  useEffect(() => {
    if (activeCampaign) setOrg(activeCampaign.name);
  }, [activeCampaign]);

  // --- ดึงข้อมูลทั้งหมดจาก backend (ไม่มี pagination ที่ backend) ---
  const fetchRows = useCallback(async () => {
    if (!selectedSessionId || !activeCampaign) return;

    try {
      setIsLoading(true);

      // แนะนำให้ backend endpoint นี้ "ไม่ paginate" และคืนมาเป็น array ตรง ๆ
      // GET /api/signsheet/:sessionId/:campaignId
      const res = await axios.get<SignSheetRow[]>(
        `/api/signsheet/${selectedSessionId}/${activeCampaign.id}`
      );

      setRows(res.data);
      setPage(1); // reset กลับหน้า 1 เวลาเปลี่ยน session
    } catch (err) {
      console.error(err);
      toast({ title: "โหลดรายชื่อไม่สำเร็จ", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSessionId, activeCampaign, toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // --- filter + search ฝั่ง frontend ---
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) =>
      [
        r.userCode,
        r.firstName,
        r.lastName,
        r.roomName ?? "-",
        r.seat_code ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  // --- pagination ฝั่ง frontend ---
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE)),
    [filteredRows.length]
  );

  const pageRows = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, page]);

  useEffect(() => {
    // ถ้า search เปลี่ยนให้กลับไปหน้า 1
    setPage(1);
  }, [search]);

  // --- Download PDF ทั้งชุด (ไม่ใช้ pagination) ---
  const handleDownloadPdf = async () => {
    if (!selectedSessionId || !activeCampaign) return;

    setIsExporting(true);
    try {
      // GET /api/signsheet/:session/:campaign/pdf
      const response = await axios.get(
        `/api/signsheet/${selectedSessionId}/${activeCampaign.id}/pdf`,
        {
          params: { course, org, sessionText },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `ใบเซ็นชื่อ_${org.replaceAll(" ", "")}_${selectedSessionId}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast({ title: "Export PDF ไม่สำเร็จ", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (!filteredRows.length) {
      toast({
        title: "ไม่พบข้อมูลผู้เข้าสอบ",
        description: "กรุณาตรวจสอบข้อมูลก่อนพิมพ์",
        variant: "destructive",
      });
      return;
    }
    window.print();
  };

  return (
    <ShowIfCan permission="view_sessions">
      <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white p-2 rounded-circle">
              <Users size={24} />
            </div>
            <div>
              <h4 className="mb-0">รายชื่อผู้เข้าสอบ (สำหรับอ้างอิง)</h4>
              <div className="text-muted small">
                ใช้ดูบนเว็บ / ค้นหา / ตรวจสอบ — การโหลดใบเซ็นชื่อใช้ปุ่ม
                Export PDF
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={handlePrint}
            >
              <Printer size={18} />
              พิมพ์ตาราง
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleDownloadPdf}
              disabled={isExporting || !selectedSessionId}
            >
              {isExporting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <FileDown size={18} />
              )}
              Export PDF (ทุกคนในรอบนี้)
            </button>
          </div>
        </div>

        {/* ฟอร์มข้อมูลการสอบ */}
        <div className="card mb-4 border-0 bg-light">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">รอบสอบ</label>
                <select
                  className="form-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} –{" "}
                      {new Date(s.examDate).toLocaleDateString("th-TH")}
                    </option>
                  ))}
                  {!sessions.length && (
                    <option value="">ไม่มีข้อมูลรอบสอบ</option>
                  )}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">วิชา</label>
                <input
                  className="form-control"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">วัน / เวลา</label>
                <input
                  className="form-control"
                  value={sessionText}
                  onChange={(e) => setSessionText(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">หน่วยงาน / สถานที่</label>
                <input
                  className="form-control"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search + summary */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text bg-white">
              <Search size={16} />
            </span>
            <input
              className="form-control border-start-0"
              placeholder="ค้นหา รหัส / ชื่อ / ห้อง"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-muted small">
            ทั้งหมด {rows.length} คน | หลังกรอง {filteredRows.length} คน |
            หน้า {page}/{totalPages}
          </div>
        </div>

        {/* ตาราง */}
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 60 }} className="text-center">
                    #
                  </th>
                  <th style={{ width: 120 }}>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th style={{ width: 180 }}>ห้อง / ที่นั่ง</th>
                  <th style={{ width: 120 }} className="text-center">
                    QR Preview
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <Loader2 className="animate-spin me-2" size={18} />
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                )}

                {!isLoading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      ไม่พบข้อมูลผู้เข้าสอบ
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  pageRows.map((row, idx) => (
                    <tr key={row.user_id ?? idx}>
                      <td className="text-center text-muted">
                        {(page - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="fw-semibold text-primary">
                        {row.userCode}
                      </td>
                      <td>{`${row.firstName} ${row.lastName ?? ""}`}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary-emphasis me-1">
                          {row.roomName || "-"}
                        </span>
                        <small className="text-muted">
                          {row.seat_code ? `ที่นั่ง ${row.seat_code}` : ""}
                        </small>
                      </td>
                      <td className="text-center">
                        {row.qr_payload ? (
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              margin: "0 auto",
                            }}
                          >
                            <QRCode value={row.qr_payload} size={48} />
                          </div>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger-emphasis">
                            NULL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* pagination controls */}
          {totalPages > 1 && (
            <div className="card-footer d-flex justify-content-end align-items-center gap-2 py-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ก่อนหน้า
              </button>
              <span className="small">
                หน้า {page} / {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, p + 1))
                }
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </div>
    </ShowIfCan>
  );
}
