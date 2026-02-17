
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
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <h5 className="mb-1 d-flex align-items-center gap-2">
            จัดการเข้ารหัส
          </h5>
          <small className="text-muted">
            การเข้ารหัสใน {activeCampaign?.name ?? "-"}
          </small>
        </div>
      </div>

      <div className="card-body">
        <div className="row g-3">
          {/* Card 1: สถานะการสร้างรอบสอบ */}
          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1 ">
                  <div className="small text-muted mb-1">สถานะสร้างคีย์</div>

                  <div className="d-flex justify-content-between align-items-center border rounded px-3 py-2">
                    <div className="d-flex gap-3">
                      <div>
                        <div className="small text-muted">คีย์ที่ 1</div>
                        <div className={headerSummary?.keyStatusDashboard?.key1_status ? "text-success fw-semibold" : "text-warning fw-semibold"}>
                          {headerSummary?.keyStatusDashboard?.key1_status ? "สร้างแล้ว" : "ยังไม่สร้าง"}
                        </div>
                      </div>

                      <div>
                        <div className="small text-muted">คีย์ที่ 2</div>
                        <div className={headerSummary?.keyStatusDashboard?.key2_status ? "text-success fw-semibold" : "text-warning fw-semibold"}>
                          {headerSummary?.keyStatusDashboard?.key2_status ? "สร้างแล้ว" : "ยังไม่สร้าง"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>

          {/* Card 2: สถานะการนำเข้าข้อมูล */}
          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  สถานะการนำเข้าข้อมูลผู้สมัครสอบ
                </div>
                {/* <div className="h3 mb-0">
                  {importedSessions} / {totalSessions}
                </div> */}
                <div className={importedSessions === totalSessions ? "text-success h3 mb-0" : "text-warning h3 mb-0"}>
                  {importedSessions === totalSessions
                    ? "นำเข้าข้อมูลครบแล้ว"
                    : "ยังนำเข้าไม่ครบ"}

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
          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  สถานะการสร้างคิวอาร์โค้ด
                </div>
                {/* <div className="h3 mb-0">
                  {encryptedSessions} / {totalSessions}
                </div> */}
                <div className={encryptedSessions === totalSessions ? "text-success h3 mb-0 " : "text-warning h3 mb-0"}>
                  {encryptedSessions === totalSessions
                    ? "สร้างคิวอาร์โค้ดครบแล้ว"
                    : "ยังสร้างคิวอาร์โค้ดไม่ครบ"}
                </div>
                {/* <small className={encryptedSessions === totalSessions ? "text-success" : "text-warning"}>
                  {encryptedSessions === totalSessions
                    ? "เข้ารหัสครบทุก Session แล้ว"
                    : "ยังมี Session ที่ยังไม่เข้ารหัสครบ"}
                </small> */}
                <small className={encryptedSessions === totalSessions ? "text-success" : "text-warning"}>
                  &nbsp;
                </small>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-12">
            <div className="card shadow-none border">
              <div className="card-body">
                <small>
                  รายละเอียดวันที่สอบและหัวข้อที่ต้องสอบในแต่ละวัน โดยสอบทั้งหมด {totalSessions} วิชา ซึ่งแต่ละวิชาก็มีหัวข้อที่ต้องสอบแตกต่างกันไป
                </small>

                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0 table-striped">
                    <thead>
                      <tr>
                        <th>วิชา</th>
                        <th>วันที่สอบ</th>
                        <th>เวลา</th>
                        <th className="text-end">รายหัวข้อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(headerSummary.sessionInfo).map((session) =>
                        session.subjects.map((subject) => (
                          <tr key={`${session.session_id}-${subject.subject_id}`}>
                            <td>{subject.subject_name}</td>

                            <td>
                              {new Date(session.exam_date).toLocaleDateString("th-TH")}
                            </td>

                            <td>
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

                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleOpenModel(session.session_id)}
                              >
                                ดูหัวข้อที่ต้องสอบ
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
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedSession.session_code}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModel}
                  />
                </div>

                <div className="modal-body">

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
                    <div key={subject.subject_id} className="mb-4">
                      <h6 className="fw-bold">{subject.subject_name}</h6>

                      <table className="table table-sm table-striped">
                        <thead>
                          <tr>
                            <th>ข้อที่</th>
                            <th>หัวข้อ</th>
                            <th>คะแนนเต็ม</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subject.questions.map((q: any) => (
                            <tr key={q.id}>
                              <td>{q.questionNo}</td>
                              <td>{q.label}</td>
                              <td>{q.maxScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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