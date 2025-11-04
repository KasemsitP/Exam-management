import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Upload } from "lucide-react";

import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  importUsersThunk,
  selectUserImportError,
  selectUserImportStats,
  selectUserImportStatus,
} from "@/store/slices/users.slice";
import { useToast } from "@/components/ui/use-toast";

const PREVIEW_ROW_OPTIONS = [5, 10, 20, 50];
const ENCODINGS = [
  { value: "utf-8", label: "UTF-8" },
  { value: "tis-620", label: "TIS-620 (Thai)" },
];

type ParsedState = {
  rows: Record<string, string>[];
  headers: string[];
};

const isExcel = (name?: string | null) => !!name && /\.(xlsx|xls)$/i.test(name ?? "");
const isCsv = (name?: string | null) => !!name && /\.csv$/i.test(name ?? "");

const trimRow = (row: Record<string, unknown>) =>
  Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[String(key).trim()] = typeof value === "string" ? value.trim() : String(value ?? "");
    return acc;
  }, {});

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unexpected error occurred";
};

const parseWorksheet = (ws: XLSX.WorkSheet): ParsedState => {
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd HH:mm",
  });
  const rows = raw.map(trimRow);
  const headers = Object.keys(rows[0] ?? {});
  return { rows, headers };
};

export default function ImportCsvPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const importStatus = useAppSelector(selectUserImportStatus);
  const importError = useAppSelector(selectUserImportError);
  const importStats = useAppSelector(selectUserImportStats);

  const [fileName, setFileName] = useState<string | null>(null);
  const [encoding, setEncoding] = useState(ENCODINGS[0].value);
  const [previewRows, setPreviewRows] = useState(PREVIEW_ROW_OPTIONS[1]);
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [excelBuffer, setExcelBuffer] = useState<ArrayBuffer | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [excelSelectedSheet, setExcelSelectedSheet] = useState<string>("");

  const supportsImport = Boolean(activeCampaign);
  const isImporting = importStatus === "loading";

  // ถ้ามีการเปลี่ยน campaign ให้เคลียร์ state preview เพื่อลดความสับสน
  useEffect(() => {
    setFileName(null);
    setParsed(null);
    setError(null);
    setExcelBuffer(null);
    setExcelSheetNames([]);
    setExcelSelectedSheet("");
  }, [activeCampaign?.id]);

  const resetState = () => {
    setFileName(null);
    setParsed(null);
    setError(null);
    setExcelBuffer(null);
    setExcelSheetNames([]);
    setExcelSelectedSheet("");
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!supportsImport) {
      toast({
        title: "No campaign selected",
        description: "Please choose an active campaign before importing.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setError(null);

    try {
      if (isExcel(file.name)) {
        const buffer = await file.arrayBuffer();
        setExcelBuffer(buffer);
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetNames = workbook.SheetNames ?? [];
        setExcelSheetNames(sheetNames);
        if (!sheetNames.length) {
          setParsed(null);
          setError("This Excel file does not contain any sheets.");
          return;
        }
        const firstName = sheetNames[0];
        setExcelSelectedSheet(firstName);
        const worksheet = workbook.Sheets[firstName];
        if (!worksheet) {
          setParsed(null);
          setError("Unable to read the first sheet.");
          return;
        }
        const result = parseWorksheet(worksheet);
        if (!result.rows.length) {
          setParsed(null);
          setError("The selected sheet does not contain any data rows.");
          return;
        }
        setParsed(result);
      } else if (isCsv(file.name)) {
        const text = await file.text();
        Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          encoding,
          complete: (results) => {
            if (results.errors?.length) {
              setParsed(null);
              setError(results.errors[0]?.message ?? "Failed to parse CSV.");
              return;
            }
            const rows = (results.data ?? [])
              .map(trimRow)
              .filter((row) => Object.values(row).some(Boolean));
            const headers = Object.keys(rows[0] ?? {});
            if (!rows.length) {
              setParsed(null);
              setError("CSV file does not contain any data rows.");
              return;
            }
            setParsed({ rows, headers });
          },
        });
      } else {
        setParsed(null);
        setError("Please upload a .csv, .xlsx, or .xls file.");
      }
    } catch (e) {
      setParsed(null);
      setError(getErrorMessage(e));
    }
  };

  useEffect(() => {
    if (!excelBuffer || !excelSelectedSheet) return;
    try {
      const workbook = XLSX.read(excelBuffer, { type: "array" });
      const worksheet = workbook.Sheets[excelSelectedSheet];
      if (!worksheet) return;
      const result = parseWorksheet(worksheet);
      setParsed(result.rows.length ? result : { rows: [], headers: [] });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [excelBuffer, excelSelectedSheet]);

  const handleConfirm = async () => {
    if (!parsed || !activeCampaign) return;
    try {
      const result = await dispatch(
        importUsersThunk({
          campaignId: activeCampaign.id,
          rows: parsed.rows,
        })
      ).unwrap();
      const parts = [
        "Created " + result.totalUsersCreated,
        "Existing " + result.totalUsersFound,
        "Campaign links " + result.totalCampaignLinks,
      ];
      toast({
        title: "Import completed",
        description: parts.join(" · "),
      });
      resetState();
    } catch (err) {
      toast({
        title: "Failed to import users",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const preview = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.slice(0, previewRows);
  }, [parsed, previewRows]);

  const summaryText =
    parsed && `${parsed.rows.length.toLocaleString()} rows · ${parsed.headers.length} columns`;

  const statsParts = importStats
    ? [
        "Created " + importStats.totalUsersCreated,
        "Existing " + importStats.totalUsersFound,
        "Campaign links " + importStats.totalCampaignLinks,
      ]
    : [];
  const statsText = statsParts.length ? statsParts.join(" · ") : null;

  return (
    <ShowIfCan permission="manage_users">
      <div className="container-fluid px-3 px-sm-4 py-4">
        <div className="d-flex align-items-start gap-3 mb-3">
          <div className="rounded-circle bg-primary-subtle p-2 text-primary d-inline-flex">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="h4 mb-1">นำเข้าข้อมูลรายชื่อผู้เข้าสอบ (CSV / Excel)</h1>
            <p className="text-muted small mb-0">
              อัปโหลดไฟล์ CSV หรือ Excel ที่มีรายชื่อผู้เข้าสอบ
            </p>
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label">เลือกไฟล์</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="form-control"
                  onChange={handleFile}
                />
                {fileName && (
                  <div className="mt-2 small text-muted">Selected: {fileName}</div>
                )}
              </div>

              <div className="col-md-3">
                <label className="form-label">CSV encoding</label>
                <select
                  className="form-select"
                  value={encoding}
                  onChange={(event) => setEncoding(event.target.value)}
                >
                  {ENCODINGS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">ตัวอย่างแถว</label>
                <select
                  className="form-select"
                  value={previewRows}
                  onChange={(event) => setPreviewRows(Number(event.target.value))}
                >
                  {PREVIEW_ROW_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {excelSheetNames.length > 0 && (
              <div className="row g-4 mt-1">
                <div className="col-md-4">
                  <label className="form-label">Excel sheet</label>
                  <select
                    className="form-select"
                    value={excelSelectedSheet}
                    onChange={(event) => setExcelSelectedSheet(event.target.value)}
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
                {activeCampaign ? (
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
          </div>
        </div>

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

        {parsed && (
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
                    onClick={handleConfirm}
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
                Showing up to {previewRows} rows of {parsed.rows.length.toLocaleString()} total rows.
              </div>
            </div>
          </div>
        )}
      </div>
    </ShowIfCan>
  );
}
