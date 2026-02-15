// components/KeyHeader.tsx
import { Search } from "lucide-react";

interface KeyHeaderProps {
  activeCampaign: any;
  headerSummary: {
    totalSessions: number;
    importedSessions: number;
    encryptedSessions: number;
    keyStatusDashboard: any;
    subjects: any[];
    subjectQuestionsGrouped: Record<number, any>;
    sessionDates: any[];
  };
}

export default function RoomsHeader({ activeCampaign,
  headerSummary,
}: KeyHeaderProps) {
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
                <div className="text-uppercase small text-muted mb-1">
                  จำนวนวันที่สอบภายในรอบสอบนี้
                </div>
                <div className="h3 mb-0">
                  {totalSessions} วันที่สอบ
                </div>
                <small className="text-muted">
                  ในรอบสอบนี้มีวันที่สอบ {totalSessions} วัน
                </small>
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

          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-2">
                  วิชาที่สอบ
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>วิชา</th>
                        <th className="text-end">รายหัวข้อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {headerSummary.subjects.map((s) => (
                        <tr key={s.subject_id}>
                          <td>{s.subject_name}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary"
                            // onClick={() => handleClickSubject(s.subject_id)}
                            >
                              ดูหัวข้อที่ต้องสอบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}