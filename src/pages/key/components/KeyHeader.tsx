
import { useState } from "react";

interface KeyHeaderProps {
  activeCampaign: any;
  headerSummary: {
    totalSessions: number;
    importedSessions: number;
    encryptedSessions: number;
    keyStatusDashboard: any;
    subjects: any[];
    subjectQuestionsGrouped: Record<number, any>;
    sessionInfo: any[];
    keyStatus: any;
  };
}



export default function RoomsHeader({ activeCampaign,
  headerSummary,
}: KeyHeaderProps) {


  const [openModel, setOpenModel] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const selectedSession =
    selectedSessionId != null
      ? headerSummary.sessionInfo[selectedSessionId]
      : null;


  const handleOpenModel = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setOpenModel(true);
  }
  const handleCloseModel = () => {
    setOpenModel(false);
  }

  const { totalSessions, importedSessions, encryptedSessions } = headerSummary;

  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2 gap-lg-3">
        <div>
          <h5 className="mb-0 d-flex align-items-center gap-2">
            จัดการเข้ารหัส
          </h5>
          <small className="text-muted">
            การเข้ารหัสใน {activeCampaign?.name ?? "-"}
          </small>
        </div>
      </div>

      <div className="card-body p-2 p-sm-3">
        <div className="row g-2">
          {/* Card 1: สถานะการสร้างรอบสอบ */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-none border h-100">
              <div className="card-body p-2 p-sm-3">
                <div className="small text-muted mb-2">สถานะสร้างคีย์</div>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">คีย์ที่ 1</span>
                    <span className={`badge ${headerSummary?.keyStatusDashboard?.key1_status ? "bg-success" : "bg-warning"}`} style={{ fontSize: "0.75rem" }}>
                      {headerSummary?.keyStatusDashboard?.key1_status ? "สร้างแล้ว" : "ยังไม่สร้าง"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">คีย์ที่ 2</span>
                    <span className={`badge ${headerSummary?.keyStatusDashboard?.key2_status ? "bg-success" : "bg-warning"}`} style={{ fontSize: "0.75rem" }}>
                      {headerSummary?.keyStatusDashboard?.key2_status ? "สร้างแล้ว" : "ยังไม่สร้าง"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: สถานะการนำเข้าข้อมูล */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-none border h-100">
              <div className="card-body p-2 p-sm-3">
                <div className="small text-muted mb-2">
                  สถานะนำเข้าข้อมูลผู้สอบ
                </div>
                <div className={`fw-bold mb-0 ${importedSessions === totalSessions ? "text-success" : "text-warning"}`} style={{ fontSize: "0.9rem" }}>
                  {importedSessions === totalSessions
                    ? "นำเข้าข้อมูลครบแล้ว"
                    : `นำเข้าข้อมูลไม่ครบ (${importedSessions}/${totalSessions})`}
                </div>
                <small
                  className={
                    importedSessions === totalSessions
                      ? "text-success"
                      : "text-warning"
                  }
                >
                  &nbsp;
                </small>
              </div>
            </div>
          </div>
                    {/* Card 3: สถานะการเข้ารหัส */}
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card shadow-none border h-100">
              <div className="card-body p-2 p-sm-3">
                <div className="small text-muted mb-2">
                  สถานะเข้ารหัสคิวอาร์โค้ด
                </div>

                  <div className={`fw-bold mb-0 ${encryptedSessions === totalSessions ? "text-success" : "text-warning"}`} style={{ fontSize: "0.9rem" }}>
                    {encryptedSessions === totalSessions ? "เข้ารหัสคิวอาร์โค้ดครบแล้ว" : `ยังไม่ครบ (${encryptedSessions}/${totalSessions})`}
                  </div>
                  {/* <span className={`badge ${encryptedSessions === totalSessions ? "bg-success" : "bg-warning"}`} style={{ fontSize: "0.75rem" }}>
                    {encryptedSessions === totalSessions
                      ? "เข้ารหัสครบแล้ว"
                      : "ยังไม่ครบ"}
                  </span> */}
                  <small

                  >
                    &nbsp;
                  </small>
              </div>
            </div>
          </div>



          <div className="col-12">
            <div className="card shadow-none border">
              <div className="card-body p-2 p-sm-3">
                <small>
                  รายละเอียดวันที่สอบและหัวข้อที่ต้องสอบในแต่ละวัน โดยสอบทั้งหมด {totalSessions} วิชา
                </small>

                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0 table-striped text-nowrap">
                    <colgroup>
                      <col style={{ minWidth: 140 }} />
                      <col style={{ minWidth: 120 }} />
                      <col style={{ minWidth: 120 }} />
                      <col style={{ minWidth: 120 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="text-nowrap">วิชา</th>
                        <th className="text-nowrap">วันที่สอบ</th>
                        <th className="text-nowrap">เวลา</th>
                        <th className="text-nowrap text-end">รายหัวข้อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(headerSummary.sessionInfo).map((session) =>
                        session.subjects.map((subject) => (
                          <tr key={`${session.session_id}-${subject.subject_id}`}>
                            <td className="text-nowrap">{subject.subject_name}</td>

                            <td className="text-nowrap">
                              {new Date(session.exam_date).toLocaleDateString("th-TH")}
                            </td>

                            <td className="text-nowrap">
                              {new Date(session.start_at).toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {new Date(session.end_at).toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>

                            <td className="text-nowrap text-end">
                              <button
                                className="btn btn-xs btn-outline-primary text-nowrap"
                                onClick={() => handleOpenModel(session.session_id)}
                              >
                                ดูรายหัวข้อวิชา
                              </button>

                            </td>
                          </tr>
                        ))
                      )}



                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>


        </div>
      </div>
      {openModel && selectedSession && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">

                <div className="modal-header">
                  <h6 className="modal-title">
                    {selectedSession.session_code}
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModel}
                  />
                </div>

                <div className="modal-body p-2 p-sm-3">

                  <p>
                    <strong>วันที่สอบ:</strong>{" "}
                    {new Date(selectedSession.exam_date).toLocaleDateString("th-TH")}
                    <br />
                    <strong>เวลา:</strong>{" "}
                    {new Date(selectedSession.start_at).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(selectedSession.end_at).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <hr />

                  {selectedSession.subjects.map((subject: any) => (
                    <div key={subject.subject_id} className="mb-3 pb-2 border-bottom">
                      <h6 className="fw-bold text-nowrap">{subject.subject_name}</h6>

                      <div className="table-responsive">
                        <table className="table table-sm table-striped text-nowrap mb-0">
                          <colgroup>
                            <col style={{ minWidth: 60 }} />
                            <col style={{ minWidth: 150 }} />
                            <col style={{ minWidth: 80 }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th className="text-nowrap">ข้อที่</th>
                              <th className="text-nowrap">หัวข้อ</th>
                              <th className="text-nowrap">คะแนนเต็ม</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subject.questions.map((q: any) => (
                              <tr key={q.id}>
                                <td className="text-nowrap">{q.questionNo}</td>
                                <td className="text-nowrap">{q.label}</td>
                                <td className="text-nowrap">{q.maxScore}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            onClick={handleCloseModel}
          />
        </>
      )}

    </div>

  );
}