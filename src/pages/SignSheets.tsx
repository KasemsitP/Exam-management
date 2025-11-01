import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { Printer, Download, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectActiveCampaignSessions } from "@/store/slices/examData.slice";
//import { selectUsersForCampaign } from "@/store/slices/users.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

type Examinee = { code: string; firstName: string; lastName: string; room: string | null };

const SAMPLE: Examinee[] = [
  { code: "300042", firstName: "à¸ªà¸¡à¸Šà¸²à¸¢", lastName: "à¹ƒà¸ˆà¸”à¸µ", room: "RM101" },
  { code: "300043", firstName: "à¸ªà¸¸à¸”à¸²", lastName: "à¸£à¸±à¸•à¸™à¹Œ", room: null },
  { code: "300044", firstName: "à¸à¸´à¸•à¸•à¸´", lastName: "à¸—à¸­à¸‡à¸”à¸µ", room: "RM102" },
  { code: "300045", firstName: "à¸§à¸£à¸²à¸ à¸£à¸“à¹Œ", lastName: "à¸šà¸¸à¸à¸¡à¸²", room: null },
];

const makeQrPayload = (
  kind: "CHKIN" | "CHKOUT",
  examinee: Examinee,
  meta: { course: string; session: string }
) =>
  `STD:${examinee.code}|K:${kind}|COURSE:${meta.course}|SES:${meta.session}|ROOM:${examinee.room ?? "NULL"}`;

const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const padTo = <T,>(arr: T[], size: number, filler: T) =>
  arr.length >= size ? arr : [...arr, ...Array.from({ length: size - arr.length }, () => filler)];

const QR_SIZE = 96;
const QR_BOX = 110;
const ROWS_PER_PAGE = 7;

