// components/KeyHeader.tsx
import { Search } from "lucide-react";

interface KeyHeaderProps {
  activeCampaign: any;
  headerSummary: {
    totalSessions: number;
    importedSessions: number;
    encryptedSessions: number;
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
                  สถานะการสร้างรอบสอบ
                </div>
                <div className="h3 mb-0">
                  {totalSessions} รอบ
                </div>
                <small className="text-muted">
                  มีรอบสอบในแคมเปญนี้ {totalSessions} รอบ
                </small>
              </div>
            </div>
          </div>

          {/* Card 2: สถานะการนำเข้าข้อมูล */}
          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  สถานะการนำเข้าข้อมูล
                </div>
                <div className="h3 mb-0">
                  {importedSessions} / {totalSessions}
                </div>
                <small className={importedSessions === totalSessions ? "text-success" : "text-warning"}>
                  {importedSessions === totalSessions
                    ? "นำเข้าครบทุก Session แล้ว"
                    : "ยังนำเข้าไม่ครบทุก Session"}
                </small>
              </div>
            </div>
          </div>

          {/* Card 3: สถานะการเข้ารหัส */}
          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  สถานะการเข้ารหัส
                </div>
                <div className="h3 mb-0">
                  {encryptedSessions} / {totalSessions}
                </div>
                <small className={encryptedSessions === totalSessions ? "text-success" : "text-warning"}>
                  {encryptedSessions === totalSessions
                    ? "เข้ารหัสครบทุก Session แล้ว"
                    : "ยังมี Session ที่ยังไม่เข้ารหัสครบ"}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}