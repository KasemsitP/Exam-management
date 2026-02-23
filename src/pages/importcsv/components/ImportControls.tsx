// components/ImportControls.tsx
import { ENCODINGS, PREVIEW_ROW_OPTIONS } from "../hooks/useUserImport";

interface ImportControlsProps {
  activeCampaign: any;
  supportsImport: boolean;
  fileName: string | null;
  encoding: string;
  onEncodingChange: (value: string) => void;
  previewRows: number;
  onPreviewRowsChange: (value: number) => void;
  excelSheetNames: string[];
  excelSelectedSheet: string;
  onSheetChange: (value: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resetState: () => void;
}

export default function ImportControls({
  activeCampaign,
  supportsImport,
  fileName,
  encoding,
  onEncodingChange,
  previewRows,
  onPreviewRowsChange,
  excelSheetNames,
  excelSelectedSheet,
  onSheetChange,
  onFileChange,
  resetState
}: ImportControlsProps) {
  return (
    <>
      <div className="row g-4">
        <div className="col-md-6">
          <label className="form-label">เลือกไฟล์</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="form-control"
            onChange={onFileChange}
          />
          {fileName && (
            <div className="mt-2 small text-muted">กำลังเลือกไฟล์: {fileName}</div>
          )}
        </div>

        <div className="col-md-2">
          <label className="form-label">CSV encoding</label>
          <select
            className="form-select"
            value={encoding}
            onChange={(event) => onEncodingChange(event.target.value)}
            disabled={true}
          >
            {ENCODINGS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <label className="form-label">ตัวอย่างแถว</label>
          <select
            className="form-select"
            value={previewRows}
            onChange={(event) => onPreviewRowsChange(Number(event.target.value))}
          >
            {PREVIEW_ROW_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label invisible">dummy</label>
          <button className="btn btn-secondary w-100" onClick={resetState}>
            รีเซ็ต
          </button>
        </div>
      </div>

      {excelSheetNames.length > 0 && (
        <div className="row g-4 mt-1">
          <div className="col-md-4">
            <label className="form-label">Excel sheet</label>
            <select
              className="form-select"
              value={excelSelectedSheet}
              onChange={(event) => onSheetChange(event.target.value)}
            >
              {excelSheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div className="small text-muted mt-1">
              Select the sheet to preview and import.
            </div>
          </div>
        </div>
      )}

      <div className="row g-4 mt-1">
        <div className="col-md-12">
          {supportsImport && activeCampaign ? (
            <div className="alert alert-info mb-0" role="alert">
              นำเข้าสู่รอบสอบ: <strong>{activeCampaign.name}</strong>
            </div>
          ) : (
            <div className="small text-warning mt-1">
              โปรดเลือกข้อมูลรอบสอบที่ใช้งานอยู่ก่อนที่จะนำเข้าข้อมูล
            </div>
          )}
        </div>
      </div>
    </>
  );
}
