import React, { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";                 // ใช้แสดง QR บนหน้าเว็บ
import QR from "qrcode";                            // ใช้สร้าง dataURL สำหรับ PDF
import { Printer, Download, Users, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import pdfMake from "pdfmake/build/pdfmake";
import vfs_th from "../../build/vfs_th";
(pdfMake as any).vfs = vfs_th;
(pdfMake as any).fonts = {
  THSarabun: {
    normal: "THSarabunNew.ttf",
    bold: "THSarabunNew-Bold.ttf",
    italics: "THSarabunNew-Italic.ttf",
    bolditalics: "THSarabunNew-BoldItalic.ttf",
  },
Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },

};
// import vfsTH from "@/lib/vfs-THSarabun"; 
// (pdfMake as any).vfs = vfsTH;
// (pdfMake as any).fonts = {
//   THSarabun: {
//     normal: "THSarabunNew.ttf",
//     bold: "THSarabunNew-Bold.ttf",
//     italics: "THSarabunNew-Italic.ttf",
//     bolditalics: "THSarabunNew-BoldItalic.ttf",
//   },
// };

import {
  fetchUserSessionsForSession,
  selectAllUserSessions,
  selectUserSessionsStatus,
  clearUserSessions,
  UserSessionData,
} from "@/store/slices/userSessions.slice";

type RowItem = {
  firstName: string;
  lastName: string;
  userCode: string;
  roomName: string | null;
  qr_payload: string | null;
  __absIndex?: number;
};

const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

const BLANK_USER: UserSessionData = {
  user_session_id: 0,
  user_id: 0,
  userCode: "",
  firstName: "",
  lastName: "",
  roomName: null,
  qr_payload: null,
};
const padTo = <T,>(arr: T[], size: number, filler: T) =>
  arr.length >= size ? arr : [...arr, ...Array.from({ length: size - arr.length }, () => filler)];

const QR_SIZE = 96;    // ขนาด QR (หน้าเว็บ)
const QR_BOX = 110;
const ROWS_PER_PAGE = 7;

// ========== PDF Helpers ==========
async function makeQR(value: string, size = 300): Promise<string> {
  if (!value) return "";
  return QR.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "M" });
}
function cellText(text: string, opts: any = {}) {
  return { text, ...opts };
}