export default function SignSheetsPage() {
  const { toast } = useToast();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions);
  //const campaignUsers = useAppSelector(selectUsersForCampaign(activeCampaign?.id ?? null));

  const [course, setCourse] = useState("à¸§à¸´à¸Šà¸² ABC123");
  const [sessionText, setSessionText] = useState("20/10/65 09:00â€“10:00");
  const [org, setOrg] = useState("à¸ªà¸–à¸²à¸šà¸±à¸™à¸à¸²à¸£à¸¨à¸¶à¸à¸©à¸² XXX");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [rows] = useState<Examinee[]>(SAMPLE);
  const [search, setSearch] = useState("");
  /*
  useEffect(() => {
    if (!campaignUsers.length) {
      setRows(SAMPLE);
      return;
    }
    setRows(
      campaignUsers.map((user) => ({
        code: user.row["code"] ?? user.nationalId ?? `USR-${user.id.slice(-6)}`,
        firstName: user.firstName ?? user.row["firstName"] ?? "-",
        lastName: user.lastName ?? user.row["lastName"] ?? "",
        room: user.row["room"] ?? null,
      }))
    );
  }, [campaignUsers]);
*/
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
    const session = sessions.find((s) => s.id === selectedSessionId);
    if (session) {
      setCourse(session.subjects?.[0]?.name ?? course);
      setSessionText(`${new Date(session.examDate).toLocaleDateString("th-TH")} ${session.label}`);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (activeCampaign) setOrg(activeCampaign.name);
  }, [activeCampaign]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.code, r.firstName, r.lastName, r.room ?? "null"].join(" ").toLowerCase().includes(term)
    );
  }, [rows, search]);

  const pages = useMemo(() => {
    const ch = chunk(filtered, ROWS_PER_PAGE);
    return ch.map((page) =>
      padTo(page, ROWS_PER_PAGE, { code: "", firstName: "", lastName: "", room: null })
    );
  }, [filtered]);

  const exportCsv = () => {
    const header = "à¸£à¸«à¸±à¸ª,à¸Šà¸·à¹ˆà¸­,à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥,à¸«à¹‰à¸­à¸‡,à¹€à¸Šà¹‡à¸„à¸­à¸´à¸™,à¹€à¸Šà¹‡à¸„à¹€à¸­à¸²à¸—à¹Œ";
    const lines = filtered.map((e) => {
      const inPayload = e.code ? makeQrPayload("CHKIN", e, { course, session: sessionText }) : "";
      const outPayload = e.code ? makeQrPayload("CHKOUT", e, { course, session: sessionText }) : "";
      return [e.code, e.firstName, e.lastName, e.room ?? "-", inPayload, outPayload]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "à¹ƒà¸šà¹€à¸‹à¹‡à¸™à¸Šà¸·à¹ˆà¸­à¸žà¸£à¹‰à¸­à¸¡QR.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!filtered.length) {
      toast({
        title: "à¹„à¸¡à¹ˆà¸žà¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸™à¸±à¸à¸ªà¸­à¸š",
        description: "à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸™à¸±à¸à¸ªà¸­à¸šà¸à¹ˆà¸­à¸™à¸žà¸´à¸¡à¸žà¹Œ",
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
              <h5 className="mb-1">à¹ƒà¸šà¹€à¸‹à¹‡à¸™à¸Šà¸·à¹ˆà¸­à¹à¸¥à¸° QR à¸™à¸±à¸à¸ªà¸­à¸š</h5>
              <div className="text-muted small">à¸ªà¸³à¸«à¸£à¸±à¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸à¸²à¸£à¹€à¸‚à¹‰à¸²à¸«à¹‰à¸­à¸‡à¸ªà¸­à¸šà¹à¸¥à¸°à¸­à¸­à¸à¸ˆà¸²à¸à¸«à¹‰à¸­à¸‡à¸ªà¸­à¸š</div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <input
                className="form-control"
                style={{ width: 220 }}
                placeholder="à¸„à¹‰à¸™à¸«à¸² à¸Šà¸·à¹ˆà¸­/à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥/à¸£à¸«à¸±à¸ª/à¸«à¹‰à¸­à¸‡"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" onClick={exportCsv}>
                <Download size={16} /> à¸ªà¹ˆà¸‡à¸­à¸­à¸ CSV
              </button>
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handlePrint}>
                <Printer size={16} /> à¸žà¸´à¸¡à¸žà¹Œ / Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Exam info form */}
        <div className="card mb-4 print-hidden">
          <div className="card-header">
            <h6 className="mb-0">à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸à¸²à¸£à¸ªà¸­à¸š</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-lg-3">
                <label htmlFor="course-name" className="form-label">à¸£à¸²à¸¢à¸§à¸´à¸Šà¸² / à¸§à¸´à¸Šà¸²</label>
                <input
                  id="course-name"
                  className="form-control"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <label htmlFor="session-text" className="form-label">à¸§à¸±à¸™ / à¹€à¸§à¸¥à¸²</label>
                <input
                  id="session-text"
                  className="form-control"
                  value={sessionText}
                  onChange={(e) => setSessionText(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <label htmlFor="organizer" className="form-label">à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™ / à¸ªà¸–à¸²à¸šà¸±à¸™</label>
                <input
                  id="organizer"
                  className="form-control"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label">à¸£à¸­à¸šà¸à¸²à¸£à¸ªà¸­à¸š</label>
                <select
                  className="form-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                >
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.label} â€“ {new Date(session.examDate).toLocaleDateString("th-TH")}
                    </option>
                  ))}
                  {!sessions.length && <option value="">à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸£à¸­à¸šà¸à¸²à¸£à¸ªà¸­à¸š</option>}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sheets */}
        <div className="card shadow-sm">
          <div className="card-header py-2 text-center">
            <h6 className="mb-0">
              {course}
              <div className="fw-normal text-muted small mt-1">{org}</div>
              <div className="fw-normal text-muted small">{sessionText}</div>
              <div className="fw-normal text-muted small">
                {filtered.length} à¸„à¸™ | {Math.ceil(filtered.length / ROWS_PER_PAGE)} à¸«à¸™à¹‰à¸² (7 à¹à¸–à¸§à¸•à¹ˆà¸­à¸«à¸™à¹‰à¸²)
              </div>
            </h6>
          </div>
          <div className="card-body pt-0">
            <div className="d-flex flex-column gap-4">
              {pages.map((page, pageIndex) => (
                <div key={pageIndex} className={pageIndex < pages.length - 1 ? "break-after-page" : ""}>
                  <div className="text-center text-muted small mt-2">
                    à¹à¸„à¸¡à¹€à¸›à¸: {activeCampaign?.name ?? "-"} â€” à¸«à¸™à¹‰à¸² {pageIndex + 1}
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
                          <th className="text-center">à¸¥à¸³à¸”à¸±à¸š</th>
                          <th className="text-start">à¸Šà¸·à¹ˆà¸­-à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥ / à¸£à¸«à¸±à¸ª / à¸«à¹‰à¸­à¸‡</th>
                          <th className="text-center">à¹€à¸Šà¹‡à¸„à¸­à¸´à¸™ (à¹€à¸‚à¹‰à¸²)</th>
                          <th className="text-center">à¹€à¸Šà¹‡à¸„à¹€à¸­à¸²à¸—à¹Œ (à¸­à¸­à¸)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.map((examinee, index) => {
                          const absoluteIndex = pageIndex * ROWS_PER_PAGE + index + 1;
                          const isBlank =
                            !examinee.code && !examinee.firstName && !examinee.lastName;
                          const checkIn = isBlank
                            ? ""
                            : makeQrPayload("CHKIN", examinee, { course, session: sessionText });
                          const checkOut = isBlank
                            ? ""
                            : makeQrPayload("CHKOUT", examinee, { course, session: sessionText });

                          return (
                            <tr key={absoluteIndex} className="qr-row align-top">
                              <td className="text-center">{absoluteIndex}</td>
                              <td className="lh-sm">
                                {!isBlank ? (
                                  <>
                                    <div>{examinee.firstName} {examinee.lastName}</div>
                                    <div className="small text-muted">
                                      à¸£à¸«à¸±à¸ª: {examinee.code} | à¸«à¹‰à¸­à¸‡: {examinee.room ?? "-"}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ height: 18 }} />
                                )}
                                <div className="mt-1 small text-muted">à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™à¸œà¸¹à¹‰à¸ªà¸­à¸š</div>
                              </td>
                              <td className="text-center">
                                <div
                                  className="mx-auto d-flex align-items-center justify-content-center"
                                  style={{ width: QR_BOX, height: QR_BOX }}
                                >
                                  {!isBlank && <QRCode value={checkIn} size={QR_SIZE} />}
                                </div>
                              </td>
                              <td className="text-center">
                                <div
                                  className="mx-auto d-flex align-items-center justify-content-center"
                                  style={{ width: QR_BOX, height: QR_BOX }}
                                >
                                  {!isBlank && <QRCode value={checkOut} size={QR_SIZE}  />}
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

            {filtered.length === 0 && (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 180 }}>
                à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸™à¸±à¸à¸ªà¸­à¸š à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¸£à¸·à¸­à¸ªà¹ˆà¸‡à¸­à¸­à¸ CSV à¸à¹ˆà¸­à¸™
              </div>
            )}

            {/* print styles */}
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

