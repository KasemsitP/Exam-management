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
          Please select an active campaign before importing.
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>File error:</strong> {error}
        </div>
      )}

      {importStatus === "failed" && importError && (
        <div className="alert alert-danger" role="alert">
          <strong>Import failed:</strong> {importError}
        </div>
      )}

      {importStatus === "succeeded" && statsText && (
        <div className="alert alert-success" role="alert">
          <strong>Last import summary:</strong> {statsText}
        </div>
      )}
    </>
  );
}
