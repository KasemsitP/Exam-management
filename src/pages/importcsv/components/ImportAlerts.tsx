// components/ImportAlerts.tsx
interface ImportAlertsProps {
  supportsImport: boolean;
  error: string | null;
  importStatus: string;
  importError: string | null;
  statsText: string | null;
}

export default function ImportAlerts({
  supportsImport,
  error,
  importStatus,
  importError,
  statsText,
}: ImportAlertsProps) {
  return (
    <>
      {!supportsImport && (
        <div className="alert alert-warning" role="alert">
          โปรดเลือกรอบสอบก่อนการนำเข้าข้อมูล
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>ข้อผิดพลาด:</strong> {error}
        </div>
      )}

      {importStatus === "failed" && importError && (
        <div className="alert alert-danger" role="alert">
          <strong>นำเข้าข้อมูลไม่สำเร็จ:</strong> {importError}
        </div>
      )}

      {importStatus === "succeeded" && statsText && (
        <div className="alert alert-success" role="alert">
          <strong>สรุปการนำเข้าล่าสุด:</strong> {statsText}
        </div>
      )}
    </>
  );
}