export async function exportSignSheetsPDF({
  rows,
  course,
  org,
  sessionText,
  rowsPerPage = 7,
  fileName = "ใบเซ็นชื่อนักสอบ.pdf",
  useThaiFont = false, // ถ้าตั้ง vfs ฟอนต์ไทยด้านบน ให้ส่ง true แล้วไปตั้ง defaultStyle.font = "THSarabun"
}: {
  rows: RowItem[];
  course: string;
  org: string;
  sessionText: string;
  rowsPerPage?: number;
  fileName?: string;
  useThaiFont?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pages: RowItem[][] = chunk(rows, rowsPerPage).map((p, i) => {
    while (p.length < rowsPerPage) {
      p.push({ firstName: "", lastName: "", userCode: "", roomName: null, qr_payload: null });
    }
    p.forEach((r, j) => (r.__absIndex = i * rowsPerPage + j + 1));
    return p;
  });

  const content: any[] = [];

  for (let pageNo = 1; pageNo <= totalPages; pageNo++) {
    const pageRows = pages[pageNo - 1];

    // หัวเรื่อง (เหมือนภาพตัวอย่าง)
    content.push(
      { text: `ใบเซ็นชื่อสอบวิชา ${course}`, bold: true, fontSize: 16, alignment: "center", margin: [0, 0, 0, 4] },
      { text: `${sessionText}  ณ ${org}`, alignment: "center", margin: [0, 0, 0, 2] },
      { text: `${rows.length} คน | หน้า ${pageNo}/${totalPages}`, alignment: "center", color: "#666", fontSize: 9, margin: [0, 0, 0, 8] }
    );

    // ตาราง 4 คอลัมน์: ลำดับ | ข้อมูล | QR เข้า | QR ออก
    const tableBody: any[] = [];
    tableBody.push([
      cellText("ลำดับ", { bold: true, alignment: "center" }),
      cellText("ชื่อ-นามสกุล / รหัส / ห้อง", { bold: true }),
      cellText("คิวอาร์โค้ดภาคผนวก", { bold: true, alignment: "center" }),
      cellText("คิวอาร์โค้ดภาคผนวก", { bold: true, alignment: "center" }),
    ]);

    for (const r of pageRows) {
      const isBlank = !r.userCode && !r.firstName;
      const infoCell = isBlank
        ? [{ text: " " }]
        : [
            { text: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() },
            { text: `เลขที่นั่งสอบ ${r.userCode || "-"}`, fontSize: 9, color: "#666" },
            { text: `ห้องสอบ ${r.roomName ?? "-"}`, fontSize: 9, color: "#666" },
            { text: "ลายเซ็น..................................................", fontSize: 9, color: "#666", margin: [0, 4, 0, 0] },
          ];
  let qrDataURL_CheckIn = "";
  if (!isBlank && r.qr_payload) {
    qrDataURL_CheckIn = await makeQR(r.qr_payload, 350);
  }

  const qrCell_CheckIn = isBlank
    ? { text: " " }
    : qrDataURL_CheckIn
    ? { image: qrDataURL_CheckIn, width: 95, alignment: "center" }
    : { text: "NULL (ยังไม่เข้ารหัส)", color: "#c00000", bold: true, alignment: "center", fontSize: 9 };

  // ✅ ใช้ QR เดียวกันกับ Check-in
  const qrCell_CheckOut = isBlank
    ? { text: " " }
    : qrDataURL_CheckIn
    ? { image: qrDataURL_CheckIn, width: 95, alignment: "center" }
    : { text: "NULL (ยังไม่เข้ารหัส)", color: "#c00000", bold: true, alignment: "center", fontSize: 9 };

  tableBody.push([
    { text: String(r.__absIndex), alignment: "center" },
    { stack: infoCell },
    qrCell_CheckIn,
    qrCell_CheckOut, // ✅ แสดง QR เหมือนกัน
  ]);
    }

    content.push({
      table: {
        headerRows: 1,
        widths: [40, "*", 120, 120],
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      dontBreakRows: true,
    });

    if (pageNo < totalPages) {
      content.push({ text: "", pageBreak: "after" });
    }
  }

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [25, 28, 25, 28],
    content,
    defaultStyle: {
      fontSize: 11,
      font: useThaiFont ? "THSarabun" : undefined,
    },
  };

  pdfMake.createPdf(docDefinition).download(fileName);
}

// ========== Component ==========
export default function SignSheetsPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions);

  const userSessions = useAppSelector(selectAllUserSessions);
  const userSessionsStatus = useAppSelector(selectUserSessionsStatus);

  const [course, setCourse] = useState("วิชา ABC123");
  const [sessionText, setSessionText] = useState("20/10/65 09:00–10:00");
  const [org, setOrg] = useState("สถาบันการศึกษา XXX");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!sessions.length) {
      setSelectedSessionId("");
      return;
    }
    if (!selectedSessionId || !sessions.some((s) => s.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId) {
      const numericSessionId = parseInt(selectedSessionId.replace("sess-", ""));
      if (!isNaN(numericSessionId)) {
        dispatch(fetchUserSessionsForSession(numericSessionId));
      }
    }
    return () => {
      dispatch(clearUserSessions());
    };
  }, [selectedSessionId, dispatch]);

  useEffect(() => {
    const session = sessions.find((s) => s.id === selectedSessionId);
    if (session) {
      setCourse(session.subjects?.[0]?.name ?? course);
      setSessionText(
        `${new Date(session.examDate).toLocaleDateString("th-TH")} ${session.label}`
      );
    }
  }, [sessions, selectedSessionId, course]);

  useEffect(() => {
    if (activeCampaign) setOrg(activeCampaign.name);
  }, [activeCampaign]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const source = userSessions;
    if (!term) return source;
    return source.filter((r) =>
      [r.userCode, r.firstName, r.lastName, r.roomName ?? "null"]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [userSessions, search]);

  const pages = useMemo(() => {
    const ch = chunk(filtered, ROWS_PER_PAGE);
    return ch.map((page) => padTo(page, ROWS_PER_PAGE, BLANK_USER));
  }, [filtered]);

  const exportCsv = () => {
    const header = "รหัส,ชื่อ,นามสกุล,ห้อง,qr_payload (Encrypted)";
    const lines = filtered.map((e) => {
      return [
        e.userCode,
        e.firstName,
        e.lastName,
        e.roomName ?? "-",
        e.qr_payload ?? "NULL",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ใบเซ็นชื่อพร้อมQR.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!filtered.length) {
      toast({
        title: "ไม่พบข้อมูลนักสอบ",
        description: "กรุณาเพิ่มข้อมูลนักสอบก่อนพิมพ์",
        variant: "destructive",
      });
      return;
    }
    window.print();
  };

  return (
    <ShowIfCan permission="view_sessions">
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex gap-3 align-items-start mb-3 print-hidden">
          <div className="rounded-circle p-2 bg-primary-subtle text-primary">
            <Users size={22} />
          </div>
          <div className="flex-grow-1 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-sm-between gap-2">
            <div>
              <h5 className="mb-1">ใบเซ็นชื่อและ QR นักสอบ</h5>
              <div className="text-muted small">
                สำหรับตรวจสอบการเข้าห้องสอบและออกจากห้องสอบ
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <input
                className="form-control"
                style={{ width: 220 }}
                placeholder="ค้นหา ชื่อ/นามสกุล/รหัส/ห้อง"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                onClick={exportCsv}
              >
                <Download size={16} /> ส่งออก CSV
              </button>

              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={() =>
                  exportSignSheetsPDF({
                    rows: filtered.map((r) => ({
                      firstName: r.firstName,
                      lastName: r.lastName,
                      userCode: r.userCode,
                      roomName: r.roomName ?? null,
                      qr_payload: r.qr_payload ?? null,
                    })),
                    course,
                    org,
                    sessionText,
                    rowsPerPage: 7,
                    fileName: `ใบเซ็นชื่อ_${org.replaceAll(" ", "")}.pdf`,
                     useThaiFont: true, // ถ้าตั้ง vfs ฟอนต์ไทยไว้ด้านบน เปิดบรรทัดนี้
                  })
                }
              >
                Export PDF
              </button>

              <button
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                onClick={handlePrint}
              >
                <Printer size={16} /> พิมพ์ (จากหน้าเว็บ)
              </button>
            </div>
          </div>
        </div>

        {/* Exam info form */}
        <div className="card mb-4 print-hidden">
          <div className="card-header">
            <h6 className="mb-0">ข้อมูลการสอบ</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-lg-3">
                <label htmlFor="session-text" className="form-label">
                  วัน / เวลา
                </label>
                <input
                  id="session-text"
                  className="form-control"
                  value={sessionText}
                  onChange={(e) => setSessionText(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <label htmlFor="organizer" className="form-label">
                  หน่วยงาน / สถาบัน
                </label>
                <input
                  id="organizer"
                  className="form-control"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label">รอบการสอบ</label>
                <select
                  className="form-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  {sessions.map((session: any) => (
                    <option key={session.id} value={session.id}>
                      {session.label} – {new Date(session.examDate).toLocaleDateString("th-TH")}
                    </option>
                  ))}
                  {!sessions.length && <option value="">ไม่มีข้อมูลรอบการสอบ</option>}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sheets preview บนหน้าเว็บ */}
        <div className="card shadow-sm">
          <div className="card-header py-2 text-center">
            <h6 className="mb-0">
              {course}
              <div className="fw-normal text-muted small mt-1">{org}</div>
              <div className="fw-normal text-muted small">{sessionText}</div>
              <div className="fw-normal text-muted small">
                {filtered.length} คน | {Math.ceil(filtered.length / ROWS_PER_PAGE)} หน้า (7 แถวต่อหน้า)
              </div>
            </h6>
          </div>
          <div className="card-body pt-0">
            <div className="d-flex flex-column gap-4">
              {pages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className={pageIndex < pages.length - 1 ? "break-after-page" : ""}
                >
                  <div className="text-center text-muted small mt-2">
                    แคมเปญ: {activeCampaign?.name ?? "-"} — หน้า {pageIndex + 1}
                  </div>

                  <div className="table-responsive mt-2">
                    <table className="table table-bordered align-top" style={{ tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "56px" }} />
                        <col />
                        <col style={{ width: "170px" }} />
                        <col style={{ width: "170px" }} />
                      </colgroup>
                      <thead className="table-light">
                        <tr>
                          <th className="text-center">ลำดับ</th>
                          <th className="text-start">ชื่อ-นามสกุล / รหัส / ห้อง</th>
                          <th className="text-center">QR Code (Check-in)</th>
                          <th className="text-center">QR Code (Check-out)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.map((examinee, index) => {
                          const absoluteIndex = pageIndex * ROWS_PER_PAGE + index + 1;
                          const isBlank = !examinee.userCode && !examinee.firstName;
                          const qrPayload = examinee.qr_payload ?? "";
                          return (
                            <tr key={absoluteIndex} className="qr-row align-top">
                              <td className="text-center">{absoluteIndex}</td>
                              <td className="lh-sm">
                                {!isBlank ? (
                                  <>
                                    <div>{examinee.firstName} {examinee.lastName}</div>
                                    <div className="small text-muted">
                                      รหัส: {examinee.userCode} | ห้อง: {examinee.roomName ?? "-"}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ height: 18 }} />
                                )}
                                <div className="mt-1 small text-muted">ลายเซ็นผู้สอบ</div>
                              </td>
                              <td className="text-center">
                                <div className="mx-auto d-flex align-items-center justify-content-center" style={{ width: QR_BOX, height: QR_BOX }}>
                                  {!isBlank && <QRCode value={qrPayload} size={QR_SIZE} />}
                                  {!isBlank && !qrPayload && (
                                    <span className="badge bg-danger-subtle text-danger-emphasis">
                                      NULL (ยังไม่เข้ารหัส)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center">
                                <div className="mx-auto d-flex align-items-center justify-content-center" style={{ width: QR_BOX, height: QR_BOX }}>
                                  {!isBlank && <QRCode value={qrPayload} size={QR_SIZE} />}
                                  {!isBlank && !qrPayload && (
                                    <span className="badge bg-danger-subtle text-danger-emphasis">
                                      NULL (ยังไม่เข้ารหัส)
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {userSessionsStatus === "loading" && (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 180 }}>
                <Loader2 size={24} className="spin-animation me-2" />
                กำลังดึงข้อมูลผู้สอบ...
              </div>
            )}

            {userSessionsStatus === "failed" && (
              <div className="d-flex align-items-center justify-content-center text-danger" style={{ height: 180 }}>
                ไม่สามารถดึงข้อมูลผู้สอบได้ (API Error)
              </div>
            )}

            {userSessionsStatus === "succeeded" && filtered.length === 0 && (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 180 }}>
                ไม่พบข้อมูลนักสอบในรอบนี้
              </div>
            )}

            <style>{`
              @media print {
                @page { size: A4 portrait; margin: 8mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .break-after-page { break-after: page; page-break-after: always; }
                table { width: 100%; table-layout: fixed; border-collapse: collapse; }
                .qr-row { break-inside: avoid; page-break-inside: avoid; }
                .print-hidden { display: none !important; }
              }
            `}</style>
          </div>
        </div>
      </div>
    </ShowIfCan>
  );
}
