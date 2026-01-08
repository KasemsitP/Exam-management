import QRCode from "react-qr-code";
import { Printer, Download, Users, Loader2 } from "lucide-react";

import { ShowIfCan } from "@/components/auth/ShowIfCan";
import {
  useSignSheetsPage,
  ROWS_PER_PAGE,
  QR_BOX,
  QR_SIZE,
} from "./hooks/useSignSheetsPage";

export default function SignSheetsPage() {
  const {
    activeCampaign,
    sessions,
    userSessionsStatus,
    course,
    sessionText,
    org,
    selectedSessionId,
    setSelectedSessionId,
    search,
    setSearch,
    filtered,
    pages,
    setSessionText,
    setOrg,
    handleExportCsv,
    handleExportPdf,
    handlePrint,
  } = useSignSheetsPage();

  return (
    <ShowIfCan permission="view_sessions">
      <div className="container py-4">
        {/* Header */}
        <div className="card shadow-sm mb-4">
          {/* Card Header */}
          <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            {/* Left side: Icon + Title */}
            <div className="d-flex align-items-center gap-3">
              <div>
                <h5 className="mb-1">ใบเซ็นชื่อและ QR code ผู้เข้าสอบ</h5>
                <div className="text-muted small">
                  สำหรับแปะบนเล่มข้อสอบของผู้เข้าสอบ
                </div>
              </div>
            </div>

            {/* Right side: Search + Buttons */}
            <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mt-lg-0">
              <input
                className="form-control"
                style={{ width: 220 }}
                placeholder="ค้นหา ชื่อ/นามสกุล/รหัส/ห้อง"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                onClick={handleExportCsv}
              >
                <Download size={16} /> ส่งออก CSV
              </button>

              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={handleExportPdf}
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
                      {session.label} –{" "}
                      {new Date(session.examDate).toLocaleDateString("th-TH")}
                    </option>
                  ))}
                  {!sessions.length && (
                    <option value="">ไม่มีข้อมูลรอบการสอบ</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sheets preview */}
        <div className="card shadow-sm">
          <div className="card-header py-2 text-center">
            <h6 className="mb-0">
              {course}
              <div className="fw-normal text-muted small mt-1">{org}</div>
              <div className="fw-normal text-muted small">{sessionText}</div>
              <div className="fw-normal text-muted small">
                {filtered.length} คน |{" "}
                {Math.ceil(filtered.length / ROWS_PER_PAGE)} หน้า (
                {ROWS_PER_PAGE} แถวต่อหน้า)
              </div>
            </h6>
          </div>
          <div className="card-body pt-0">
            <div className="d-flex flex-column gap-4">
              {pages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className={
                    pageIndex < pages.length - 1 ? "break-after-page" : ""
                  }
                >
                  <div className="text-center text-muted small mt-2">
                    แคมเปญ: {activeCampaign?.name ?? "-"} — หน้า{" "}
                    {pageIndex + 1}
                  </div>

                  <div className="table-responsive mt-2">
                    <table
                      className="table table-bordered align-top"
                      style={{ tableLayout: "fixed" }}
                    >
                      <colgroup>
                        <col style={{ width: "56px" }} />
                        <col />
                        <col style={{ width: "170px" }} />
                        <col style={{ width: "170px" }} />
                      </colgroup>
                      <thead className="table-light">
                        <tr>
                          <th className="text-center">ลำดับ</th>
                          <th className="text-start">
                            ชื่อ-นามสกุล / รหัส / ห้อง
                          </th>
                          <th className="text-center">
                            QR Code (Check-in)
                          </th>
                          <th className="text-center">
                            QR Code (Check-out)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.map((examinee, index) => {
                          const absoluteIndex =
                            pageIndex * ROWS_PER_PAGE + index + 1;
                          const isBlank =
                            !examinee.userCode && !examinee.firstName;
                          const qrPayload = examinee.qr_payload ?? "";
                          return (
                            <tr
                              key={absoluteIndex}
                              className="qr-row align-top"
                            >
                              <td className="text-center">{absoluteIndex}</td>
                              <td className="lh-sm">
                                {!isBlank ? (
                                  <>
                                    <div>
                                      {examinee.firstName}{" "}
                                      {examinee.lastName}
                                    </div>
                                    <div className="small text-muted">
                                      รหัส: {examinee.userCode} | ห้อง:{" "}
                                      {examinee.roomName ?? "-"}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ height: 18 }} />
                                )}
                                <div className="mt-1 small text-muted">
                                  ลายเซ็นผู้สอบ
                                </div>
                              </td>
                              <td className="text-center">
                                <div
                                  className="mx-auto d-flex align-items-center justify-content-center"
                                  style={{ width: QR_BOX, height: QR_BOX }}
                                >
                                  {!isBlank && qrPayload && (
                                    <QRCode value={qrPayload} size={QR_SIZE} />
                                  )}
                                  {!isBlank && !qrPayload && (
                                    <span className="badge bg-danger-subtle text-danger-emphasis">
                                      NULL (ยังไม่เข้ารหัส)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center">
                                <div
                                  className="mx-auto d-flex align-items-center justify-content-center"
                                  style={{ width: QR_BOX, height: QR_BOX }}
                                >
                                  {!isBlank && qrPayload && (
                                    <QRCode value={qrPayload} size={QR_SIZE} />
                                  )}
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
              <div
                className="d-flex align-items-center justify-content-center text-muted"
                style={{ height: 180 }}
              >
                <Loader2 size={24} className="spin-animation me-2" />
                กำลังดึงข้อมูลผู้สอบ...
              </div>
            )}

            {userSessionsStatus === "failed" && (
              <div
                className="d-flex align-items-center justify-content-center text-danger"
                style={{ height: 180 }}
              >
                ไม่สามารถดึงข้อมูลผู้สอบได้ (API Error)
              </div>
            )}

            {userSessionsStatus === "succeeded" && filtered.length === 0 && (
              <div
                className="d-flex align-items-center justify-content-center text-muted"
                style={{ height: 180 }}
              >
                ไม่พบข้อมูลผู้เข้าสอบในรอบนี้
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
