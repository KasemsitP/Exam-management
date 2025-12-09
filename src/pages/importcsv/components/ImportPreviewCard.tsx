// components/ImportPreviewCard.tsx
import { Upload } from "lucide-react";
import type { ParsedState } from "../hooks/useUserImport";

interface ImportPreviewCardProps {
  parsed: ParsedState;
  preview: Record<string, string>[];
  previewRows: number;
  supportsImport: boolean;
  isImporting: boolean;
  summaryText?: string | null;
  statsText?: string | null;
  onConfirm: () => void;
}

export default function ImportPreviewCard({
  parsed,
  preview,
  previewRows,
  supportsImport,
  isImporting,
  summaryText,
  statsText,
  onConfirm,
}: ImportPreviewCardProps) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 text-muted small mb-2">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <span>{parsed.headers.length} columns detected</span>
            <span>{parsed.rows.length} rows detected</span>
            {statsText && (
              <span className="badge text-bg-light">{statsText}</span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {summaryText && <span className="small">{summaryText}</span>}
            <button
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
              onClick={onConfirm}
              disabled={!supportsImport || isImporting}
            >
              <Upload size={16} />
              {isImporting ? "กำลังนำเข้าข้อมูล" : "นำเข้าข้อมูล"}
            </button>
          </div>
        </div>

        <div className="border rounded overflow-hidden">
          <div style={{ maxHeight: 420, overflow: "auto" }}>
            <table className="table table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {parsed.headers.map((header) => (
                    <th key={header} className="text-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {parsed.headers.map((header) => (
                      <td key={header} className="text-nowrap small">
                        {row[header] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="small text-muted mt-2">
          Showing up to {previewRows} rows of{" "}
          {parsed.rows.length.toLocaleString()} total rows.
        </div>
      </div>
    </div>
  );
}
